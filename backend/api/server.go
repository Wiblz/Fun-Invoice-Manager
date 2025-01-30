package api

import (
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/filestore"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/db"
)

type Server struct {
	storageManager  *db.Manager
	router          *mux.Router
	filestoreClient *filestore.Client
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

func NewServer(storageManager *db.Manager, filestoreClient *filestore.Client) *Server {
	s := &Server{
		storageManager:  storageManager,
		filestoreClient: filestoreClient,
	}

	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api/v1").Subrouter()
	apiRouter.HandleFunc("/invoices", s.GetAllInvoicesHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/{hash}/review-status", s.SetReviewedStatus).Methods("PATCH")
	apiRouter.HandleFunc("/invoice/{hash}/payment-status", s.SetPaidStatus).Methods("PATCH")
	apiRouter.HandleFunc("/invoice/{hash}/file", s.GetInvoiceFileHandler).Methods("GET")

	s.router = r
	return s
}
