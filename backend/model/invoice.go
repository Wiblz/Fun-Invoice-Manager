package model

import (
	"net/url"
	"strconv"
	"time"
)

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

func (i *Invoice) FromFormData(form *url.Values) {
	// it's fine if id is not present
	idStr := form.Get("id")
	if idStr != "" {
		i.ID = &idStr
	}

	if dateStr := form.Get("date"); dateStr != "" {
		date, err := time.Parse("2006-01-02", dateStr)
		if err == nil {
			i.Date = &date
		}
	}

	amount, err := strconv.ParseFloat(form.Get("amount"), 64)
	if err == nil {
		i.Amount = &amount
	}

	isPaid, err := strconv.ParseBool(form.Get("isPaid"))
	if err == nil {
		i.IsPaid = isPaid
	}

	isReviewed, err := strconv.ParseBool(form.Get("isReviewed"))
	if err == nil {
		i.IsReviewed = isReviewed
	}
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
