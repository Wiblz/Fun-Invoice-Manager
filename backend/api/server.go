package api

import (
	"github.com/gorilla/mux"
	"log"
	"main/storage"
	"net/http"
)

type Server struct {
	storageManager *storage.Manager
	router         *mux.Router
}

func (s *Server) Run() {
	log.Printf("Server is running at :8080")
	err := http.ListenAndServe(":8080", s.router)
	if err != nil {
		log.Printf("Server returned an error: %v", err)
	}
}

func (s *Server) Shutdown() error {
	return nil
}

func NewServer(storageManager *storage.Manager) *Server {
	s := &Server{storageManager: storageManager}

	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api/v1").Subrouter()
	apiRouter.HandleFunc("/invoices", s.GetAllInvoicesHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/{hash}/review-status", s.SetReviewedStatus).Methods("PATCH")
	apiRouter.HandleFunc("/invoice/{hash}/payment-status", s.SetPaidStatus).Methods("PATCH")
	//apiRouter.HandleFunc("/invoice/{hash}", GetInvoiceFileHandler).Methods("GET")

	s.router = r
	return s
}
