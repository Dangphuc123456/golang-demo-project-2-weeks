import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Accept": "application/json",
  },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ================== API FUNCTIONS ==================


export async function getEquipments() {
  const res = await api.get("/equipments");
  return res.data;
}

export async function getEquipmentStats() {
  const res = await api.get("/equipments/stats");
  return res.data;
}

export async function createEquipment(data) {
  const res = await api.post("/equipments", data);
  return res.data;
}

export async function updateEquipment(id, data) {
  const res = await api.put(`/equipments/${id}`, data);
  return res.data;
}

export async function deleteEquipment(id) {
  await api.delete(`/equipments/${id}`);
  return true;
}

export async function getSuppliers() {
  const res = await api.get("/suppliers");
  return res.data;
}


export async function getEquipmentById(id) {
  const res = await api.get(`/equipments/${id}`);
  return res.data;
}

export async function getEquipmentDetail(id) {
  const res = await api.get(`/equipments/${id}`);
  return res.data;
}


export async function getTechnicians() {
  const res = await api.get("/users", { params: { role: "technician" } });
  return res.data;
}



