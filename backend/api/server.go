package api

import (
	"context"
	"fmt"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/filestore"
	"go.uber.org/zap"
	"maps"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gorilla/mux"

	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/db"
)

type Server struct {
	storageManager  *db.Manager
	router          *mux.Router
	filestoreClient *filestore.Client

	logger *zap.Logger
}

func (s *Server) Run() {
	s.logger.Info("Server is running at :8080")
	err := http.ListenAndServe(":8080", s.router)
	if err != nil {
		s.logger.Error("Server returned an error", zap.Error(err))
	}
}

func (s *Server) SyncFilestore() {
	start := time.Now()
	s.logger.Info("Syncing filestore")
	filenames, err := s.filestoreClient.GetBucketFilenames(context.Background())
	if err != nil {
		s.logger.Error("Failed to sync filestore", zap.Error(err))
	}

	existingHashes := make([]string, 0, len(filenames))
	for filename := range maps.Keys(filenames) {
		hash := filename[:len(filename)-len(filepath.Ext(filename))]
		existingHashes = append(existingHashes, hash)
	}

	s.logger.Debug("Existing hashes in filestore", zap.Strings("hashes", existingHashes))
	err = s.storageManager.UpdateInvoiceFileExists(existingHashes)
	if err != nil {
		s.logger.Error("Failed to update file exists status in database", zap.Error(err))
	}

	s.logger.Info("Filestore sync complete", zap.Duration("duration", time.Since(start)))
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

func (s *Server) loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ip := r.RemoteAddr

		// Create a response writer to capture the status code
		rw := &responseWriter{w, http.StatusOK}

		next.ServeHTTP(rw, r)

		duration := time.Since(start)

		s.logger.Info(fmt.Sprintf("[%s] %s", r.Method, r.URL.Path), zap.Int("status", rw.statusCode), zap.Duration("duration", duration), zap.String("ip", ip))
	})
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, PATCH, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "300")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func NewServer(storageManager *db.Manager, filestoreClient *filestore.Client, logger *zap.Logger) *Server {
	s := &Server{
		storageManager:  storageManager,
		filestoreClient: filestoreClient,
		logger:          logger,
	}

	r := mux.NewRouter()
	apiRouter := r.PathPrefix("/api/v1").Subrouter()
	apiRouter.Use(s.corsMiddleware)
	apiRouter.Use(s.loggingMiddleware)
	apiRouter.HandleFunc("/invoices", s.GetAllInvoicesHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/{hash}/exists", s.CheckInvoiceExistsHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/{hash}", s.GetInvoiceHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/{hash}", s.UpdateInvoiceHandler).Methods("PATCH", "OPTIONS")
	apiRouter.HandleFunc("/invoice/{hash}/file", s.GetInvoiceFileHandler).Methods("GET")
	apiRouter.HandleFunc("/invoice/upload", s.FileUploadHandler).Methods("POST", "OPTIONS")

	s.router = r
	return s
}
