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
	"github.com/tmc/langchaingo/llms/openai"
)

const (
	defaultLogPath    = "../logs/invoice.log"
	defaultLogLevel   = zapcore.InfoLevel
	defaultSQLiteFile = "invoice.db"
)

func newLogger(production bool, debug bool, path string) *zap.Logger {
	var encoder zapcore.Encoder
	level := defaultLogLevel
	if production {
		encoder = zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig())
	} else {
		encoder = zapcore.NewConsoleEncoder(zap.NewDevelopmentEncoderConfig())
	}

	if debug {
		level = zapcore.DebugLevel
	}

	writer := zapcore.AddSync(&lumberjack.Logger{
		Filename:   path,
		MaxSize:    10,
		MaxBackups: 20,
		MaxAge:     100,
		Compress:   true,
	})

	core := zapcore.NewCore(encoder, zapcore.NewMultiWriteSyncer(writer, zapcore.AddSync(os.Stdout)), level)

	return zap.New(core)
}

func main() {
	config := viper.New()
	config.SetConfigFile(".env")
	config.AutomaticEnv()
	err := config.ReadInConfig()
	if err != nil {
		log.Fatalf("Failed to read config: %v", err)
	}

	production := config.GetBool("PRODUCTION")
	debug := config.GetBool("DEBUG")
	logPath := config.GetString("LOG_PATH")
	if logPath == "" {
		logPath = defaultLogPath
	}

	logger := newLogger(production, debug, logPath)
	defer logger.Sync()

	var llm *openai.LLM
	groqApiKey := config.GetString("GROQ_API_KEY")
	if groqApiKey != "" {
		llm, err = openai.New(
			openai.WithModel("llama3-8b-8192"),
			openai.WithResponseFormat(openai.ResponseFormatJSON),
			openai.WithBaseURL("https://api.groq.com/openai/v1"),
			openai.WithToken(groqApiKey),
		)
		if err != nil {
			logger.Warn("Failed to create LLM client, invoices will not be processed by LLM", zap.Error(err))
		}
	} else {
		logger.Warn("GROQ_API_KEY not set, invoices will not be processed by LLM")
	}

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

	s := api.NewServer(storageManager, filestoreClient, llm, logger)
	s.SyncFilestore()
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
