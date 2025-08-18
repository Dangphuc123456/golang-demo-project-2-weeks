package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"my-fullstack-project/backend/internal/models"
)
func GetAllRepairHistory(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := db.Query(`SELECT id, repair_date, issue_description, cost, technician_id, created_at, maintenance_id 
						   FROM repair_history 
						   ORDER BY created_at DESC`)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var histories []models.RepairHistory
	for rows.Next() {
		var rh models.RepairHistory
		var techID sql.NullInt64

		if err := rows.Scan(&rh.ID, &rh.RepairDate, &rh.IssueDesc, &rh.Cost, &techID, &rh.CreatedAt, &rh.MaintenanceID); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if techID.Valid {
			temp := int(techID.Int64)
			rh.TechnicianID = &temp
		}

		histories = append(histories, rh)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(histories)
}

func CreateRepairHistoryHandler(w http.ResponseWriter, r *http.Request) {
    maintenanceIDStr := mux.Vars(r)["maintenance_id"]
    maintenanceID, err := strconv.Atoi(maintenanceIDStr)
    if err != nil {
        http.Error(w, "Invalid maintenance ID", http.StatusBadRequest)
        return
    }

    var rh models.RepairHistory
    if err := json.NewDecoder(r.Body).Decode(&rh); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    if rh.RepairDate.IsZero() || rh.IssueDesc == "" {
        http.Error(w, "Missing required fields", http.StatusBadRequest)
        return
    }

    rh.MaintenanceID = maintenanceID
    rh.CreatedAt = time.Now()

    tx, err := db.Begin()
    if err != nil {
        http.Error(w, "DB transaction error: "+err.Error(), http.StatusInternalServerError)
        return
    }
    result, err := tx.Exec(`INSERT INTO repair_history 
        (maintenance_id, repair_date, issue_description, cost, technician_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
        rh.MaintenanceID, rh.RepairDate, rh.IssueDesc, rh.Cost, rh.TechnicianID, rh.CreatedAt)
    if err != nil {
        tx.Rollback()
        http.Error(w, "DB insert error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    id, _ := result.LastInsertId()
    rh.ID = int(id)

    _, err = tx.Exec("UPDATE maintenance_schedules SET status=? WHERE id=?", "completed", maintenanceID)
    if err != nil {
        tx.Rollback()
        http.Error(w, "Update maintenance error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    var equipmentID int
    err = tx.QueryRow("SELECT equipment_id FROM maintenance_schedules WHERE id=?", maintenanceID).Scan(&equipmentID)
    if err != nil {
        tx.Rollback()
        http.Error(w, "Get equipment_id error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    _, err = tx.Exec("UPDATE equipments SET status=? WHERE id=?", "active", equipmentID)
    if err != nil {
        tx.Rollback()
        http.Error(w, "Update equipment error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    if err := tx.Commit(); err != nil {
        tx.Rollback()
        http.Error(w, "DB commit error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(rh)
}


func UpdateRepairHistoryHandler(w http.ResponseWriter, r *http.Request) {
	repairIDStr := mux.Vars(r)["repair_id"]
	repairID, err := strconv.Atoi(repairIDStr)
	if err != nil {
		http.Error(w, "Invalid repair history ID", http.StatusBadRequest)
		return
	}

	var rh models.RepairHistory
	if err := json.NewDecoder(r.Body).Decode(&rh); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	if rh.RepairDate.IsZero() || rh.IssueDesc == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	_, err = db.Exec(`UPDATE repair_history 
		SET repair_date=?, issue_description=?, cost=?, technician_id=? 
		WHERE id=?`,
		rh.RepairDate, rh.IssueDesc, rh.Cost, rh.TechnicianID, repairID)
	if err != nil {
		http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	rh.ID = repairID
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rh)
}

func DeleteRepairHistoryHandler(w http.ResponseWriter, r *http.Request) {
	repairIDStr := mux.Vars(r)["repair_id"]
	repairID, err := strconv.Atoi(repairIDStr)
	if err != nil {
		http.Error(w, "Invalid repair history ID", http.StatusBadRequest)
		return
	}

	_, err = db.Exec(`DELETE FROM repair_history WHERE id=?`, repairID)
	if err != nil {
		http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
