package model

import (
	"database/sql/driver"
	"fmt"
	"time"
)

type FormDate struct {
	date *time.Time
}

func (f *FormDate) MarshalJSON() ([]byte, error) {
	if f.date == nil {
		return []byte("null"), nil
	}

	return []byte(fmt.Sprintf(`"%s"`, f.date.Format("2006-01-02"))), nil
}

func (f *FormDate) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		f.date = nil
		return nil
	}

	date, err := time.Parse(`"2006-01-02"`, string(data))
	if err != nil {
		return err
	}

	f.date = &date
	return nil
}

func (f *FormDate) Scan(value interface{}) error {
	if value == nil {
		f.date = nil
		return nil
	}

	switch v := value.(type) {
	case time.Time:
		f.date = &v
	case *time.Time:
		f.date = v
	case []byte:
		date, err := time.Parse("2006-01-02", string(v))
		if err != nil {
			return err
		}
		f.date = &date
	default:
		return fmt.Errorf("cannot convert %T to FormDate", value)
	}

	return nil
}

func (f FormDate) Value() (driver.Value, error) {
	if f.date == nil {
		return nil, nil
	}

	return *f.date, nil
}
