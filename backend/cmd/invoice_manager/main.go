package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Wiblz/Fun-Invoice-Manager/backend/api"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage"
)

func main() {
	storageManager, err := storage.NewManagerOfType("sqlite", "invoice.db")
	if err != nil {
		panic(err)
	}

	s := api.NewServer(storageManager)
	go s.Run()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutdown Server ...")
	if err := s.Shutdown(); err != nil {
		log.Printf("Failed to shutdown server properly: %v", err)
	}
	log.Println("Server exiting")
}
