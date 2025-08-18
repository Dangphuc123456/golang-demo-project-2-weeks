package handlers

import (
    "database/sql"
	"encoding/json"
	"net/http"
	"time"
    "strconv"
	"github.com/gorilla/mux"
	"my-fullstack-project/backend/internal/models"
)

func GetMaintenances(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query(`
        SELECT id, equipment_id, scheduled_date, description, status, technician_id, created_at 
        FROM maintenance_schedules
    `)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    defer rows.Close()

    var maintenances []models.MaintenanceSchedule
    for rows.Next() {
        var m models.MaintenanceSchedule
        var technicianID sql.NullInt64

        if err := rows.Scan(&m.ID, &m.EquipmentID, &m.ScheduledDate, &m.Description, &m.Status, &technicianID, &m.CreatedAt); err != nil {
            http.Error(w, err.Error(), 500)
            return
        }

        if technicianID.Valid {
            tid := int(technicianID.Int64)
            m.TechnicianID = &tid
        }

        maintenances = append(maintenances, m)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(maintenances)
}


func CreateMaintenance(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    equipmentIDStr := vars["id"]
    equipmentID, err := strconv.Atoi(equipmentIDStr)
    if err != nil {
        http.Error(w, "Invalid equipment ID", http.StatusBadRequest)
        return
    }

    var m models.MaintenanceSchedule
    if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
        http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
        return
    }

    m.EquipmentID = equipmentID

    if m.ScheduledDate.IsZero() {
        t, err := time.Parse("2006-01-02", r.FormValue("scheduled_date"))
        if err == nil {
            m.ScheduledDate = t
        }
    }

    // Thêm lịch bảo trì
    _, err = db.Exec(
        "INSERT INTO maintenance_schedules (equipment_id, scheduled_date, description, status, technician_id) VALUES (?, ?, ?, ?, ?)",
        m.EquipmentID, m.ScheduledDate, m.Description, m.Status, m.TechnicianID,
    )
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    _, err = db.Exec("UPDATE equipments SET status = ? WHERE id = ?", "maintenance", equipmentID)
    if err != nil {
        http.Error(w, "Failed to update equipment status: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusCreated)
}


func UpdateMaintenanceHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    maintenanceIDStr := vars["id"]

    maintenanceID, err := strconv.Atoi(maintenanceIDStr)
    if err != nil {
        http.Error(w, "Invalid maintenance ID", http.StatusBadRequest)
        return
    }

    var m models.MaintenanceSchedule
    if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    if m.Description == "" || m.Status == "" || m.ScheduledDate.IsZero() {
        http.Error(w, "Missing required fields", http.StatusBadRequest)
        return
    }

    _, err = db.Exec(`UPDATE maintenance_schedules
                      SET scheduled_date=?, description=?, status=?, technician_id=?
                      WHERE id=?`,
        m.ScheduledDate, m.Description, m.Status, m.TechnicianID, maintenanceID)
    if err != nil {
        http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    m.ID = maintenanceID

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(m)
}

func DeleteMaintenanceHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    maintenanceIDStr := vars["id"]

    maintenanceID, err := strconv.Atoi(maintenanceIDStr)
    if err != nil {
        http.Error(w, "Invalid maintenance ID", http.StatusBadRequest)
        return
    }

    _, err = db.Exec(`DELETE FROM maintenance_schedules WHERE id=?`, maintenanceID)
    if err != nil {
        http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func GetMaintenanceDetailHandler(w http.ResponseWriter, r *http.Request) {
    idStr := mux.Vars(r)["id"]
    id, _ := strconv.Atoi(idStr)

    var m models.MaintenanceSchedule
    var techID sql.NullInt64
    var scheduledDate sql.NullTime

    // 1. Lấy thông tin lịch bảo trì
    err := db.QueryRow(`
        SELECT id, equipment_id, scheduled_date, description, status, technician_id, created_at
        FROM maintenance_schedules
        WHERE id=?`, id).
        Scan(&m.ID, &m.EquipmentID, &scheduledDate, &m.Description, &m.Status, &techID, &m.CreatedAt)

    if err != nil {
        http.Error(w, "Maintenance not found", http.StatusNotFound)
        return
    }
    if scheduledDate.Valid {
        m.ScheduledDate = scheduledDate.Time
    }
    if techID.Valid {
        t := int(techID.Int64)
        m.TechnicianID = &t
    }

    // 2. Lấy lịch sử bảo trì theo maintenance_id
    rows, err := db.Query(`
        SELECT id, maintenance_id, repair_date, issue_description, cost, technician_id, created_at
        FROM repair_history
        WHERE maintenance_id=? 
        ORDER BY repair_date DESC
    `, m.ID)
    if err != nil {
        http.Error(w, "Error fetching repair history", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var history []models.RepairHistory
    for rows.Next() {
        var h models.RepairHistory
        var techID sql.NullInt64
        var repairDate sql.NullTime

        err := rows.Scan(
            &h.ID,
            &h.MaintenanceID,
            &repairDate,
            &h.IssueDesc,
            &h.Cost,
            &techID,
            &h.CreatedAt,
        )
        if err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }

        if repairDate.Valid {
            h.RepairDate = repairDate.Time
        }
        if techID.Valid {
            t := int(techID.Int64)
            h.TechnicianID = &t
        }
        history = append(history, h)
    }
    response := map[string]interface{}{
        "maintenance": m,
        "history":     history,
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}

