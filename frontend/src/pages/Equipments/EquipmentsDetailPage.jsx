import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEquipmentDetail, getSuppliers } from "../../api/equipmentApi";
import { createMaintenance, updateMaintenance, deleteMaintenance } from "../../api/maintenanceApi";
import { getTechnicians } from "../../api/technicianApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function EquipmentsDetailPage() {
  const { id } = useParams();
  const [equipment, setEquipment] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [technicians, setTechnicians] = useState([]);

  // Modal edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    scheduled_date: "",
    description: "",
    technician_id: "",
    status: "pending",
  });

  // Modal delete
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    scheduled_date: new Date().toISOString().slice(0, 10),
    description: "",
    technician_id: "",
    status: "pending",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const suppliersData = await getSuppliers();
        setSuppliers(suppliersData);

        const techData = await getTechnicians();
        setTechnicians(techData);

        const data = await getEquipmentDetail(id);
        setEquipment(data.equipment || {});
        setSchedules(data.schedules || []);
      } catch (e) {
        setErr(e.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const reloadSchedules = async () => {
    const data = await getEquipmentDetail(id);
    setSchedules(data.schedules || []);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMaintenance(id, {
        scheduled_date: form.scheduled_date,
        description: form.description || "",
        technician_id: form.technician_id,
        status: form.status,
      });

      // ✅ reload cả equipment và schedules
      const data = await getEquipmentDetail(id);
      setEquipment(data.equipment || {});
      setSchedules(data.schedules || []);

      setForm({
        scheduled_date: new Date().toISOString().slice(0, 10),
        description: "",
        technician_id: "",
        status: "pending",
      });
      setShowForm(false);
      toast.success("Tạo lịch bảo trì thành công!");
    } catch (e) {
      toast.error(e.message || "Không tạo được lịch bảo trì");
    }
  };


  const openEditModal = (schedule) => {
    setEditForm({
      id: schedule.id,
      scheduled_date: schedule.scheduled_date?.slice(0, 10) || "",
      description: schedule.description || "",
      technician_id: schedule.technician_id || "",
      status: schedule.status || "pending",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateMaintenance(editForm.id, {
        scheduled_date: editForm.scheduled_date,
        description: editForm.description,
        technician_id: editForm.technician_id,
        status: editForm.status,
      });
      await reloadSchedules();
      setShowEditModal(false);
      toast.success("Cập nhật lịch bảo trì thành công!");
    } catch (e) {
      toast.error(e.message || "Cập nhật không thành công");
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMaintenance(deleteId);
      await reloadSchedules();
      setShowDeleteModal(false);
      toast.success("Xóa lịch bảo trì thành công!");
    } catch (e) {
      toast.error(e.message || "Xóa không thành công");
    }
  };

  if (loading) return <p>Đang tải...</p>;
  if (err) return <p className="text-danger">Lỗi: {err}</p>;
  if (!equipment) return <p>Không tìm thấy thiết bị.</p>;

  const supplierName = suppliers.find(s => s.id === equipment.supplier_id)?.name || "-";

  return (
    <div className="container py-3">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="row g-3">
        {/* Thông tin thiết bị */}
        <div className="col-md-4">
          <div className="card p-3">
            <h4 className="mb-3">Thiết bị #{equipment.id}</h4>
            <div className="mb-3">
              <label className="form-label">Tên</label>
              <input type="text" className="form-control" value={equipment.name || "-"} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label">Gía</label>
              <input type="text" className="form-control" value={equipment.price ? equipment.price.toLocaleString('vi-VN') + ' ₫' : '-'} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label">Ngày nhập</label>
              <input type="text" className="form-control" value={equipment.purchase_date ? new Date(equipment.purchase_date).toLocaleDateString("vi-VN") : "-"} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label">Trạng thái</label>
              <input type="text" className="form-control" value={equipment.status || "-"} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label">Nhà cung cấp</label>
              <input type="text" className="form-control" value={supplierName} readOnly />
            </div>
            <Link to="/equipments" className="btn btn-secondary mt-2">← Quay lại</Link>
          </div>
        </div>

        {/* Lịch bảo trì */}
        <div className="col-md-8">
          <div className="card p-3">
            <h4>Lịch bảo trì</h4>
            {schedules.length ? (
              <table className="table table-striped mt-3">
                <thead className="table-dark">
                  <tr>
                    <th>Mô tả</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th>Người lập</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id}>
                      <td>
                        <Link
                          to={`/maintenance/${s.id}`}
                          style={{ color: "#0d6efd", textDecoration: "none" }}
                        >
                          {s.description || "-"}
                        </Link>
                      </td>
                      <td>
                        {s.scheduled_date
                          ? new Date(s.scheduled_date).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="text-capitalize">{s.status}</td>
                      <td>{technicians.find(t => t.id === s.technician_id)?.username || "-"}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(s)}>✏️Sửa</button>
                        <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(s.id)}>🗑️ Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-3">Chưa có lịch bảo trì.</p>
            )}

            {/* Form thêm */}
            <div className="mt-3 border-top pt-3">
              {!showForm && <button className="btn btn-success" onClick={() => setShowForm(true)}>➕ Thêm lịch</button>}
              {showForm && (
                <form onSubmit={handleCreate} className="mt-3">
                  <div className="mb-3">
                    <label className="form-label">Ngày bảo trì</label>
                    <input type="date" className="form-control" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả</label>
                    <input type="text" className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Người lập</label>
                    <select className="form-select" value={form.technician_id} onChange={e => setForm({ ...form, technician_id: parseInt(e.target.value) })} required>
                      <option value="">-- Chọn kỹ thuật viên --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="text-end">
                    <button type="submit" className="btn btn-success me-2">Tạo</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleEditSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Chỉnh sửa lịch bảo trì</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Ngày bảo trì</label>
                    <input type="date" className="form-control" value={editForm.scheduled_date} onChange={e => setEditForm({ ...editForm, scheduled_date: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mô tả</label>
                    <input type="text" className="form-control" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Kỹ thuật viên</label>
                    <select className="form-select" value={editForm.technician_id} onChange={e => setEditForm({ ...editForm, technician_id: parseInt(e.target.value) })} required>
                      <option value="">-- Chọn kỹ thuật viên --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>{t.username}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Lưu</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận xóa</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc chắn muốn xóa lịch bảo trì này?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>Xóa</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
