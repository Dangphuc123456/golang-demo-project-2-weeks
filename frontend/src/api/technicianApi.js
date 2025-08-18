import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

export async function getTechnicians() {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_BASE}/users`, {
      params: { role: "technician" }, // thay vì users?role=technician
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data; // [{id, username, ...}]
  } catch (error) {
    throw new Error(error.response?.data?.message || "Không lấy được kỹ thuật viên");
  }
}