import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {
  getMaintenanceById,
  createRepairHistory,
  updateRepairHistory,
  deleteRepairHistory
} from "../../api/maintenanceApi";
import { getTechnicians } from "../../api/technicianApi";
import { getEquipments } from "../../api/equipmentApi";

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const [maintenance, setMaintenance] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    issue_description: "",
    repair_date: "",
    cost: "",
    status: "Active",
    technician_id: ""
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getMaintenanceById(id);
        setMaintenance(data.maintenance);
        setHistory(Array.isArray(data.history) ? data.history : []);
        const techList = await getTechnicians();
        setTechnicians(techList);
        const equipmentList = await getEquipments();
        setEquipments(equipmentList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const openAddModal = () => {
    setEditMode(false);
    setFormData({
      id: null,
      issue_description: "",
      repair_date: "",
      cost: "",
      status: "Active",
      technician_id: ""
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditMode(true);
    setFormData({
      id: item.id,
      issue_description: item.issue_description,
      repair_date: item.repair_date.split("T")[0], // YYYY-MM-DD
      cost: item.cost,
      status: item.status || "Active",
      technician_id: item.technician_id || ""
    });
    setShowModal(true);
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const closeModal = () => setShowModal(false);
  const closeDeleteModal = () => setShowDeleteModal(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.issue_description || !formData.repair_date) {
      alert("Vui lòng nhập đầy đủ mô tả và ngày bảo trì!");
      return;
    }

    try {
      const payload = {
        issue_description: formData.issue_description,
        repair_date: new Date(formData.repair_date).toISOString(),
        cost: Number(formData.cost) || 0,
        technician_id: formData.technician_id ? Number(formData.technician_id) : null
      };

      console.log("Payload gửi đi:", payload);

      if (editMode) {
        await updateRepairHistory(formData.id, payload);
      } else {
        await createRepairHistory(id, payload);
      }

      const data = await getMaintenanceById(id);
      setMaintenance(data.maintenance);
      setHistory(Array.isArray(data.history) ? data.history : []);

      closeModal();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRepairHistory(deleteId);

      const data = await getMaintenanceById(id);
      setMaintenance(data.maintenance);
      setHistory(Array.isArray(data.history) ? data.history : []);

      closeDeleteModal();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5">
        <div className="spinner-border text-primary"></div>
        <span className="ms-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) return <p className="text-danger mt-4">Lỗi: {error}</p>;
  if (!maintenance) return <p className="mt-4">Không tìm thấy lịch bảo trì</p>;

  return (
    <div className="container mt-4">
      <div className="row">
        {/* Thông tin Maintenance */}
        <div className="col-lg-4 mb-4">
          <div className="card p-3 border border-secondary shadow-sm h-100">
            <h4>Chi tiết lịch bảo trì #{maintenance.id}</h4>

            <div className="mb-3">
              <label className="form-label fw-semibold">Mô tả</label>
              <input
                className="form-control"
                value={maintenance.description}
                readOnly
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Ngày bảo trì</label>
              <input
                className="form-control"
                value={new Date(maintenance.scheduled_date).toLocaleDateString("vi-VN")}
                readOnly
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Trạng thái</label>
              <input className="form-control" value={maintenance.status} readOnly />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Thiết bị</label>
              <input
                className="form-control"
                value={
                  equipments.find((e) => e.id === maintenance.equipment_id)?.name ||
                  maintenance.equipment_id
                }
                readOnly
              />
            </div>

            <Link to="/maintenance" className="btn btn-secondary mt-2">
              ← Quay lại
            </Link>
          </div>
        </div>

        {/* Lịch sử Repair */}
        <div className="col-lg-8 mb-4">
          <div className="card p-3 border border-secondary shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4>Lịch sử bảo trì</h4>
              <button className="btn btn-primary" onClick={openAddModal}>
                + ADD
              </button>
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th>Ngày</th>
                    <th>Mô tả sự cố</th>
                    <th>Chi phí</th>
                    <th>Kỹ thuật viên</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">
                        Chưa có lịch sử bảo trì
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => (
                      <tr key={h.id}>
                        <td>{new Date(h.repair_date).toLocaleDateString("vi-VN")}</td>
                        <td
                          style={{
                            maxWidth: "150px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            cursor: "pointer",
                          }}
                          data-tooltip-id={`tooltip-${h.id}`}
                          data-tooltip-content={h.issue_description}
                        >
                          {h.issue_description}
                        </td>
                        <td>{Number(h.cost).toLocaleString("vi-VN")}₫</td>
                        <td>
                          {technicians.find((t) => t.id === h.technician_id)?.username ||
                            "Chưa phân công"}
                        </td>
                        <td style={{ padding: 12, textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                              className="btn btn-sm btn-warning"
                              onClick={() => openEditModal(h)}
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => openDeleteModal(h.id)}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {history.map((h) => (
                <ReactTooltip
                  key={h.id}
                  id={`tooltip-${h.id}`}
                  place="top"
                  style={{ zIndex: 9999 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editMode ? "Sửa lịch sử bảo trì" : "Thêm lịch sử bảo trì"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <label className="fw-bold">Mô tả sự cố</label>
                  <input
                    name="issue_description"
                    className="form-control mb-2"
                    value={formData.issue_description}
                    onChange={handleChange}
                  />
                  <label className="fw-bold">Ngày bảo trì</label>
                  <input
                    type="date"
                    name="repair_date"
                    className="form-control mb-2"
                    value={formData.repair_date}
                    onChange={handleChange}
                  />
                  <label className="fw-bold">Chi phí</label>
                  <input
                    type="number"
                    name="cost"
                    className="form-control mb-2"
                    value={formData.cost}
                    onChange={handleChange}
                  />
                  <label className="fw-bold">Trạng thái</label>
                  <select
                    name="status"
                    className="form-control mb-2"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  <label className="fw-bold">Kỹ thuật viên</label>
                  <select
                    name="technician_id"
                    className="form-control"
                    value={formData.technician_id}
                    onChange={handleChange}
                  >
                    <option value="">-- Chọn --</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Đóng
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="modal fade show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-danger">Xác nhận xóa</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
              </div>
              <div className="modal-body">
                Bạn có chắc muốn xóa lịch sử bảo trì này không?
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
                  Hủy
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
