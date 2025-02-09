package api

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/model"
	"github.com/gen2brain/go-fitz"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"time"
)

const (
	// Max file size in bytes
	maxFileSize = 10 * 1024 * 1024
)

func (s *Server) GetAllInvoicesHandler(w http.ResponseWriter, _ *http.Request) {
	invoices, err := s.storageManager.GetAllInvoices()
	if err != nil {
		s.logger.Error("Failed to retrieve all invoices from database", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	jsonInvoices, err := json.Marshal(invoices)
	if err != nil {
		s.logger.Error("Failed to marshal invoices to JSON", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonInvoices)
}

func (s *Server) CheckInvoiceExistsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	hash, present := vars["hash"]
	if !present {
		s.logger.Error("Hash path parameter is missing. This handler should not have been called, check the router", zap.String("path", r.URL.Path))
		w.WriteHeader(http.StatusBadRequest)
	}

	invoice, err := s.storageManager.GetInvoiceByHash(hash)
	if err != nil {
		s.logger.Error("Failed to retrieve invoice from database", zap.String("hash", hash), zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if invoice == nil {
		w.Write([]byte("false"))
	} else {
		w.Write([]byte("true"))
	}
}

func (s *Server) updateInvoiceStatus(w http.ResponseWriter, r *http.Request, statusField string) {
	vars := mux.Vars(r)
	hash, present := vars["hash"]
	if !present {
		s.logger.Error("Hash path parameter is missing. This handler should not have been called, check the router", zap.String("path", r.URL.Path))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var requestBody map[string]bool
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		s.logger.Warn("Failed to decode request body", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	updateFields := map[string]interface{}{}
	switch statusField {
	case "isPaid":
		updateFields["IsPaid"] = requestBody["isPaid"]
	case "isReviewed":
		updateFields["IsReviewed"] = requestBody["isReviewed"]
	}

	invoice, err := s.storageManager.UpdateInvoiceFields(hash, updateFields, true)
	if err != nil {
		s.logger.Error("Failed to update invoice in database", zap.String("hash", hash), zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	jsonInvoice, err := json.Marshal(invoice)
	if err != nil {
		s.logger.Error("Failed to marshal updated invoice to JSON", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write(jsonInvoice)
}

func (s *Server) SetReviewedStatus(w http.ResponseWriter, r *http.Request) {
	s.updateInvoiceStatus(w, r, "isReviewed")
}

func (s *Server) SetPaidStatus(w http.ResponseWriter, r *http.Request) {
	s.updateInvoiceStatus(w, r, "isPaid")
}

func (s *Server) GetInvoiceFileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	hash, present := vars["hash"]
	if !present {
		s.logger.Error("Hash path parameter is missing. This handler should not have been called, check the router", zap.String("path", r.URL.Path))
		w.WriteHeader(http.StatusBadRequest)
	}

	fileURL, err := s.filestoreClient.GetFileLink(r.Context(), hash+".pdf")
	if err != nil {
		s.logger.Error("Failed to get file link from filestore", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	urlBytes, err := json.Marshal(fileURL.String())
	if err != nil {
		s.logger.Error("Failed to marshal file URL", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write(urlBytes)
}

func (s *Server) FileUploadHandler(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("invoice")
	if err != nil {
		s.logger.Warn("Failed to get file from form", zap.Error(err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Validate file type and size
	if filepath.Ext(header.Filename) != ".pdf" ||
		header.Size > maxFileSize {
		s.logger.Warn("Invalid file type or size", zap.String("filename", header.Filename), zap.Int64("size", header.Size))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		s.logger.Warn("Failed to compute file hash", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	filenames, err := s.filestoreClient.GetBucketFilenames(r.Context())
	if err != nil {
		s.logger.Warn("Failed to fetch filenames from filestore", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Check if the file is not already uploaded, compare hash
	filename := fmt.Sprintf("%x.pdf", hash.Sum(nil))
	if _, present := filenames[filename]; present {
		s.logger.Warn("File already exists", zap.String("filename", filename))
		w.WriteHeader(http.StatusConflict)
		return
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		s.logger.Error("Failed to reset file pointer", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Upload the file to the filestore
	err = s.filestoreClient.PutFile(r.Context(), filename, file)
	if err != nil {
		s.logger.Error("Failed to upload file to filestore", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Reset file pointer for text extraction
	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		s.logger.Error("Failed to reset file pointer", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Extract text from the PDF
	doc, err := fitz.NewFromReader(file)
	if err != nil {
		s.logger.Warn("Failed to open PDF file for text extraction", zap.String("filename", header.Filename), zap.Error(err))
	}

	var text string
	for i := 0; i < doc.NumPage(); i++ {
		pageText, err := doc.Text(i)
		if err != nil {
			s.logger.Warn("Failed to extract text from PDF page", zap.Int("page", i), zap.String("filename", header.Filename), zap.Error(err))
			continue
		}

		text += pageText
	}

	// it's fine if id is not present
	var id *string
	idStr := r.FormValue("id")
	if idStr != "" {
		id = &idStr
	}

	var invoiceDate *time.Time
	if dateStr := r.FormValue("date"); dateStr != "" {
		date, err := time.Parse("2006-01-02", dateStr)
		if err == nil {
			invoiceDate = &date
		} else {
			s.logger.Warn("Invalid date format", zap.String("date", dateStr), zap.Error(err))
		}
	}

	amount, err := strconv.ParseFloat(r.FormValue("amount"), 64)
	if err != nil {
		amount = 0.0
	}

	isPaid, err := strconv.ParseBool(r.FormValue("isPaid"))
	if err != nil {
		s.logger.Warn("Invalid isPaid value", zap.String("isPaid", r.FormValue("isPaid")), zap.Error(err))
		isPaid = false
	}

	isReviewed, err := strconv.ParseBool(r.FormValue("isReviewed"))
	if err != nil {
		s.logger.Warn("Invalid isReviewed value", zap.String("isReviewed", r.FormValue("isReviewed")), zap.Error(err))
		isReviewed = false
	}

	invoice := &model.Invoice{
		FileHash:         fmt.Sprintf("%x", hash.Sum(nil)),
		OriginalFileName: header.Filename,
		ID:               id,
		Date:             invoiceDate,
		Amount:           &amount,
		IsPaid:           isPaid,
		IsReviewed:       isReviewed,
		RawText:          text,
	}

	err = s.storageManager.UpsertInvoice(invoice)
	if err != nil {
		s.logger.Error("Failed to save invoice to database", zap.Error(err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
