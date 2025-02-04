package db

import (
	"errors"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/model"
	"go.uber.org/zap"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type Manager struct {
	DB     *gorm.DB
	logger *zap.Logger
}

func newSQLiteManager(file string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(file), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&model.Invoice{})
	if err != nil {
		return nil, err
	}

	return db, nil
}

func NewManagerOfType(managerType string, logger *zap.Logger, args ...string) (*Manager, error) {
	var db *gorm.DB
	var err error
	switch managerType {
	case "sqlite":
		if len(args) != 1 {
			return nil, errors.New("sqlite storage manager requires exactly one argument")
		}
		db, err = newSQLiteManager(args[0])
		if err != nil {
			return nil, err
		}
	default:
		return nil, errors.New("unknown storage manager type")
	}

	return &Manager{DB: db, logger: logger}, nil
}
