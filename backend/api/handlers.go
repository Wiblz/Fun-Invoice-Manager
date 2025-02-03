package api

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/model"
	"github.com/gorilla/mux"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"time"
)

const (
	// Max file size in bytes
	maxFileSize = 10 * 1024 * 1024
)

func (s *Server) GetAllInvoicesHandler(w http.ResponseWriter, r *http.Request) {
	invoices, err := s.storageManager.GetAllInvoices()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	jsonInvoices, err := json.Marshal(invoices)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonInvoices)
}

func (s *Server) SetReviewedStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	hash, present := vars["hash"]
	if !present {
		w.WriteHeader(http.StatusBadRequest)
	}

	invoice, err := s.storageManager.GetInvoiceByHash(hash)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var requestBody struct {
		IsReviewed bool `json:"isReviewed"`
	}
	err = json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	invoice.IsReviewed = requestBody.IsReviewed
	err = s.storageManager.UpdateInvoice(invoice)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) SetPaidStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	hash, present := vars["hash"]
	if !present {
		w.WriteHeader(http.StatusBadRequest)
	}

	invoice, err := s.storageManager.GetInvoiceByHash(hash)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var requestBody struct {
		IsPaid bool `json:"isPaid"`
	}
	err = json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	invoice.IsPaid = requestBody.IsPaid
	err = s.storageManager.UpdateInvoice(invoice)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) GetInvoiceFileHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	hash, present := vars["hash"]
	if !present {
		w.WriteHeader(http.StatusBadRequest)
	}

	fileURL, err := s.filestoreClient.GetFileLink(r.Context(), hash+".pdf")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	urlBytes, err := json.Marshal(fileURL.String())
	w.Write(urlBytes)
}

func (s *Server) FileUploadHandler(w http.ResponseWriter, r *http.Request) {
	file, header, err := r.FormFile("invoice")
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Check if the file is a PDF
	// Check if the file is not too big
	if filepath.Ext(header.Filename) != ".pdf" ||
		header.Size > maxFileSize {
		log.Println("Invalid file")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	filenames, err := s.filestoreClient.GetBucketFilenames(r.Context())
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Check if the file is not already uploaded, compare hash
	filename := fmt.Sprintf("%v.pdf", fmt.Sprintf("%x", hash.Sum(nil)))
	if _, present := filenames[filename]; present {
		log.Println("File already uploaded")
		w.WriteHeader(http.StatusConflict)
		return
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Upload the file to the filestore
	err = s.filestoreClient.PutFile(r.Context(), filename, file)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.Printf("Form data: %v\n", r.Form)

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
			log.Printf("could not parse date: %v", err)
		}
	}

	amount, err := strconv.ParseFloat(r.FormValue("amount"), 64)
	if err != nil {
		amount = 0.0
	}

	isPaid, err := strconv.ParseBool(r.FormValue("isPaid"))
	if err != nil {
		log.Printf("could not parse isPaid: %v, setting to false", err)
		isPaid = false
	}

	isReviewed, err := strconv.ParseBool(r.FormValue("isReviewed"))
	if err != nil {
		log.Printf("could not parse isReviewed: %v, setting to false", err)
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
	}

	err = s.storageManager.UpsertInvoice(invoice)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
