package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

var DB *sql.DB

func Connect() {
	// optional: load .env if exists (safe)
	_ = godotenv.Load()

	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	name := os.Getenv("DB_NAME")

	// defaults
	if port == "" {
		port = "3306"
	}
	// if host doesn't include port, combine
	hostPort := host
	if hostPort == "" {
		hostPort = "127.0.0.1"
	}
	// if user or pass empty, abort early with helpful message
	if user == "" || pass == "" || name == "" {
		log.Fatalf("Missing DB config: DB_USER='%s' DB_PASSWORD='%s' DB_HOST='%s' DB_PORT='%s' DB_NAME='%s' — set env vars or create .env", user, pass, host, port, name)
	}

	// build dsn
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, pass, hostPort, port, name)

	// debug print (remove in production)
	log.Printf("DEBUG DB DSN user='%s' host='%s' port='%s' name='%s'\n", user, hostPort, port, name)

	var err error
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Cannot open DB:", err)
	}
	if err = DB.Ping(); err != nil {
		log.Fatal("Cannot ping DB:", err)
	}
	log.Println("Connected to MySQL")
}
