import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}/api`;

// Tạo axios instance để tái sử dụng
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động gắn token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ================== SUPPLIERS ==================

// Lấy tất cả nhà cung cấp
export async function fetchAllSuppliers() {
  try {
    const res = await api.get("/suppliers");
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to fetch suppliers");
  }
}

// Tạo nhà cung cấp mới
export async function createSupplier(supplierData) {
  try {
    const res = await api.post("/suppliers", supplierData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to create supplier");
  }
}

// Cập nhật nhà cung cấp
export async function updateSupplier(id, supplierData) {
  try {
    const res = await api.put(`/suppliers/${id}`, supplierData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to update supplier");
  }
}

// Xóa nhà cung cấp
export async function deleteSupplier(id) {
  try {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to delete supplier");
  }
}

// Lấy nhà cung cấp theo ID
export async function fetchSupplierById(id) {
  try {
    const res = await api.get(`/suppliers/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Lỗi khi lấy nhà cung cấp");
  }
}

// ================== EQUIPMENTS thuộc SUPPLIER ==================

// Thêm thiết bị vào nhà cung cấp
export async function addEquipmentToSupplier(supplierId, equipmentData) {
  try {
    const res = await api.post(`/suppliers/${supplierId}/equipments`, equipmentData);
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Failed to add equipment");
  }
}

// Cập nhật thiết bị trong nhà cung cấp
export async function updateEquipment(supplierId, equipmentId, equipmentData) {
  const fixedData = {
    name: equipmentData.name?.trim(),
    price: Number(equipmentData.price),
    status: equipmentData.status?.trim(),
    purchase_date: new Date(equipmentData.purchase_date).toISOString(),
  };
  try {
    const res = await api.put(
      `/suppliers/${supplierId}/equipments/${equipmentId}`,
      fixedData
    );
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Lỗi cập nhật thiết bị");
  }
}

// Xóa thiết bị (theo id)
export async function deleteEquipment(equipmentId) {
  try {
    await api.delete(`/equipments/${equipmentId}`);
    return true;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Xóa thiết bị thất bại");
  }
}

export async function searchSuppliers({ name, phone, email, address }) {
  try {
    const params = {};
    if (name) params.name = name.trim();
    if (phone) params.phone = phone.trim();
    if (email) params.email = email.trim();
    if (address) params.address = address.trim();

    const res = await api.get("/suppliers/search", { params });
    return res.data;
  } catch (err) {
    console.error("Error searching suppliers:", err);
    throw err;
  }
}

