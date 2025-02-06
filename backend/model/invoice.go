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
}
