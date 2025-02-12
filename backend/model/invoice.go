package model

import "time"

type Invoice struct {
	FileHash         string     `gorm:"primaryKey" json:"fileHash"`
	OriginalFileName string     `json:"originalFileName"`
	ID               *string    `json:"id"` // not an id in database sense, just to cover invoice "numbers" with any characters
	Date             *time.Time `json:"date"`
	Amount           *float64   `json:"amount"`
	IsPaid           bool       `json:"isPaid"`
	IsReviewed       bool       `json:"isReviewed"`
	RawText          string     `json:"-"`
	FileExists       bool       `json:"fileExists"` // if the file is stored in filestore
}

// InvoiceUpdate is the request body for updating an existing invoice
// Some Invoice fields cannot be updated
type InvoiceUpdate struct {
	FileHash   string     `json:"fileHash"` // cannot be updated, used as identifier
	ID         *string    `json:"id"`
	Date       *time.Time `json:"date"`
	Amount     *float64   `json:"amount"`
	IsPaid     *bool      `json:"isPaid"`
	IsReviewed *bool      `json:"isReviewed"`
}

func (iu *InvoiceUpdate) ToInvoice() *Invoice {
	invoice := &Invoice{
		FileHash: iu.FileHash,
		ID:       iu.ID,
		Date:     iu.Date,
		Amount:   iu.Amount,
	}

	if iu.IsPaid != nil {
		invoice.IsPaid = *iu.IsPaid
	}

	if iu.IsReviewed != nil {
		invoice.IsReviewed = *iu.IsReviewed
	}

	return invoice
}
