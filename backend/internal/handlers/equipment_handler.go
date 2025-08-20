package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
   
	"github.com/gorilla/mux"
	"my-fullstack-project/backend/internal/models"
)

// GET /equipments - Lấy danh sách thiết bị
func GetEquipments(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, price, purchase_date, status, supplier_id, created_at FROM equipments")
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	var equipments []models.Equipment
	for rows.Next() {
		var eq models.Equipment
		var purchaseDate sql.NullTime
		var supplierID sql.NullInt64

		if err := rows.Scan(&eq.ID, &eq.Name, &eq.Price, &purchaseDate, &eq.Status, &supplierID, &eq.CreatedAt); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		// Gán purchaseDate
		if purchaseDate.Valid {
			eq.PurchaseDate = purchaseDate.Time
		} else {
			eq.PurchaseDate = time.Time{} // zero value
		}

		// Gán supplierID
		if supplierID.Valid {
			id := int(supplierID.Int64)
			eq.SupplierID = &id
		} else {
			eq.SupplierID = nil
		}

		equipments = append(equipments, eq)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(equipments)
}

// POST /equipments - Thêm thiết bị mới
func CreateEquipment(w http.ResponseWriter, r *http.Request) {
	var eq models.Equipment
	if err := json.NewDecoder(r.Body).Decode(&eq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var supplierID interface{}
	if eq.SupplierID != nil {
		supplierID = *eq.SupplierID
	} else {
		supplierID = nil
	}

	res, err := db.Exec(
		"INSERT INTO equipments (name, price, purchase_date, status, supplier_id) VALUES (?, ?, ?, ?, ?)",
		eq.Name, eq.Price, eq.PurchaseDate, eq.Status, supplierID,
	)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	lastID, _ := res.LastInsertId()
	eq.ID = int(lastID)
	eq.CreatedAt = time.Now()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(eq)
}

// PUT /equipments/{id} - Cập nhật thiết bị
func UpdateEquipment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var eq models.Equipment
	if err := json.NewDecoder(r.Body).Decode(&eq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var supplierID interface{}
	if eq.SupplierID != nil {
		supplierID = *eq.SupplierID
	} else {
		supplierID = nil
	}

	_, err := db.Exec(
		"UPDATE equipments SET name=?, price=?, purchase_date=?, status=?, supplier_id=? WHERE id=?",
		eq.Name, eq.Price, eq.PurchaseDate, eq.Status, supplierID, id,
	)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Equipment updated successfully"})
}

func DeleteEquipment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	_, err := db.Exec(`
		DELETE rh FROM repair_history rh
		JOIN maintenance_schedules ms ON rh.maintenance_id = ms.id
		WHERE ms.equipment_id = ?`, id)
	if err != nil {
		http.Error(w, "Failed to delete repair history: "+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("DELETE FROM maintenance_schedules WHERE equipment_id=?", id)
	if err != nil {
		http.Error(w, "Failed to delete maintenance schedules: "+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("DELETE FROM equipments WHERE id=?", id)
	if err != nil {
		http.Error(w, "Failed to delete equipment: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Equipment deleted successfully"})
}

func GetEquipmentStats(w http.ResponseWriter, r *http.Request) {
	type Stats struct {
		Status string `json:"status"`
		Count  int    `json:"count"`
	}

	rows, err := db.Query("SELECT status, COUNT(*) FROM equipments GROUP BY status")
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	var stats []Stats
	for rows.Next() {
		var s Stats
		if err := rows.Scan(&s.Status, &s.Count); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		stats = append(stats, s)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func GetEquipmentDetailHandler(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var eq models.Equipment
	var purchaseDate sql.NullTime
	var supplierID sql.NullInt64

	err := db.QueryRow("SELECT id, name, price, purchase_date, status, supplier_id, created_at FROM equipments WHERE id=?", id).
		Scan(&eq.ID, &eq.Name, &eq.Price, &purchaseDate, &eq.Status, &supplierID, &eq.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Equipment not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	if purchaseDate.Valid {
		eq.PurchaseDate = purchaseDate.Time
	} else {
		eq.PurchaseDate = time.Time{}
	}

	if supplierID.Valid {
		sid := int(supplierID.Int64)
		eq.SupplierID = &sid
	} else {
		eq.SupplierID = nil
	}
	rows, err := db.Query("SELECT id, equipment_id, scheduled_date, description, status, technician_id, created_at FROM maintenance_schedules WHERE equipment_id=?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var schedules []models.MaintenanceSchedule
	for rows.Next() {
		var ms models.MaintenanceSchedule
		var techID sql.NullInt64
		var scheduledDate sql.NullTime

		if err := rows.Scan(&ms.ID, &ms.EquipmentID, &scheduledDate, &ms.Description, &ms.Status, &techID, &ms.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if scheduledDate.Valid {
			ms.ScheduledDate = scheduledDate.Time
		} else {
			ms.ScheduledDate = time.Time{}
		}

		if techID.Valid {
			tid := int(techID.Int64)
			ms.TechnicianID = &tid
		} else {
			ms.TechnicianID = nil
		}

		schedules = append(schedules, ms)
	}

	response := map[string]interface{}{
		"equipment": eq,
		"schedules": schedules,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

