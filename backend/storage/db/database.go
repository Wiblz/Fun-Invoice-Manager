package db

import (
	"errors"
	"github.com/Wiblz/Fun-Invoice-Manager/backend/model"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func (m *Manager) GetInvoiceByHash(hash string) (*model.Invoice, error) {
	var invoice model.Invoice
	result := m.DB.First(&invoice, "file_hash = ?", hash)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}

		m.logger.Error("Failed to retrieve invoice by hash", zap.String("hash", hash), zap.Error(result.Error))
		return nil, result.Error
	}

	return &invoice, nil
}

func (m *Manager) GetInvoices(offset, limit int) ([]*model.Invoice, error) {
	var invoices []*model.Invoice
	result := m.DB.Offset(offset).Limit(limit).Find(&invoices)
	if result.Error != nil {
		m.logger.Error("Failed to retrieve invoices", zap.Error(result.Error), zap.Int("offset", offset), zap.Int("limit", limit))
		return nil, result.Error
	}

	return invoices, nil
}

func (m *Manager) GetAllInvoices() ([]*model.Invoice, error) {
	return m.GetInvoices(0, -1)
}

func (m *Manager) UpsertInvoice(invoice *model.Invoice) error {
	result := m.DB.Save(invoice)
	if result.Error != nil {
		m.logger.Error("Failed to upsert invoice", zap.Error(result.Error), zap.Any("invoice", invoice))
		return result.Error
	}

	m.logger.Info("Upserted invoice", zap.Any("invoice", invoice))
	return nil
}

func (m *Manager) UpdateInvoice(invoice *model.Invoice, returning bool) (*model.Invoice, error) {
	result := m.DB.Model(&invoice)

	if returning {
		result = result.Clauses(clause.Returning{})
	}

	result = result.Updates(invoice)
	if result.Error != nil {
		m.logger.Error("Failed to update invoice", zap.Error(result.Error), zap.String("hash", invoice.FileHash), zap.Any("invoice update", &invoice))
		return nil, result.Error
	}

	if returning {
		return invoice, nil
	}

	return nil, nil
}

func (m *Manager) UpdateInvoiceFileExists(existingHashes []string) error {
	result := m.DB.Exec(`
		UPDATE invoices
		SET file_exists = CASE
			WHEN file_hash IN ? THEN true
			ELSE false
		END
	`, existingHashes)

	if result.Error != nil {
		m.logger.Error("Failed to update invoice file exists", zap.Error(result.Error))
		return result.Error
	}

	return nil
}
