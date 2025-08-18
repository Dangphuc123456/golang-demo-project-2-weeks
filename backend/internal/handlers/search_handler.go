package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"my-fullstack-project/backend/internal/models"
)

// struct gợi ý chung
type SearchResult struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"` // equipment | maintenance | repair | supplier
}

func SearchAll(w http.ResponseWriter, r *http.Request) {
    keyword := r.URL.Query().Get("q")
    if keyword == "" {
        http.Error(w, "query param q required", http.StatusBadRequest)
        return
    }

    likeKeyword := "%" + keyword + "%" // giữ nguyên chữ có dấu

    results := []SearchResult{}

    // --- equipments ---
    rows, err := db.Query("SELECT id, name FROM equipments WHERE name LIKE ? COLLATE utf8_general_ci", likeKeyword)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var id int
        var name string
        if err := rows.Scan(&id, &name); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, SearchResult{ID: id, Name: name, Type: "equipment"})
    }

    // --- maintenance schedules ---
    rows2, err := db.Query(
    "SELECT id, description FROM maintenance_schedules WHERE description LIKE ? COLLATE utf8_general_ci",
    likeKeyword,
   )
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows2.Close()

    for rows2.Next() {
        var id int
        var desc string
        if err := rows2.Scan(&id, &desc); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, SearchResult{ID: id, Name: desc, Type: "maintenance"})
    }

    // --- repair histories ---
    rows3, err := db.Query(
    "SELECT id, issue_description FROM repair_history WHERE issue_description LIKE ? COLLATE utf8_general_ci",
    likeKeyword,
  )
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows3.Close()

    for rows3.Next() {
        var id int
        var issue string
        if err := rows3.Scan(&id, &issue); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, SearchResult{ID: id, Name: issue, Type: "repair"})
    }

    // --- suppliers ---
    rows4, err := db.Query("SELECT id, name FROM suppliers WHERE name LIKE ? COLLATE utf8_general_ci", likeKeyword)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    defer rows4.Close()

    for rows4.Next() {
        var id int
        var name string
        if err := rows4.Scan(&id, &name); err != nil {
            http.Error(w, err.Error(), http.StatusInternalServerError)
            return
        }
        results = append(results, SearchResult{ID: id, Name: name, Type: "supplier"})
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(results)
}
// API chi tiết
func GetDetail(w http.ResponseWriter, r *http.Request) {
	qType := r.URL.Query().Get("type")
	idStr := r.URL.Query().Get("id")
	id, _ := strconv.Atoi(idStr)

	var result interface{}

	switch qType {
	case "equipment":
		var eq models.Equipment
		err := db.QueryRow("SELECT id, name, category, purchase_date, status, price, supplier_id, created_at FROM equipments WHERE id = ?", id).
			Scan(&eq.ID, &eq.Name, &eq.Category, &eq.PurchaseDate, &eq.Status, &eq.Price, &eq.SupplierID, &eq.CreatedAt)
		if err == nil {
			result = eq
		}
	case "maintenance":
		var ms models.MaintenanceSchedule
		err := db.QueryRow("SELECT id, equipment_id, scheduled_date, description, status, technician_id, created_at FROM maintenance_schedules WHERE id = ?", id).
			Scan(&ms.ID, &ms.EquipmentID, &ms.ScheduledDate, &ms.Description, &ms.Status, &ms.TechnicianID, &ms.CreatedAt)
		if err == nil {
			result = ms
		}
	case "repair":
		var rh models.RepairHistory
		err := db.QueryRow("SELECT id, repair_date, issue_description, cost, technician_id, created_at, maintenance_id FROM repair_histories WHERE id = ?", id).
			Scan(&rh.ID, &rh.RepairDate, &rh.IssueDesc, &rh.Cost, &rh.TechnicianID, &rh.CreatedAt, &rh.MaintenanceID)
		if err == nil {
			result = rh
		}
	case "supplier":
		var sp models.Supplier
		err := db.QueryRow("SELECT id, name, phone, email, address, created_at FROM suppliers WHERE id = ?", id).
			Scan(&sp.ID, &sp.Name, &sp.Phone, &sp.Email, &sp.Address, &sp.CreatedAt)
		if err == nil {
			result = sp
		}
	default:
		http.Error(w, "invalid type", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
