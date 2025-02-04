package main

import (
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/db"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/storage/filestore"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Wiblz/Fun-Invoice-Manager/backend/api"
	"github.com/spf13/viper"
)

const (
	defaultLogPath    = "../logs/invoice.log"
	defaultSQLiteFile = "invoice.db"
)

func newLogger(production bool, path string) *zap.Logger {
	var encoder zapcore.Encoder
	if production {
		encoder = zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig())
	} else {
		encoder = zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig())
	}

	writer := zapcore.AddSync(&lumberjack.Logger{
		Filename:   path,
		MaxSize:    10,
		MaxBackups: 20,
		MaxAge:     100,
		Compress:   true,
	})

	core := zapcore.NewCore(encoder, zapcore.NewMultiWriteSyncer(writer, zapcore.AddSync(os.Stdout)), zap.InfoLevel)

	return zap.New(core)
}

func main() {
	config := viper.New()
	config.SetConfigFile(".env")
	err := config.ReadInConfig()
	if err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}

	production := config.GetBool("PRODUCTION")
	logPath := config.GetString("LOG_PATH")
	if logPath == "" {
		logPath = defaultLogPath
	}

	logger := newLogger(production, logPath)
	defer logger.Sync()

	sqliteFile := config.GetString("SQLITE_FILE")
	if sqliteFile == "" {
		config.Set("SQLITE_FILE", defaultSQLiteFile)
	}

	storageManager, err := db.NewManagerOfType("sqlite", logger, config.GetString("SQLITE_FILE"))
	if err != nil {
		logger.Fatal("Failed to create storage manager", zap.Error(err))
	}

	filestoreClient, err := filestore.NewClient(config, logger)
	if err != nil {
		logger.Fatal("Failed to create filestore client", zap.Error(err))
	}

	s := api.NewServer(storageManager, filestoreClient, logger)
	go s.Run()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")
	if err := s.Shutdown(); err != nil {
		logger.Error("Failed to shutdown server properly", zap.Error(err))
	}
	logger.Info("Server exiting")
	os.Exit(0)
}
