import React, { useState } from "react";
import { useUsers, updateUser, deleteUser } from "../../api/userApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UsersPage() {
  const { users, loading, error, refetch } = useUsers();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editData, setEditData] = useState({ username: "", email: "", role: "" });

  const [rowsPerPage, setRowsPerPage] = useState(Number(localStorage.getItem("rowsPerPage")) || 10);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(users.length / rowsPerPage);
  const currentUsers = users.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (loading) return <p>Đang tải dữ liệu...</p>;
  if (error) return <p style={{ color: "red" }}>Lỗi: {error}</p>;

  const openEditModal = (user) => {
    setCurrentUser(user);
    setEditData({ username: user.username, email: user.email, role: user.role });
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };


  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await updateUser(currentUser.id, editData);
      setShowEditModal(false);
      toast.success(res.message);
      setTimeout(() => {
        refetch();
      }, 3000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await deleteUser(currentUser.id);
      toast.success(res?.message || "Xóa user thành công!");
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Lỗi khi xóa user");
    }
  };

  return (
    <div style={{ padding: 14 }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h4>Danh sách người dùng</h4>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead style={{ backgroundColor: "#2c3e50", color: "white" }}>
          <tr>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Username</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Số điện thoại</th>
            <th style={thStyle}>Ngày tạo</th>
            <th style={thStyle}>Ngày cập nhật</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map(u => (
            <tr key={u.id} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={tdStyle}>{u.id}</td>
              <td style={tdStyle}>{u.username}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>{u.role}</td>
              <td style={tdStyle}>{u.phone}</td>
              <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
              <td style={tdStyle}>{new Date(u.updated_at).toLocaleDateString()}</td>
              <td style={{ ...tdStyle, textAlign: "center" }}>
                <button className="btn btn-sm btn-warning me-1" onClick={() => openEditModal(u)}>✏️ Sửa</button>
                <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(u)}>🗑️ Xóa</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="d-flex justify-content-end align-items-center mt-3 gap-3">
        <span>Hiển thị</span>
        <select
          className="form-select"
          style={{ width: 70 }}
          value={rowsPerPage}
          onChange={e => {
            const v = Number(e.target.value);
            setRowsPerPage(v);
            localStorage.setItem("rowsPerPage", v);
            setCurrentPage(1);
          }}
        >
          {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span>bản ghi / trang</span>
        <span className="ms-3">Tổng {totalPages} trang ({users.length} bản ghi)</span>
        <ul className="pagination mb-0 ms-3">
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
      </div>

      {/* Modal Edit */}
      {showEditModal && <Modal title={`Chỉnh sửa User #${currentUser.id}`} onClose={() => setShowEditModal(false)}>
        <form onSubmit={handleEditSubmit}>
          {["username", "email", "role"].map(f => (
            <div key={f} style={formGroupStyle}>
              <label>{f.charAt(0).toUpperCase() + f.slice(1)}:</label>
              {f === "role" ? (
                <select value={editData.role} onChange={e => setEditData({ ...editData, role: e.target.value })} style={inputStyle} required>
                  <option value="">-- Chọn role --</option>
                  <option value="admin">Admin</option>
                  <option value="technician">Technician</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <input type={f === "email" ? "email" : "text"} value={editData[f]} onChange={e => setEditData({ ...editData, [f]: e.target.value })} style={inputStyle} required />
              )}
            </div>
          ))}
          <div style={{ textAlign: "right" }}>
            <button type="submit" style={btnPrimaryStyle}>💾 Cập nhật</button>
            <button type="button" style={btnCancelStyle} onClick={() => setShowEditModal(false)}>❌ Hủy</button>
          </div>
        </form>
      </Modal>}

      {/* Modal Delete */}
      {showDeleteModal && <Modal title={`Xóa User #${currentUser.id}`} onClose={() => setShowDeleteModal(false)}>
        <p>Bạn có chắc chắn muốn xóa user này không?</p>
        <div style={{ textAlign: "right" }}>
          <button style={btnDangerStyle} onClick={handleDeleteConfirm}>🗑 Xác nhận</button>
          <button style={btnCancelStyle} onClick={() => setShowDeleteModal(false)}>❌ Hủy</button>
        </div>
      </Modal>}
    </div>
  );
}

// Modal component
const Modal = ({ title, children }) => (
  <div style={overlayStyle}>
    <div style={modalCardStyle}>
      <h2 style={modalTitleStyle}>{title}</h2>
      {children}
    </div>
  </div>
);

// CSS rút gọn
const thStyle = { padding: 12, textAlign: "left" };
const tdStyle = { padding: 12 };
const formGroupStyle = { marginBottom: 15, display: "flex", flexDirection: "column" };
const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: 6, fontSize: 14 };
const btnPrimaryStyle = { background: "#2a9d8f", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6, cursor: "pointer", marginRight: 8, fontWeight: "bold" };
const btnCancelStyle = { background: "#ccc", color: "#000", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer" };
const btnDangerStyle = { background: "#e53935", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 6, cursor: "pointer", marginRight: 8 };
const overlayStyle = { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalCardStyle = { background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: 400, maxWidth: "90%" };
const modalTitleStyle = { marginBottom: 20, fontSize: 20, fontWeight: "bold", textAlign: "center" };
