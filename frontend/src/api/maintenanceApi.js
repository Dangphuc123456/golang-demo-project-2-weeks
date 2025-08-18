import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Accept": "application/json",
  },
});

// Gắn token tự động
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ================== API FUNCTIONS ==================

// Lấy tất cả lịch bảo trì
export async function getMaintenances() {
  const res = await api.get("/maintenance");
  return res.data;
}

// Tạo lịch bảo trì mới
export async function createMaintenance(equipmentId, maintenanceData) {
  try {
    const isoDate = new Date(maintenanceData.scheduled_date).toISOString();

    const bodyData = {
      ...maintenanceData,
      scheduled_date: isoDate,
      technician_id: Number(maintenanceData.technician_id) || 0,
    };

    const res = await api.post(`/equipments/${equipmentId}/maintenance`, bodyData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Lỗi tạo lịch bảo trì");
  }
}

// Cập nhật lịch bảo trì
export async function updateMaintenance(maintenanceId, maintenanceData) {
  const fixedData = {
    description: maintenanceData.description?.trim(),
    status: maintenanceData.status?.trim(),
    ...(maintenanceData.scheduled_date && {
      scheduled_date: new Date(maintenanceData.scheduled_date).toISOString(),
    }),
    ...(maintenanceData.technician_id && {
      technician_id: Number(maintenanceData.technician_id),
    }),
  };

  const res = await api.put(`/maintenance/${maintenanceId}`, fixedData);
  return res.data;
}

// Xóa lịch bảo trì
export async function deleteMaintenance(maintenanceId) {
  const res = await api.delete(`/maintenance/${maintenanceId}`);
  return res.data;
}

// Lấy chi tiết lịch bảo trì theo ID
export async function getMaintenanceById(maintenanceId) {
  const res = await api.get(`/maintenances/${maintenanceId}`);
  return res.data;
}

// Tạo repair history cho lịch bảo trì
export async function createRepairHistory(maintenanceId, data) {
  const res = await api.post(
    `/maintenance/${maintenanceId}/repair-history`,
    data
  );
  return res.data;
}

// Cập nhật repair history
export async function updateRepairHistory(repairId, data) {
  const res = await api.put(`/repair-history/${repairId}`, data);
  return res.data;
}

// Xóa repair history
export async function deleteRepairHistory(repairId) {
  await api.delete(`/repair-history/${repairId}`);
  return true;
}

// Tìm kiếm lịch bảo trì
export async function searchMaintenanceSchedules(keyword) {
  const res = await api.get(`/maintenance-schedule`, {
    params: { q: keyword },
  });
  return res.data;
}
