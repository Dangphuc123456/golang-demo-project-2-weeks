package main

import (
    "log"
    "net/http"

    "my-fullstack-project/backend/internal/handlers"
    "my-fullstack-project/backend/internal/routes"
    "my-fullstack-project/backend/pkg/db"

    gorillaHandlers "github.com/gorilla/handlers"  // Import gorilla handlers
)

func main() {
    db.Connect()
    handlers.SetDB(db.DB)

    r := routes.SetupRoutes()

    headersOk := gorillaHandlers.AllowedHeaders([]string{"Content-Type", "Authorization"})
    originsOk := gorillaHandlers.AllowedOrigins([]string{"http://localhost:5173"})
    methodsOk := gorillaHandlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})

    corsHandler := gorillaHandlers.CORS(originsOk, headersOk, methodsOk)(r)

    log.Println("Server running on :8080")
    if err := http.ListenAndServe(":8080", corsHandler); err != nil {
        log.Fatal(err)
    }
}
