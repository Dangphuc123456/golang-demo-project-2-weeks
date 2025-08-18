import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function searchAll(keyword) {
  try {
    const res = await api.get("/search", {
      params: { q: keyword },
    });
    return res.data;
  } catch (err) {
    console.error("Error searchAll:", err);
    throw err;
  }
}


export async function getDetail(type, id) {
  try {
    const res = await api.get("/search/detail", {
      params: { type, id },
    });
    return res.data;
  } catch (err) {
    console.error("Error getDetail:", err);
    throw err;
  }
}
