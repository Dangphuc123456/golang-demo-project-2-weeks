package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
    "time"
	"github.com/gorilla/mux"
	"my-fullstack-project/backend/internal/models"
)
func GetSuppliers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	rows, err := db.Query("SELECT id, name, phone, email, address, created_at FROM suppliers")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var suppliers []models.Supplier
	for rows.Next() {
		var s models.Supplier
		if err := rows.Scan(&s.ID, &s.Name, &s.Phone, &s.Email, &s.Address, &s.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		suppliers = append(suppliers, s)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(suppliers)
}


func CreateSupplier(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var s models.Supplier
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	result, err := db.Exec(
		"INSERT INTO suppliers (name, phone, email, address) VALUES (?, ?, ?, ?)",
		s.Name, s.Phone, s.Email, s.Address,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	lastID, _ := result.LastInsertId()
	s.ID = int(lastID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(s)
}


func UpdateSupplier(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	params := mux.Vars(r)
	id, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
		return
	}

	var s models.Supplier
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	_, err = db.Exec(
		"UPDATE suppliers SET name=?, phone=?, email=?, address=? WHERE id=?",
		s.Name, s.Phone, s.Email, s.Address, id,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	s.ID = id
	json.NewEncoder(w).Encode(s)
}


func DeleteSupplier(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	supplierID, err := strconv.Atoi(params["id"])
	if err != nil {
		http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
		return
	}

	_, err = db.Exec(`
		DELETE rh FROM repair_history rh
		JOIN maintenance_schedules ms ON rh.maintenance_id = ms.id
		JOIN equipments e ON ms.equipment_id = e.id
		WHERE e.supplier_id = ?`, supplierID)
	if err != nil {
		http.Error(w, "Failed to delete repair history: "+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = db.Exec(`
		DELETE ms FROM maintenance_schedules ms
		JOIN equipments e ON ms.equipment_id = e.id
		WHERE e.supplier_id = ?`, supplierID)
	if err != nil {
		http.Error(w, "Failed to delete maintenance schedules: "+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("DELETE FROM equipments WHERE supplier_id = ?", supplierID)
	if err != nil {
		http.Error(w, "Failed to delete equipments: "+err.Error(), http.StatusInternalServerError)
		return
	}

	_, err = db.Exec("DELETE FROM suppliers WHERE id = ?", supplierID)
	if err != nil {
		http.Error(w, "Failed to delete supplier: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type Supplier struct {
  ID         int          `json:"id"`
  Name       string       `json:"name"`
  Phone      *string      `json:"phone"`
  Email      *string      `json:"email"`
  Address    *string      `json:"address"`
  CreatedAt  time.Time    `json:"created_at"`
  Equipments []Equipment  `json:"equipments"`
}

type Equipment struct {
  ID           int       `json:"id"`
  Name         string    `json:"name"`
  Price     float64    `json:"price"`
  PurchaseDate time.Time  `json:"purchase_date"`
  Status       string    `json:"status"`
  SupplierID   int       `json:"supplier_id"`
  CreatedAt    time.Time `json:"created_at"`
}

func GetSupplierDetailHandler(w http.ResponseWriter, r *http.Request) {
  vars := mux.Vars(r)
  supplierID := vars["id"]

  var supplier Supplier

  err := db.QueryRow(`SELECT id, name, phone, email, address, created_at FROM suppliers WHERE id = ?`, supplierID).
    Scan(&supplier.ID, &supplier.Name, &supplier.Phone, &supplier.Email, &supplier.Address, &supplier.CreatedAt)
  if err != nil {
    http.Error(w, "Supplier not found", http.StatusNotFound)
    return
  }

  rows, err := db.Query(`SELECT id, name, price, purchase_date, status, supplier_id, created_at FROM equipments WHERE supplier_id = ?`, supplierID)
  if err != nil {
    http.Error(w, "Error fetching equipments", http.StatusInternalServerError)
    return
  }
  defer rows.Close()

  equipments := []Equipment{}
  for rows.Next() {
    var eq Equipment
    err = rows.Scan(&eq.ID, &eq.Name, &eq.Price, &eq.PurchaseDate, &eq.Status, &eq.SupplierID, &eq.CreatedAt)
    if err != nil {
      http.Error(w, "Error scanning equipments", http.StatusInternalServerError)
      return
    }
    equipments = append(equipments, eq)
  }

  supplier.Equipments = equipments

  w.Header().Set("Content-Type", "application/json")
  json.NewEncoder(w).Encode(supplier)
}

func CreateEquipmentHandler(w http.ResponseWriter, r *http.Request) {
    supplierIDStr := mux.Vars(r)["supplier_id"]
    supplierID, err := strconv.Atoi(supplierIDStr)
    if err != nil {
        http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
        return
    }

    var eq models.Equipment
    if err := json.NewDecoder(r.Body).Decode(&eq); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // gán SupplierID đúng kiểu con trỏ
    eq.SupplierID = &supplierID

    // kiểm tra các trường bắt buộc
    if eq.Name == "" || eq.Price <= 0 || eq.Status == "" || eq.PurchaseDate.IsZero() {
        http.Error(w, "Missing or invalid fields", http.StatusBadRequest)
        return
    }

    // insert vào database
    result, err := db.Exec(`INSERT INTO equipments (supplier_id, name, price, purchase_date, status) VALUES (?, ?, ?, ?, ?)`,
        eq.SupplierID, eq.Name, eq.Price, eq.PurchaseDate, eq.Status)
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    id, _ := result.LastInsertId()
    eq.ID = int(id)

    // trả về JSON
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(eq)
}

func UpdateEquipmentHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    supplierIDStr := vars["supplier_id"]
    equipmentIDStr := vars["equipment_id"]

    supplierID, err := strconv.Atoi(supplierIDStr)
    if err != nil {
        http.Error(w, "Invalid supplier ID", http.StatusBadRequest)
        return
    }

    equipmentID, err := strconv.Atoi(equipmentIDStr)
    if err != nil {
        http.Error(w, "Invalid equipment ID", http.StatusBadRequest)
        return
    }

    var eq Equipment
    if err := json.NewDecoder(r.Body).Decode(&eq); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    if eq.Name == "" || eq.Price <= 0  || eq.Status == "" || eq.PurchaseDate.IsZero() {
        http.Error(w, "Missing required fields", http.StatusBadRequest)
        return
    }
    _, err = db.Exec(`UPDATE equipments 
                      SET name=?, price=?, purchase_date=?, status=? 
                      WHERE id=? AND supplier_id=?`,
        eq.Name, eq.Price, eq.PurchaseDate, eq.Status, equipmentID, supplierID)
    if err != nil {
        http.Error(w, "Database error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    eq.ID = equipmentID
    eq.SupplierID = supplierID 

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(eq)
}

func DeleteEquipmentHandler(w http.ResponseWriter, r *http.Request) {
    equipmentIDStr := mux.Vars(r)["equipment_id"]
    equipmentID, err := strconv.Atoi(equipmentIDStr)
    if err != nil {
        http.Error(w, "Invalid equipment ID", http.StatusBadRequest)
        return
    }

    _, err = db.Exec(`DELETE FROM equipments WHERE id=?`, equipmentID)
    if err != nil {
        http.Error(w, "DB error: "+err.Error(), http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}
