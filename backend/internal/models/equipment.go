package models

import "time"

type Equipment struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	Category     string    `json:"category"`
	PurchaseDate time.Time `json:"purchase_date"`
	Status       string    `json:"status"` 
	Price        float64   `json:"price"`
	SupplierID   *int      `json:"supplier_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}
