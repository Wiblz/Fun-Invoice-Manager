package db

import "github.com/Wiblz/Fun-Invoice-Manager/backend/model"

func (m *Manager) GetInvoiceByHash(hash string) (*model.Invoice, error) {
	var invoice model.Invoice
	result := m.DB.First(&invoice, "file_hash = ?", hash)
	if result.Error != nil {
		return nil, result.Error
	}

	return &invoice, nil
}

func (m *Manager) GetInvoices(offset, limit int) ([]*model.Invoice, error) {
	var invoices []*model.Invoice
	result := m.DB.Offset(offset).Limit(limit).Find(&invoices)
	if result.Error != nil {
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
		return result.Error
	}

	return nil
}

// UpdateInvoice updates the invoice in the database
// It is an alias for UpsertInvoice, as it achieves the same effect
func (m *Manager) UpdateInvoice(invoice *model.Invoice) error {
	return m.UpsertInvoice(invoice)
}
