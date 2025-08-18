// src/api/userApi.js
import axios from "axios";
import { useState, useEffect } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Login
export async function loginUser(email, password) {
  try {
    const res = await axios.post(`${API_BASE}/login`, { email, password });
    localStorage.setItem("token", res.data.token);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
}

// Register
export async function registerUser({ username, email, password, phone }) {
  try {
    const res = await axios.post(`${API_BASE}/register`, {
      username,
      email,
      password,
      phone,
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
}

// Lấy danh sách users
export async function fetchAllUsers() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
}

// Hook custom
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return { users, loading, error, refetch: fetchUsers };
}

export async function updateUser(id, data) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(`${API_BASE}/users/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { message: res.data.message || "Cập nhật user thành công!" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Update failed");
  }
}

// Xóa user
export async function deleteUser(id) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.delete(`${API_BASE}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { message: res.data.message || "Xóa user thành công!" };
  } catch (error) {
    throw new Error(error.response?.data?.error || "Delete failed");
  }
}