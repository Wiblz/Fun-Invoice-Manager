package db

import (
	"github.com/Wiblz/Fun-Invoice-Manager/backend/model"
	"go.uber.org/zap"
)

func (m *Manager) GetInvoiceByHash(hash string) (*model.Invoice, error) {
	var invoice model.Invoice
	result := m.DB.First(&invoice, "file_hash = ?", hash)
	if result.Error != nil {
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

// UpdateInvoice updates the invoice in the database
// It is an alias for UpsertInvoice, as it achieves the same effect
func (m *Manager) UpdateInvoice(invoice *model.Invoice) error {
	return m.UpsertInvoice(invoice)
}
