package api

import (
	"encoding/json"
	"net/http"
)

func (s *Server) HandleHome() func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, World!"))
	}
}

func (s *Server) GetAllInvoicesHandler(w http.ResponseWriter, r *http.Request) {
	// Get all invoices from the storage manager
	// and write them to the response writer
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
