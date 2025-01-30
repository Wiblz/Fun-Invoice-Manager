package api

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux"
	"io"
	"net/http"
	"path/filepath"
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

	fileURL, err := s.filestoreClient.GetFileLink(r.Context(), hash)
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
		fmt.Println(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Check if the file is a PDF
	// Check if the file is not too big
	if filepath.Ext(header.Filename) != ".pdf" ||
		header.Size > maxFileSize {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	filenames, err := s.filestoreClient.GetBucketFilenames(r.Context())
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Check if the file is not already uploaded, compare hash
	filename := fmt.Sprintf("%v.pdf", fmt.Sprintf("%x", hash.Sum(nil)))
	if _, present := filenames[filename]; present {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Upload the file to the filestore
	err = s.filestoreClient.PutFile(r.Context(), filename, file)
	if err != nil {
		fmt.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
