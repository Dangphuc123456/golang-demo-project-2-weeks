package models

import "time"

type MaintenanceSchedule struct {
	ID            int       `json:"id"`
	EquipmentID   int       `json:"equipment_id"`
	ScheduledDate time.Time `json:"scheduled_date"`
	Description   string    `json:"description"`
	Status        string    `json:"status"` 
	TechnicianID  *int       `json:"technician_id,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}
