import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchSupplierById,
  addEquipmentToSupplier,
  updateEquipment,
  deleteEquipment,
} from "../../api/suppliersApi";

export default function SupplierDetailPage() {
  const { id } = useParams();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentEquipment, setCurrentEquipment] = useState({
    id: null,
    name: "",
    price: "",
    purchase_date: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    async function loadSupplier() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSupplierById(id);
        setSupplier(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSupplier();
  }, [id]);

  const openAddModal = () => {
    setModalMode("add");
    setCurrentEquipment({ id: null, name: "", price: "", purchase_date: "", status: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (equipment) => {
    setModalMode("edit");
    setCurrentEquipment({
      id: equipment.id,
      name: equipment.name || "",
      price: equipment.price != null ? equipment.price.toString() : "",
      // Giữ nguyên định dạng yyyy-mm-dd để input type=date hiển thị đúng
      purchase_date: equipment.purchase_date
        ? new Date(equipment.purchase_date).toISOString().slice(0, 10)
        : "",
      status: equipment.status || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, price, purchase_date, status } = currentEquipment;

    if (!name || !price || !purchase_date || !status) {
      alert("Vui lòng điền đầy đủ thông tin thiết bị");
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Giá phải là số lớn hơn 0");
      return;
    }

    // Gửi luôn ISO string như add
    const payload = {
      name,
      price: parsedPrice,
      purchase_date: new Date(purchase_date).toISOString(), // ISO string
      status,
    };

    try {
      if (modalMode === "add") {
        const added = await addEquipmentToSupplier(supplier.id, payload);
        setSupplier((prev) => ({
          ...prev,
          equipments: prev.equipments ? [...prev.equipments, added] : [added],
        }));
      } else {
        const updated = await updateEquipment(supplier.id, currentEquipment.id, payload);
        setSupplier((prev) => ({
          ...prev,
          equipments: prev.equipments.map((eq) =>
            eq.id === currentEquipment.id ? updated : eq
          ),
        }));
      }
      closeModal();
    } catch (err) {
      alert(err.message);
    }
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentEquipment({ id: null, name: "", price: "", purchase_date: "", status: "" });
  };


  const handleDeleteEquipment = async (equipmentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thiết bị này?")) return;
    try {
      await deleteEquipment(supplier.id, equipmentId);
      setSupplier((prev) => ({
        ...prev,
        equipments: prev.equipments.filter((eq) => eq.id !== equipmentId),
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Đang tải thông tin nhà cung cấp...</p>;
  if (error) return <p style={{ color: "red" }}>Lỗi: {error}</p>;
  if (!supplier) return <p>Không tìm thấy nhà cung cấp.</p>;


  const totalEquipments = supplier.equipments ? supplier.equipments.length : 0;
  const totalPages = Math.ceil(totalEquipments / rowsPerPage);
  const indexOfLastRecord = currentPage * rowsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - rowsPerPage;
  const currentEquipments = supplier.equipments
    ? supplier.equipments.slice(indexOfFirstRecord, indexOfLastRecord)
    : [];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
        {/* Thông tin nhà cung cấp */}
        <div style={{ flex: 1, border: "1px solid #ddd", padding: 16, borderRadius: 4 }}>
          <h4>Chi tiết nhà cung cấp #{supplier.id}</h4>
          <div className="mb-3">
            <label className="form-label">Tên:</label>
            <input type="text" className="form-control" value={supplier.name} readOnly />
          </div>
          <div className="mb-3">
            <label className="form-label">Số điện thoại:</label>
            <input type="text" className="form-control" value={supplier.phone || "-"} readOnly />
          </div>
          <div className="mb-3">
            <label className="form-label">Email:</label>
            <input type="email" className="form-control" value={supplier.email || "-"} readOnly />
          </div>
          <div className="mb-3">
            <label className="form-label">Địa chỉ:</label>
            <input type="text" className="form-control" value={supplier.address || "-"} readOnly />
          </div>
          <Link to="/suppliers" className="btn btn-secondary mt-2">← Quay lại</Link>
        </div>

        {/* Danh sách thiết bị */}
        <div style={{ flex: 2, border: "1px solid #ddd", padding: 16, borderRadius: 4, overflowX: "auto" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="m-0">Danh sách thiết bị đã mua</h4>
            <button onClick={openAddModal} className="btn btn-primary fw-bold">➕ ADD</button>
          </div>

          {totalEquipments > 0 ? (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#2c3e50", color: "white" }}>
                  <tr>
                    <th style={{ padding: 8, textAlign: "left" }}>ID</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Tên thiết bị</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Gía</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Ngày mua</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Trạng thái</th>
                    <th style={{ padding: 8, textAlign: "left" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEquipments.map((eq) => (
                    <tr key={eq.id} style={{ borderBottom: "1px solid #ddd" }}>
                      <td style={{ padding: 8 }}>{eq.id}</td>
                      <td style={{ padding: 8 }}>
                        <Link to={`/equipments/${eq.id}`} style={{ color: "#3498db", textDecoration: "none", cursor: "pointer" }}>
                          {eq.name}
                        </Link>
                      </td>
                      <td style={{ padding: 8 }}>
                        {eq.price ? Number(eq.price).toLocaleString("vi-VN") + " đ" : "-"}
                      </td>

                      <td style={{ padding: 8 }}>{new Date(eq.purchase_date).toLocaleDateString("vi-VN")}</td>
                      <td style={{ padding: 8, textTransform: "capitalize" }}>{eq.status}</td>
                      <td style={{ padding: 8 }}>
                        <button onClick={() => openEditModal(eq)} style={{ backgroundColor: "#f39c12", border: "none", color: "white", padding: "6px 12px", cursor: "pointer", borderRadius: 4, marginRight: 8 }}>Sửa</button>
                        <button onClick={() => handleDeleteEquipment(eq.id)} style={{ backgroundColor: "#c0392b", border: "none", color: "white", padding: "6px 12px", cursor: "pointer", borderRadius: 4 }}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Phân trang */}
              <div className="d-flex justify-content-end align-items-center mt-3">
                {/* Chọn số bản ghi */}
                <div className="me-3 d-flex align-items-center">
                  <label className="me-2">Hiển thị</label>
                  <select
                    className="form-select"
                    style={{ width: "auto" }}
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="ms-2">bản ghi / trang</span>
                  <span className="ms-3 text-muted">
                    Tổng {totalPages} trang ({totalEquipments} bản ghi)
                  </span>
                </div>

                {/* Nút phân trang */}
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>&laquo;</button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}>&raquo;</button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          ) : (
            <p>Nhà cung cấp chưa có thiết bị nào.</p>
          )}
        </div>
      </div>

      {/* Modal thêm / sửa thiết bị */}
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalMode === "add" ? "Thêm thiết bị mới" : "Sửa thiết bị"}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body">
                  <label className="fw-bold">Tên thiết bị</label>
                  <input
                    type="text"
                    className="form-control mb-2"
                    value={currentEquipment.name}
                    onChange={(e) =>
                      setCurrentEquipment({ ...currentEquipment, name: e.target.value })
                    }
                    required
                  />

                  <label className="fw-bold">Gía</label>
                  <input
                    type="number"
                    className="form-control mb-2"
                    value={currentEquipment.price}
                    onChange={(e) =>
                      setCurrentEquipment({ ...currentEquipment, price: e.target.value })
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                  <label className="fw-bold">Ngày mua</label>
                  <input
                    type="date"
                    className="form-control mb-2"
                    value={currentEquipment.purchase_date}
                    onChange={(e) =>
                      setCurrentEquipment({ ...currentEquipment, purchase_date: e.target.value })
                    }
                    required
                  />

                  <label className="fw-bold">Trạng thái</label>
                  <select
                    className="form-control mb-2"
                    value={currentEquipment.status}
                    onChange={(e) =>
                      setCurrentEquipment({ ...currentEquipment, status: e.target.value })
                    }
                    required
                  >
                    <option value="">-- Chọn trạng thái --</option>
                    <option value="active">Hoạt động</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="inactive">Hỏng</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Đóng
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalMode === "add" ? "Thêm" : "Lưu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
