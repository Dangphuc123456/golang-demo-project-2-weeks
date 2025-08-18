import React, { useState } from "react";
import { registerUser } from "../../api/userApi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function RegisterPages() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const data = await registerUser({ username, email, password, phone });
      toast.success(data.message || "Registration successful! Please check your email.");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      toast.error(err.message || "Registration failed");
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card shadow-sm p-4">
        <h2 className="mb-4 text-center">Register</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="username" className="form-label fw-semibold">Username</label>
            <input id="username" type="text" required className="form-control"
              placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Email address</label>
            <input id="email" type="email" required className="form-control"
              placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <input id="password" type="password" required className="form-control"
              placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>

          <div className="mb-3">
            <label htmlFor="phone" className="form-label fw-semibold">Phone</label>
            <input
              id="phone"
              type="tel"
              required                 
              className="form-control"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>

          {message && <div className="alert alert-success text-center" role="alert">{message}</div>}
          {error && <div className="alert alert-danger text-center" role="alert">{error}</div>}

          <button type="submit" className="btn btn-success w-100 mb-3">Register</button>
        </form>

        <div className="text-center">
          <p>Already have an account?{" "}
            <Link to="/login" className="text-decoration-none fw-semibold">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
