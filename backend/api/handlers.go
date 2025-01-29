package api

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"net/http"
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
	hash := vars["hash"] // It is guaranteed to be present by the router

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
	hash := vars["hash"] // It is guaranteed to be present by the router

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

//func GetInvoiceFileHandler(w http.ResponseWriter, r *http.Request) {
//	vars := mux.Vars(r)
//	hash, present := vars["hash"]
//	if !present {
//		w.WriteHeader(http.StatusBadRequest)
//	}
//
//	// Get the invoice file from the storage manager
//	// and write it to the response writer
//
//}
