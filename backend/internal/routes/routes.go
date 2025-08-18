package routes

import (
	"net/http"

	"github.com/gorilla/mux"
	 "my-fullstack-project/backend/internal/handlers"
    "my-fullstack-project/backend/internal/service"
)

func SetupRoutes() *mux.Router {
	r := mux.NewRouter()

	// Auth
	r.HandleFunc("/api/login", handlers.Login).Methods("POST")
    r.HandleFunc("/api/register", handlers.Register).Methods("POST")
	r.HandleFunc("/api/confirm", handlers.ConfirmRegister).Methods("GET")
    r.HandleFunc("/api/users", handlers.GetAllUsers).Methods("GET")
	r.Handle("/api/users/{id}", service.JWTMiddleware(service.RoleMiddleware("admin")(http.HandlerFunc(handlers.EditUser)))).Methods("PUT")
    r.Handle("/api/users/{id}", service.JWTMiddleware(service.RoleMiddleware("admin")(http.HandlerFunc(handlers.DeleteUser)))).Methods("DELETE")
	r.HandleFunc("/api/equipments/stats", handlers.GetEquipmentStats).Methods("GET")

	// Equipment
	r.Handle("/api/equipments", service.JWTMiddleware(service.RoleMiddleware("admin", "technician","viewer")(http.HandlerFunc(handlers.GetEquipments)))).Methods("GET")
	r.Handle("/api/equipments", service.JWTMiddleware(service.RoleMiddleware("admin","technician")(http.HandlerFunc(handlers.CreateEquipment)))).Methods("POST")
	r.Handle("/api/equipments/{id}", service.JWTMiddleware(service.RoleMiddleware("admin","technician")(http.HandlerFunc(handlers.UpdateEquipment)))).Methods("PUT")
	r.Handle("/api/equipments/{id}", service.JWTMiddleware(service.RoleMiddleware("admin","technician")(http.HandlerFunc(handlers.DeleteEquipment)))).Methods("DELETE")
	r.HandleFunc("/api/equipments/{id}", handlers.GetEquipmentDetailHandler).Methods("GET")
    r.Handle("/api/equipments/{id}/maintenance", service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.CreateMaintenance)))).Methods("POST")

	// Maintenance
	r.Handle("/api/maintenance", service.JWTMiddleware(service.RoleMiddleware("admin", "technician","viewer")(http.HandlerFunc(handlers.GetMaintenances)))).Methods("GET")
	r.Handle("/api/maintenance", service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.CreateMaintenance)))).Methods("POST")
	r.Handle("/api/maintenance/{id}", service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.UpdateMaintenanceHandler)))).Methods("PUT")
	r.Handle("/api/maintenance/{id}", service.JWTMiddleware(service.RoleMiddleware("admin")(http.HandlerFunc(handlers.DeleteMaintenanceHandler)))).Methods("DELETE")
    r.HandleFunc("/api/maintenances/{id}", handlers.GetMaintenanceDetailHandler).Methods("GET")

	// Suppliers CRUD
    r.Handle("/api/suppliers", service.JWTMiddleware(service.RoleMiddleware("admin", "technician", "viewer")(http.HandlerFunc(handlers.GetSuppliers)))).Methods("GET")
	r.Handle("/api/suppliers/{id}", service.JWTMiddleware(service.RoleMiddleware("admin", "technician", "viewer")(http.HandlerFunc(handlers.GetSupplierDetailHandler)))).Methods("GET")
    r.Handle("/api/suppliers", service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.CreateSupplier)))).Methods("POST")
    r.Handle("/api/suppliers/{id}", service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.UpdateSupplier)))).Methods("PUT")
    r.Handle("/api/suppliers/{id}", service.JWTMiddleware(service.RoleMiddleware("admin")(http.HandlerFunc(handlers.DeleteSupplier)))).Methods("DELETE")
	r.Handle("/api/suppliers/{supplier_id}/equipments", service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.CreateEquipmentHandler)))).Methods("POST")
	r.Handle("/api/suppliers/{supplier_id}/equipments/{equipment_id}",service.JWTMiddleware(service.RoleMiddleware("admin", "technician")( http.HandlerFunc(handlers.UpdateEquipmentHandler)))).Methods("PUT", "OPTIONS")
	r.Handle("/api/equipments/{equipment_id}", service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.DeleteEquipmentHandler)))).Methods("DELETE")


	// Repair
	r.Handle("/api/repair-history", service.JWTMiddleware(service.RoleMiddleware("admin", "technician", "viewer")(http.HandlerFunc(handlers.GetAllRepairHistory)))).Methods("GET")
	r.Handle("/api/maintenance/{maintenance_id}/repair-history",service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.CreateRepairHistoryHandler)))).Methods("POST")
    r.Handle("/api/repair-history/{repair_id}",service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.UpdateRepairHistoryHandler)))).Methods("PUT")
    r.Handle("/api/repair-history/{repair_id}",service.JWTMiddleware(service.RoleMiddleware("admin", "technician")(http.HandlerFunc(handlers.DeleteRepairHistoryHandler)))).Methods("DELETE")
	

	r.HandleFunc("/api/search", handlers.SearchAll).Methods("GET")      
	r.HandleFunc("/api/search/detail", handlers.GetDetail).Methods("GET")
	return r
}
