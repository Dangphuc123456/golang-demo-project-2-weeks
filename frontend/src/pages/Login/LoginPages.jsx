import React, { useState } from "react";
import { loginUser } from "../../api/userApi";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function LoginPages() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await loginUser(email, password);
      console.log("Login success, token:", data.token);
      toast.success("Login successful!");
      setTimeout(() => navigate("/"), 800); 
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Login failed";
      toast.error(msg);
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <div className="card shadow-sm p-4">
        <h2 className="mb-4 text-center">Login</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary w-100 mb-3">
            Login
          </button>
        </form>

        <div className="text-center">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="text-decoration-none fw-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
