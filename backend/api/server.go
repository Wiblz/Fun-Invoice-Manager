package api

import (
	"github.com/gorilla/mux"
	"main/storage"
)

type Server struct {
	storageManager *storage.Manager
	R              *mux.Router
}

func (s *Server) Shutdown() error {
	return nil
}

func NewServer(storageManager *storage.Manager) *Server {
	s := &Server{storageManager: storageManager}

	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api/v1").Subrouter()
	apiRouter.HandleFunc("/", s.HandleHome()).Methods("GET")
	apiRouter.HandleFunc("/invoices", s.GetAllInvoicesHandler).Methods("GET")
	//apiRouter.HandleFunc("/invoice/{hash}", GetInvoiceFileHandler).Methods("GET")

	s.R = r
	return s
}
