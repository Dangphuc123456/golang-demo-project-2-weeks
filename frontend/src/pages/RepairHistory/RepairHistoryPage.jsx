import React, { useEffect, useState } from "react";
import { getMaintenances, updateRepairHistory, deleteRepairHistory } from "../../api/maintenanceApi"; // import 2 hàm
import { getTechnicians } from "../../api/technicianApi";
import { getRepairHistory, } from "../../api/repairhistoryApi";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function MaintenancePage() {
  const normalizeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [currentHistory, setCurrentHistory] = useState(null);
  const [formData, setFormData] = useState({ issue_description: "", technician_id: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [histData, techData, maintData] = await Promise.all([
          getRepairHistory(),
          getTechnicians(),
          getMaintenances()
        ]);
        if (!mounted) return;
        setHistories(normalizeArray(histData));
        setTechnicians(normalizeArray(techData));
        setMaintenances(normalizeArray(maintData));
      } catch (err) {
        setError(err?.message || String(err));
        setHistories([]);
        setTechnicians([]);
        setMaintenances([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const total = Math.max(1, Math.ceil((histories?.length || 0) / rowsPerPage));
    if (currentPage > total) setCurrentPage(total);
  }, [histories, rowsPerPage]);

  const openEditModal = (history) => {
    setCurrentHistory(history);
    setFormData({
      issue_description: history.issue_description || "",
      technician_id: history.technician_id ?? "",
      repair_date: history.repair_date
        ? new Date(history.repair_date).toISOString().slice(0, 10)
        : "",
      cost: history.cost ?? 0,
      maintenance_id: history.maintenance_id ?? "",
    });
    setShowModal(true);
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.repair_date) {
      toast.error("Ngày bảo trì không được để trống");
      return;
    }

    try {
      const payload = {
        issue_description: formData.issue_description,
        technician_id: formData.technician_id ? Number(formData.technician_id) : null,
        repair_date: new Date(formData.repair_date + "T00:00:00Z").toISOString(),
        cost: Number(formData.cost) || 0,
        maintenance_id: formData.maintenance_id ? Number(formData.maintenance_id) : null,
      };

      await updateRepairHistory(currentHistory.id, payload); // từ maintenanceApi.js
      toast.success("Cập nhật thành công!");
      setShowModal(false);

      const refreshed = await getRepairHistory();
      setHistories(normalizeArray(refreshed));
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Cập nhật thất bại");
    }
  };
  const openDeleteModal = (history) => {
    setCurrentHistory(history);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await deleteRepairHistory(currentHistory.id); 
      toast.success("Xóa thành công!");
      setShowDeleteModal(false);
      const refreshed = await getRepairHistory();
      setHistories(normalizeArray(refreshed));
      setCurrentHistory(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Xóa thất bại");
    }
  };

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p className="text-danger">Lỗi: {error}</p>;

  const indexOfLastRecord = currentPage * rowsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - rowsPerPage;
  const currentRecords = Array.isArray(histories) ? histories.slice(indexOfFirstRecord, indexOfLastRecord) : [];
  const totalPages = Math.max(1, Math.ceil((histories?.length || 0) / rowsPerPage));

  return (
    <div>
      <ToastContainer />
      <h4>Lịch sử bảo trì</h4>
      <table className="table table-striped table-hover mt-3">
        <thead className="table-dark">
          <tr>
            <th>ID</th>
            <th>Bảo trì</th>
            <th>Mô tả lỗi</th>
            <th>Ngày bảo trì</th>
            <th>Chi phí</th>
            <th>Kỹ thuật viên</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {currentRecords.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center">Không có dữ liệu</td>
            </tr>
          ) : (
            currentRecords.map((rh) => (
              <tr key={rh.id}>
                <td>{rh.id}</td>
                <td>{maintenances.find(m => m.id === rh.maintenance_id)?.description || "-"}</td>
                <td>
                  <Link to={`/maintenance/${rh.maintenance_id}`} style={{ color: "#0d6efd", textDecoration: "none" }}>
                    {rh.issue_description || "-"}
                  </Link>
                </td>
                <td>{rh.repair_date ? new Date(rh.repair_date).toLocaleDateString("vi-VN") : "-"}</td>
                <td>{Number(rh?.cost ?? 0).toLocaleString("vi-VN")} đ</td>
                <td>{technicians.find((t) => t.id === rh.technician_id)?.username || "Chưa phân công"}</td>
                <td>
                  <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(rh)}>✏️ Sửa</button>
                  <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(rh)}>🗑️ Xóa</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Modal Sửa */}
      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <h3>Sửa lịch sử bảo trì #{currentHistory?.id ?? ""}</h3>
            <form onSubmit={handleUpdate}>
              <div style={formGroupStyle}>
                <label>Mô tả lỗi:</label>
                <input type="text" name="issue_description" value={formData.issue_description} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={formGroupStyle}>
                <label>Ngày bảo trì:</label>
                <input
                  type="date"
                  name="repair_date"
                  value={formData.repair_date}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={formGroupStyle}>
                <label>Chi phí:</label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  style={inputStyle}
                  min="0"
                />
              </div>

              <div style={formGroupStyle}>
                <label>Bảo trì:</label>
                <select
                  name="maintenance_id"
                  value={formData.maintenance_id}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Chọn bảo trì</option>
                  {maintenances.map((m) => (
                    <option key={m.id} value={m.id}>{m.description}</option>
                  ))}
                </select>
              </div>

              <div style={formGroupStyle}>
                <label>Kỹ thuật viên:</label>
                <select name="technician_id" value={formData.technician_id} onChange={handleChange} style={inputStyle}>
                  <option value="">Chưa phân công</option>
                  {technicians.map((t) => <option key={t.id} value={t.id}>{t.username}</option>)}
                </select>
              </div>
              <div style={{ textAlign: "right" }}>
                <button type="submit" style={btnPrimaryStyle}>💾 Cập nhật</button>
                <button type="button" onClick={() => setShowModal(false)} style={btnCancelStyle}>❌ Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xóa */}
      {showDeleteModal && (
        <div style={overlayStyle} onClick={() => setShowDeleteModal(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <h3>Xóa lịch sử bảo trì #{currentHistory?.id ?? ""}</h3>
            <p>Bạn có chắc muốn xóa bản ghi này?</p>
            <div style={{ textAlign: "right" }}>
              <button onClick={handleDelete} style={btnDangerStyle}>🗑️ Xác nhận</button>
              <button onClick={() => setShowDeleteModal(false)} style={btnCancelStyle}>❌ Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Styles */
const overlayStyle = {
  position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
  backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
  justifyContent: "center", zIndex: 1000,
};
const modalCardStyle = {
  background: "#fff", padding: "20px 25px", borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: "400px", maxWidth: "90%",
};
const formGroupStyle = { marginBottom: "15px", display: "flex", flexDirection: "column" };
const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" };
const btnPrimaryStyle = { background: "#2a9d8f", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontWeight: "bold" };
const btnCancelStyle = { background: "#ccc", color: "#000", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer" };
const btnDangerStyle = { background: "#e53935", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "8px" };
