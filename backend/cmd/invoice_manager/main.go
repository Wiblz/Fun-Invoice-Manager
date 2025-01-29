package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"main/api"
	"main/storage"
)

func main() {
	storageManager, err := storage.NewManagerOfType("sqlite", "invoice.db")
	if err != nil {
		panic(err)
	}

	s := api.NewServer(storageManager)

	// TODO: Move to a Server method
	go func() {
		log.Printf("Server is running at :8080", err)
		err := http.ListenAndServe(":8080", s.R)
		if err != nil {
			log.Printf("Server returned an error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutdown Server ...")
	if err := s.Shutdown(); err != nil {
		log.Printf("Failed to shutdown server properly: %v", err)
	}
	log.Println("Server exiting")
}
