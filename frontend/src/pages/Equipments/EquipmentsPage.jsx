import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getSuppliers,
} from "../../api/equipmentApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    status: "active",
    purchase_date: "",
    supplier_id: "",
  });

  const debounceRef = useRef(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.max(1, Math.ceil(equipments.length / rowsPerPage));
  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentEquipments = equipments.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    loadEquipments();
    loadSuppliers();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // 

  async function loadSuppliers() {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Lỗi khi load suppliers:", err?.message || err);
    }
  }

  async function loadEquipments() {
    setLoading(true);
    setError(null);
    try {
      const data = await getEquipments();
      setEquipments(data || []);
      setCurrentPage(1);
    } catch (err) {
      setError(err?.message || "Lỗi tải thiết bị");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setIsEditing(false);
    setCurrentEquipment(null);
    setFormData({
      name: "",
      price: "",
      status: "active",
      purchase_date: new Date().toISOString().split("T")[0],
      supplier_id: "",
    });
    setError(null);
    setShowModal(true);
  }

  function openEditModal(eq) {
    setIsEditing(true);
    setCurrentEquipment(eq);
    const purchaseDate = eq.purchase_date
      ? new Date(eq.purchase_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setFormData({
      name: eq.name || "",
      price: eq.price != null ? eq.price : "",
      status: eq.status || "active",
      purchase_date: purchaseDate,
      supplier_id: eq.supplier_id || "",
    });

    setError(null);
    setShowModal(true);
  }


  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        status: formData.status,
        supplier_id: formData.supplier_id ? Number(formData.supplier_id) : null,
        purchase_date: formData.purchase_date ? new Date(formData.purchase_date).toISOString() : null,
      };

      if (isEditing) {
        await updateEquipment(currentEquipment.id, payload);
        setShowModal(false); // đóng modal trước
        toast.success(`Cập nhật thiết bị #${currentEquipment.id} thành công`);
      } else {
        await createEquipment(payload);
        setShowModal(false);
        toast.success("Thêm thiết bị mới thành công");
      }

      // Load lại dữ liệu sau 300ms để toast hiển thị ổn định
      setTimeout(() => {
        loadEquipments();
      }, 300);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
        toast.error(err.response.data.message);
      } else {
        const msg = err.message || "Lỗi thao tác";
        setError(msg);
        toast.error(msg);
      }
    }
  }
  function openDeleteModal(eq) {
    setCurrentEquipment(eq);
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    try {
      await deleteEquipment(currentEquipment.id);
      setShowDeleteModal(false);
      loadEquipments();
      toast.success(`Xóa thiết bị #${currentEquipment.id} thành công`);
    } catch (err) {
      const msg = err.message || "Lỗi xóa";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div style={{ padding: 14, fontFamily: "Arial, sans-serif" }}>
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h4 className="m-0">Danh sách Thiết bị</h4>

        <button onClick={openAddModal} className="btn btn-primary fw-bold">
          ➕ Thêm mới
        </button>
      </div>

      {error && <p className="text-danger">Lỗi: {error}</p>}

      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : equipments.length === 0 ? (
        <p>Chưa có thiết bị nào.</p>
      ) : (
        <>
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>ID</th>
                <th>Tên thiết bị</th>
                <th>Gía</th>
                <th>Trạng thái</th>
                <th>Ngày nhập</th>
                <th>Nhà cung cấp</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentEquipments.map((eq) => {
                let rowClass = "";
                let statusText = "";
                switch (eq.status) {
                  case "active":
                    rowClass = "table-success";
                    statusText = "Hoạt động";
                    break;
                  case "maintenance":
                    rowClass = "table-warning";
                    statusText = "Bảo trì";
                    break;
                  case "inactive":
                    rowClass = "table-danger";
                    statusText = "Hỏng";
                    break;
                  default:
                    rowClass = "";
                    statusText = eq.status;
                }

                return (
                  <tr key={eq.id} className={rowClass}>
                    <td>{eq.id}</td>
                    <td>
                      <Link to={`/equipments/${eq.id}`} className="text-primary text-decoration-none">
                        {eq.name}
                      </Link>
                    </td>
                    <td>{eq.price != null ? eq.price.toLocaleString() : "-"}đ</td>
                    <td>{statusText}</td>
                    <td>
                      {eq.purchase_date === "0001-01-01" || !eq.purchase_date
                        ? "-"
                        : new Date(eq.purchase_date).toLocaleDateString("vi-VN")}
                    </td>
                    <td>{suppliers.find((s) => s.id === eq.supplier_id)?.name || "-"}</td>
                    <td className="text-center">
                      <button className="btn btn-sm btn-warning me-1" title="Sửa" onClick={() => openEditModal(eq)}>✏️ Sửa</button>
                      <button className="btn btn-sm btn-danger" title="Xóa" onClick={() => openDeleteModal(eq)}>🗑️ Xóa</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="d-flex align-items-center justify-content-end mt-3 gap-3">
            <div className="d-flex align-items-center gap-1">
              <span>Hiển thị</span>
              <select
                className="form-select"
                style={{ width: "70px", padding: "0.25rem 0.5rem", fontSize: "0.875rem" }}
                value={rowsPerPage}
                onChange={(e) => { setCurrentPage(1); setRowsPerPage(Number(e.target.value)); }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>bản ghi / trang</span>
              <span>Tổng {totalPages} trang ({equipments.length} bản ghi)</span>
            </div>

            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(1)}>«</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(totalPages)}>»</button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* --- Modal Thêm/Sửa (giữ nguyên style bạn dùng) --- */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>{isEditing ? `Sửa thiết bị #${currentEquipment?.id}` : "Thêm thiết bị"}</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <form onSubmit={handleSubmit}>
              <div style={formGroupStyle}>
                <label>Tên thiết bị:</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={formGroupStyle}>
                <label>Giá:</label>
                <input type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={formGroupStyle}>
                <label>Trạng thái:</label>
                <select name="status" value={formData.status} onChange={handleChange} style={inputStyle} required>
                  <option value="active">Hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="inactive">Hỏng</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label>Ngày nhập:</label>
                <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={formGroupStyle}>
                <label>Nhà cung cấp:</label>
                <select name="supplier_id" value={formData.supplier_id} onChange={handleChange} style={inputStyle} required>
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ textAlign: "right" }}>
                <button type="submit" style={btnPrimaryStyle}>{isEditing ? "💾 Cập nhật" : "➕ Thêm mới"}</button>
                <button type="button" onClick={() => setShowModal(false)} style={btnCancelStyle}>❌ Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Modal Xóa --- */}
      {showDeleteModal && (
        <div style={overlayStyle} onClick={() => setShowDeleteModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={modalTitleStyle}>Xóa thiết bị #{currentEquipment?.id}</h2>
            <p>Bạn có chắc chắn muốn xóa thiết bị <strong>{currentEquipment?.name}</strong> không?</p>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <div style={{ textAlign: "right" }}>
              <button onClick={handleDeleteConfirm} style={btnDangerStyle}>🗑️ Xác nhận</button>
              <button onClick={() => setShowDeleteModal(false)} style={btnCancelStyle}>❌ Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- styles (copy từ bạn hoặc dùng nguyên) ---
const overlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCardStyle = { background: "#fff", padding: "20px 25px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: "400px", maxWidth: "90%" };
const modalTitleStyle = { marginBottom: "20px", fontSize: "20px", fontWeight: "bold", textAlign: "center" };
const formGroupStyle = { marginBottom: "15px", display: "flex", flexDirection: "column" };
const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px", outline: "none" };
const btnPrimaryStyle = { background: "#2a9d8f", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontWeight: "bold" };
const btnCancelStyle = { background: "#ccc", color: "#000", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer" };
const btnDangerStyle = { background: "#e53935", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "8px" };
