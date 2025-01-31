package main

import (
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/db"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/filestore"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Wiblz/Fun-Invoice-Manager/backend/api"
	"github.com/spf13/viper"
)

const (
	defaultSQLiteFile = "invoice.db"
)

func main() {
	config := viper.New()
	config.SetConfigFile(".env")
	err := config.ReadInConfig()
	if err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}

	sqliteFile := config.GetString("SQLITE_FILE")
	if sqliteFile == "" {
		config.Set("SQLITE_FILE", defaultSQLiteFile)
	}

	storageManager, err := db.NewManagerOfType("sqlite", config.GetString("SQLITE_FILE"))
	if err != nil {
		log.Fatalf("Failed to create storage manager: %v", err)
	}

	filestoreClient, err := filestore.NewClient(config)
	if err != nil {
		log.Fatalf("Failed to create filestore client: %v", err)
	}

	s := api.NewServer(storageManager, filestoreClient)
	go s.Run()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutdown Server ...")
	if err := s.Shutdown(); err != nil {
		log.Printf("Failed to shutdown server properly: %v", err)
	}
	log.Println("Server exiting")
	os.Exit(0)
}
