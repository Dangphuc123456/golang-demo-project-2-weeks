import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;


export async function getRepairHistory() {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.get(`${API_BASE}/repair-history`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Lỗi khi lấy danh sách repair history");
  }
}

export const updateRepairHistory = async (id, data, token) => {
  try {
    const res = await axios.put(`${API_BASE}/api/repair-history/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, 
      },
    });
    return res.data;
  } catch (err) {
    console.error("Update failed:", err.response?.data || err.message);
    throw err;
  }
};

export const deleteRepairHistory = async (id, token) => {
  try {
    const res = await axios.delete(`${API_BASE}/api/repair-history/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error("Delete failed:", err.response?.data || err.message);
    throw err;
  }
};