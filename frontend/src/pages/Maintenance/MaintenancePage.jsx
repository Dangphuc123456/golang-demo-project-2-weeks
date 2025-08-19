import React, { useEffect, useState } from "react";
import { getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance } from "../../api/maintenanceApi";
import { getEquipments } from "../../api/equipmentApi";
import { getTechnicians } from "../../api/technicianApi";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MaintenanceListPage() {
  // helpers
  const normalizeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const safeParseInt = (v, fallback) => {
    const n = parseInt(v);
    return Number.isNaN(n) ? fallback : n;
  };

  const [maintenances, setMaintenances] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(safeParseInt(localStorage.getItem("maintenancePage"), 1));
  const [rowsPerPage, setRowsPerPage] = useState(safeParseInt(localStorage.getItem("maintenanceRows"), 10));

  // --- Modal state ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMaintenance, setCurrentMaintenance] = useState(null);
  const [formData, setFormData] = useState({
    description: "",
    equipment_id: "",
    scheduled_date: "",
    status: "pending",
    technician_id: ""
  });
  const [modalError, setModalError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Fetch data ---
  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [maintenanceData, equipmentData, technicianData] =
          await Promise.all([getMaintenances(), getEquipments(), getTechnicians()]);

        if (!mounted) return;

        setMaintenances(normalizeArray(maintenanceData));
        setEquipments(normalizeArray(equipmentData));
        setTechnicians(normalizeArray(technicianData));
      } catch (err) {
        setError(err?.message || String(err));
        setMaintenances([]);
        setEquipments([]);
        setTechnicians([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem("maintenancePage", currentPage);
    localStorage.setItem("maintenanceRows", rowsPerPage);
  }, [currentPage, rowsPerPage]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil((maintenances?.length || 0) / rowsPerPage));
    if (currentPage > total) setCurrentPage(total);
  }, [maintenances, rowsPerPage]);

  const indexOfLastItem = currentPage * rowsPerPage;
  const indexOfFirstItem = indexOfLastItem - rowsPerPage;
  const currentItems = Array.isArray(maintenances) ? maintenances.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.max(1, Math.ceil((maintenances?.length || 0) / rowsPerPage));

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentMaintenance(null);
    setFormData({
      description: "",
      equipment_id: "",
      scheduled_date: new Date().toISOString().split("T")[0],
      status: "pending",
      technician_id: ""
    });
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (m) => {
    setIsEditing(true);
    setCurrentMaintenance(m);
    setFormData({
      description: m?.description || "",
      equipment_id: m?.equipment_id ?? "",
      scheduled_date: m?.scheduled_date ? new Date(m.scheduled_date).toISOString().split("T")[0] :
        new Date().toISOString().split("T")[0],
      status: m?.status || "pending",
      technician_id: m?.technician_id ?? ""
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        equipment_id: Number(formData.equipment_id),
        technician_id: formData.technician_id ? Number(formData.technician_id) : 0,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
      };

      if (isEditing) {
        await updateMaintenance(currentMaintenance.id, payload);
        toast.success("Cập nhật bảo trì thành công!");
      } else {
        await createMaintenance(Number(formData.equipment_id), payload);
        toast.success("Thêm bảo trì thành công!");
      }
      const refreshed = await getMaintenances();
      setMaintenances(normalizeArray(refreshed));
      setShowModal(false);
    } catch (err) {
      const msg = err?.message || String(err);
      setModalError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaintenance(id);
      setMaintenances(prev => (Array.isArray(prev) ? prev.filter(m => m.id !== id) : []));
      setShowDeleteConfirm(false);
      setCurrentMaintenance(null);
      toast.success("Xóa bảo trì thành công!");
    } catch (err) {
      const msg = err?.message || String(err);
      toast.error("Xóa thất bại: " + msg);
    }
  };

  if (loading) return <div className="text-center mt-4">Đang tải dữ liệu...</div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="container mt-1">
      <div className="d-flex justify-content-between align-items-center mt-1 mb-2">
        <h4 className="mb-0">Danh sách lịch bảo trì</h4>
        <button className="btn btn-primary" onClick={openAddModal}>➕ Thêm mới</button>
      </div>

      <table className="table table-striped mt-3">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Mô tả</th>
            <th>Thiết bị</th>
            <th>Ngày dự kiến</th>
            <th>Trạng thái</th>
            <th>Kỹ thuật viên</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>
                <button className="btn btn-sm btn-warning me-1" disabled>✏️ Sửa</button>
                <button className="btn btn-sm btn-danger" disabled>🗑️ Xóa</button>
              </td>
            </tr>
          ) : (
            currentItems.map((m) => {
              let rowClass = "";
              switch ((m.status || "").toLowerCase()) {
                case "pending": rowClass = "table-warning"; break;
                case "completed": rowClass = "table-success"; break;
                case "in progress": rowClass = "table-info"; break;
                case "canceled": rowClass = "table-danger"; break;
                default: rowClass = "";
              }

              const equipmentName = equipments.find((e) => e.id === m.equipment_id)?.name || m.equipment_id || "-";
              const techName = technicians.find((t) => t.id === m.technician_id)?.username || "Chưa phân công";
              const scheduled = m.scheduled_date ? new Date(m.scheduled_date).toLocaleDateString("vi-VN") : "-";

              return (
                <tr key={m.id} className={rowClass}>
                  <td>{m.id}</td>
                  <td>
                    <Link to={`/maintenance/${m.id}`} style={{ color: "#0d6efd", textDecoration: "none" }}>
                      {m.description || "-"}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/equipments/${m.equipment_id}`} style={{ color: "#2a9d8f", textDecoration: "none" }}>
                      {equipmentName}
                    </Link>
                  </td>
                  <td>{scheduled}</td>
                  <td>{m.status || "-"}</td>
                  <td>{techName}</td>
                  <td>
                    <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(m)}>✏️ Sửa</button>
                    <button className="btn btn-sm btn-danger" onClick={() => { setCurrentMaintenance(m); setShowDeleteConfirm(true); }}>🗑️ Xóa</button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Phân trang */}
      <div className="d-flex justify-content-end align-items-center mt-3">
        <div className="me-3 d-flex align-items-center">
          <label className="me-2">Hiển thị</label>
          <select className="form-select" style={{ width: "auto" }} value={rowsPerPage} onChange={(e) => { setRowsPerPage(safeParseInt(e.target.value, 10)); setCurrentPage(1); }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="ms-2">bản ghi / trang</span>
        </div>
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>&laquo;</button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>&raquo;</button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Modal Thêm/Sửa */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", minWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h2>{isEditing ? `Sửa bảo trì #${currentMaintenance?.id ?? ""}` : "Thêm bảo trì mới"}</h2>
            {modalError && <p style={{ color: "red" }}>{modalError}</p>}
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label>Mô tả:</label>
                <input type="text" name="description" value={formData.description} onChange={handleChange} className="form-control" required />
              </div>
              <div className="mb-2">
                <label>Thiết bị:</label>
                <select name="equipment_id" value={formData.equipment_id} onChange={handleChange} className="form-select" required>
                  <option value="">-- Chọn thiết bị --</option>
                  {equipments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="mb-2">
                <label>Ngày dự kiến:</label>
                <input type="date" name="scheduled_date" value={formData.scheduled_date} onChange={handleChange} className="form-control" required />
              </div>
              <div className="mb-2">
                <label>Trạng thái:</label>
                <select name="status" value={formData.status} onChange={handleChange} className="form-select" required>
                  <option value="pending">Chờ xử lý</option>
                  <option value="in progress">Đang tiến hành</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="canceled">Hủy</option>
                </select>
              </div>
              <div className="mb-2">
                <label>Kỹ thuật viên:</label>
                <select name="technician_id" value={formData.technician_id} onChange={handleChange} className="form-select">
                  <option value="">-- Chọn kỹ thuật viên --</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
                </select>
              </div>
              <div className="d-flex justify-content-end mt-3 gap-2">
                <button type="submit" style={btnPrimaryStyle}>{isEditing ? "💾 Cập nhật" : "➕ Thêm"}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>❌ Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", minWidth: "300px" }} onClick={(e) => e.stopPropagation()}>
            <h5>Xác nhận xóa bảo trì #{currentMaintenance?.id ?? ""}?</h5>
            <div className="d-flex justify-content-end mt-3 gap-2">
              <button className="btn btn-danger" onClick={() => handleDelete(currentMaintenance?.id)}>🗑️ Xóa</button>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>❌ Hủy</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
const btnPrimaryStyle = { background: "#2a9d8f", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontWeight: "bold" };