package model

type Invoice struct {
	FileHash         string `gorm:"primaryKey" json:"fileHash"`
	OriginalFileName string `json:"originalFileName"`
	InvoiceNumber    string `json:"invoiceNumber"`
	InvoiceDate      string `json:"invoiceDate"`
	InvoiceAmount    string `json:"invoiceAmount"`
	IsPaid           bool   `json:"isPaid"`
	IsReviewed       bool   `json:"isViewed"`
}
