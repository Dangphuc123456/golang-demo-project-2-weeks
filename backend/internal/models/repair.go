package models

import "time"

type RepairHistory struct {
	ID              int       `json:"id"`
	RepairDate      time.Time `json:"repair_date"`
	IssueDesc       string    `json:"issue_description"`
	Cost            float64   `json:"cost"`
	TechnicianID    *int      `json:"technician_id,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	MaintenanceID   int       `json:"maintenance_id"`
}
