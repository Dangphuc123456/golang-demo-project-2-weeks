package handlers

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "net/smtp"
    "net/url"
    "os"
    "time"
    "github.com/gorilla/mux"
    "strconv"
    "github.com/golang-jwt/jwt/v5"
    "golang.org/x/crypto/bcrypt"
)

var db *sql.DB

func SetDB(database *sql.DB) {
    db = database
}

type RegisterRequest struct {
    Username string `json:"username"`
    Password string `json:"password"`
    Email    string `json:"email"`
    Role     string `json:"role"`
    Phone    string `json:"phone"`
}

type Credentials struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

func Register(w http.ResponseWriter, r *http.Request) {
    var req RegisterRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }
   if req.Username == "" || req.Password == "" || req.Email == "" || req.Phone == "" {
    http.Error(w, "Username, password, email and phone are required", http.StatusBadRequest)
    return
   }
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        http.Error(w, "Error hashing password", http.StatusInternalServerError)
        return
    }

    claims := jwt.MapClaims{
        "username": req.Username,
        "email":    req.Email,
        "password": string(hashedPassword),
        "role":     "viewer",
        "phone":    req.Phone,  
        "exp": time.Now().Add(time.Hour).Unix(),
        "iat": time.Now().Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
    if err != nil {
        http.Error(w, "Failed to create token", http.StatusInternalServerError)
        return
    }

    backendURL := os.Getenv("BACKEND_URL")
    if backendURL == "" {
        backendURL = "http://localhost:8080"
    }
    link := fmt.Sprintf("%s/api/confirm?token=%s", backendURL, url.QueryEscape(tokenString))

    go func() {
        err := sendConfirmationEmail(req.Email, link)
        if err != nil {
            log.Println("sendConfirmationEmail error:", err)
        } else {
            log.Println("Confirmation email sent to", req.Email)
        }
    }()

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "message": "Registration successful! Please check your email to confirm your account.",
    })
}

func sendConfirmationEmail(toEmail, confirmLink string) error {
    from := os.Getenv("EMAIL_USER")
    pass := os.Getenv("EMAIL_PASS")
    host := os.Getenv("EMAIL_HOST")
    port := os.Getenv("EMAIL_PORT")

    auth := smtp.PlainAuth("", from, pass, host)

    subject := "Subject: Confirm your registration\n"

    // Nội dung email HTML với nút bấm
    body := fmt.Sprintf(`
    <html>
    <body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
        <table width="100%%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
            <table width="600" cellpadding="20" cellspacing="0" style="border:1px solid #e0e0e0; border-radius:8px;">
                <tr>
                <td>
                    <h2 style="color:#007BFF;">Welcome to Our Service!</h2>
                    <p>Hi there,</p>
                    <p>Thank you for registering. To complete your registration, please confirm your email by clicking the button below:</p>
                    <p style="text-align:center;">
                    <a href="%s" style="
                        display: inline-block;
                        padding: 12px 25px;
                        font-size: 16px;
                        color: #ffffff;
                        background-color: #007BFF;
                        text-decoration: none;
                        border-radius: 5px;
                    ">Confirm Your Email</a>
                    </p>
                    <p>If you did not register, you can safely ignore this email.</p>
                    <p>Thanks,<br>The Team</p>
                </td>
                </tr>
            </table>
            </td>
        </tr>
        </table>
    </body>
    </html>
    `, confirmLink)
    // Email MIME HTML
    msg := []byte("From: " + from + "\n" +
        "To: " + toEmail + "\n" +
        subject +
        "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n" +
        body)

    addr := fmt.Sprintf("%s:%s", host, port)
    err := smtp.SendMail(addr, auth, from, []string{toEmail}, msg)
    if err != nil {
        log.Printf("Failed to send email to %s: %v\n", toEmail, err)
        return err
    }
    log.Printf("Confirmation email sent to %s\n", toEmail)
    return nil
}

func ConfirmRegister(w http.ResponseWriter, r *http.Request) {
    tokenStr := r.URL.Query().Get("token")
    frontend := os.Getenv("FRONTEND_URL")
    if frontend == "" {
        frontend = "http://localhost:5173"
    }

    if tokenStr == "" {
        failURL := fmt.Sprintf("%s/register/failpage?reason=%s", frontend, url.QueryEscape("missing_token"))
        http.Redirect(w, r, failURL, http.StatusSeeOther)
        return
    }

    claims := jwt.MapClaims{}
    token, err := jwt.ParseWithClaims(tokenStr, &claims, func(token *jwt.Token) (interface{}, error) {
        return []byte(os.Getenv("JWT_SECRET")), nil
    })
    if err != nil || token == nil || !token.Valid {
        log.Printf("Invalid token parse error: %v\n", err)
        failURL := fmt.Sprintf("%s/register/failpage?reason=%s", frontend, url.QueryEscape("invalid_token"))
        http.Redirect(w, r, failURL, http.StatusSeeOther)
        return
    }

    now := time.Now().Unix()
    if expVal, ok := claims["exp"]; ok {
        if expFloat, ok := expVal.(float64); ok {
            if now > int64(expFloat) {
                failURL := fmt.Sprintf("%s/register/failpage?reason=%s", frontend, url.QueryEscape("token_expired"))
                http.Redirect(w, r, failURL, http.StatusSeeOther)
                return
            }
        }
    } else if iatVal, ok := claims["iat"]; ok {
        if iatFloat, ok := iatVal.(float64); ok {
            issuedAt := time.Unix(int64(iatFloat), 0)
            if time.Since(issuedAt) > time.Hour {
                failURL := fmt.Sprintf("%s/register/failpage?reason=%s", frontend, url.QueryEscape("token_too_old"))
                http.Redirect(w, r, failURL, http.StatusSeeOther)
                return
            }
        }
    }

    username, ok1 := claims["username"].(string)
    email, ok2 := claims["email"].(string)
    passwordHash, ok3 := claims["password"].(string)
    role, ok4 := claims["role"].(string)
    phone, ok5 := claims["phone"].(string)

    if !ok1 || !ok2 || !ok3 || username == "" || email == "" || passwordHash == "" {
        failURL := fmt.Sprintf("%s/register/failpage?reason=%s", frontend, url.QueryEscape("invalid_claims"))
        http.Redirect(w, r, failURL, http.StatusSeeOther)
        return
    }

    if !ok4 {
        role = "viewer"
    }
    if !ok5 {
        phone = ""
    }

    var exists int
    err = db.QueryRow("SELECT 1 FROM users WHERE username = ? OR email = ? LIMIT 1", username, email).Scan(&exists)
    if err != nil && err != sql.ErrNoRows {
        log.Printf("DB error checking existing user: %v\n", err)
        http.Error(w, "DB error", http.StatusInternalServerError)
        return
    }
    if err == nil {
        failURL := fmt.Sprintf("%s/register/failpage?reason=%s", frontend, url.QueryEscape("exists"))
        http.Redirect(w, r, failURL, http.StatusSeeOther)
        return
    }

    _, err = db.Exec("INSERT INTO users (username, password_hash, role, email, phone) VALUES (?, ?, ?, ?, ?)",
        username, passwordHash, role, email, phone)
    if err != nil {
        log.Printf("Error creating user: %v\n", err)
        http.Error(w, "Error creating user", http.StatusInternalServerError)
        return
    }

    redirectURL := fmt.Sprintf("%s/register/complete", frontend)
    http.Redirect(w, r, redirectURL, http.StatusSeeOther)
}


func Login(w http.ResponseWriter, r *http.Request) {
    var creds Credentials
    if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        return
    }

    var storedHash, role string
    var id int
    err := db.QueryRow(
    "SELECT id, password_hash, role FROM users WHERE email = ? LIMIT 1",
    creds.Email).Scan(&id, &storedHash, &role)

    if err != nil {
        http.Error(w, "User not found", http.StatusUnauthorized)
        return
    }

    if bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(creds.Password)) != nil {
        http.Error(w, "Incorrect password or email", http.StatusUnauthorized)
        return
    }

    claims := jwt.MapClaims{
        "user_id": id,
        "role":    role,
        "exp":     time.Now().Add(24 * time.Hour).Unix(),
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
    if err != nil {
        http.Error(w, "Error creating token", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"token": tokenString})
}


func GetAllUsers(w http.ResponseWriter, r *http.Request) {
    type User struct {
        ID        int       `json:"id"`
        Username  string    `json:"username"`
        Role      string    `json:"role"`
        Email     string    `json:"email"`
        Phone     string    `json:"phone"`
        CreatedAt time.Time `json:"created_at"`
        UpdatedAt time.Time `json:"updated_at"`
    }

    rows, err := db.Query("SELECT id, username, role, email, phone, created_at, updated_at FROM users")
    if err != nil {
        log.Printf("Error querying users: %v\n", err)
        http.Error(w, "Failed to query users", http.StatusInternalServerError)
        return
    }
    defer rows.Close()

    var users []User
    for rows.Next() {
        var u User
        err := rows.Scan(&u.ID, &u.Username, &u.Role, &u.Email, &u.Phone, &u.CreatedAt, &u.UpdatedAt)
        if err != nil {
            log.Printf("Error scanning user row: %v\n", err)
            http.Error(w, "Failed to read user data", http.StatusInternalServerError)
            return
        }
        users = append(users, u)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}

type EditUserRequest struct {
    Username string `json:"username"`
    Email    string `json:"email"`
    Role     string `json:"role"`
}

// EditUser - Sửa thông tin user
func EditUser(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    vars := mux.Vars(r)
    userIDStr := vars["id"]
    userID, err := strconv.Atoi(userIDStr)
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
        return
    }

    var req EditUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
        return
    }

    if req.Username == "" || req.Email == "" || req.Role == "" {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "Missing required fields"})
        return
    }

    query := "UPDATE users SET username = ?, email = ?, role = ?, updated_at = NOW() WHERE id = ?"
    result, err := db.Exec(query, req.Username, req.Email, req.Role, userID)
    if err != nil {
        log.Printf("Error updating user: %v", err)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update user"})
        return
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "No user found to update"})
        return
    }

    json.NewEncoder(w).Encode(map[string]string{"message": "User updated successfully"})
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    vars := mux.Vars(r)
    userIDStr := vars["id"]
    userID, err := strconv.Atoi(userIDStr)
    if err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "Invalid user ID"})
        return
    }
    result, err := db.Exec("DELETE FROM users WHERE id = ?", userID)
    if err != nil {
        log.Printf("Error deleting user: %v", err)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete user"})
        return
    }

    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "No user found to delete"})
        return
    }

    json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}
