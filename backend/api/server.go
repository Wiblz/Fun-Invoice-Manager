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

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Log the request for debugging
		log.Printf("Request: Method: %s, URL: %s", r.Method, r.URL)

		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "300")

		// Handle preflight
		if r.Method == http.MethodOptions {
			log.Println("Handling OPTIONS request")
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func NewServer(storageManager *db.Manager, filestoreClient *filestore.Client) *Server {
	s := &Server{
		storageManager:  storageManager,
		filestoreClient: filestoreClient,
	}

	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api/v1").Subrouter()
	apiRouter.Use(corsMiddleware)
	apiRouter.HandleFunc("/invoices", s.GetAllInvoicesHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/{hash}/review-status", s.SetReviewedStatus).Methods("PATCH")
	apiRouter.HandleFunc("/invoice/{hash}/payment-status", s.SetPaidStatus).Methods("PATCH")
	apiRouter.HandleFunc("/invoice/{hash}/file", s.GetInvoiceFileHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/upload", s.FileUploadHandler).Methods("POST", "OPTIONS")

	s.router = r
	return s
}
