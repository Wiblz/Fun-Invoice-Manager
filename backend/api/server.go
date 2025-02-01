package api

import (
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/filestore"
	"log"
	"net/http"
	"time"

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

// responseWriter is a wrapper around http.ResponseWriter that captures the status code for logging purposes
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ip := r.RemoteAddr

		// Create a response writer to capture the status code
		rw := &responseWriter{w, http.StatusOK}

		next.ServeHTTP(rw, r)

		duration := time.Since(start)
		log.Printf("[%s] %s - %v in %v (%s)", r.Method, r.URL.Path, rw.statusCode, duration, ip)
	})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	apiRouter.Use(loggingMiddleware)
	apiRouter.HandleFunc("/invoices", s.GetAllInvoicesHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/{hash}/review-status", s.SetReviewedStatus).Methods("PATCH")
	apiRouter.HandleFunc("/invoice/{hash}/payment-status", s.SetPaidStatus).Methods("PATCH")
	apiRouter.HandleFunc("/invoice/{hash}/file", s.GetInvoiceFileHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/upload", s.FileUploadHandler).Methods("POST", "OPTIONS")

	s.router = r
	return s
}
