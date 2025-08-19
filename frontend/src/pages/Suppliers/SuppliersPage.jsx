import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Tooltip as ReactTooltip } from "react-tooltip";
import {
    fetchAllSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} from "../../api/suppliersApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // fetch once on mount
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                setLoading(true);
                const data = await fetchAllSuppliers();
                // defensive: ensure array
                setSuppliers(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err?.message || String(err));
                setSuppliers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSuppliers();
    }, []);

    useEffect(() => {
        const totalPages = Math.max(1, Math.ceil((suppliers?.length || 0) / itemsPerPage));
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [suppliers, itemsPerPage]);

    function openAddModal() {
        setIsEditing(false);
        setCurrentSupplier(null);
        setFormData({ name: "", phone: "", email: "", address: "" });
        setError(null);
        setShowModal(true);
    }

    function openEditModal(supplier) {
        setIsEditing(true);
        setCurrentSupplier(supplier);
        setFormData({
            name: supplier?.name || "",
            phone: supplier?.phone || "",
            email: supplier?.email || "",
            address: supplier?.address || "",
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
            if (isEditing) {
                await updateSupplier(currentSupplier.id, formData);
                toast.success("Cập nhật nhà cung cấp thành công!");
            } else {
                await createSupplier(formData);
                toast.success("Thêm nhà cung cấp thành công!");
            }
            setShowModal(false);
            await loadSuppliers();
        } catch (err) {
            setError(err?.message || String(err));
            toast.error(err?.message || "Lỗi xử lý");
        }
    }

    async function loadSuppliers() {
        try {
            const data = await fetchAllSuppliers();
            setSuppliers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || String(err));
            setSuppliers([]);
        }
    }

    function openDeleteModal(supplier) {
        setCurrentSupplier(supplier);
        setShowDeleteModal(true);
    }

    async function handleDeleteConfirm() {
        try {
            await deleteSupplier(currentSupplier.id);
            toast.success("Xóa nhà cung cấp thành công!");
            setShowDeleteModal(false);
            await loadSuppliers();
        } catch (err) {
            toast.error(err?.message || "Lỗi xóa");
        }
    }

    const totalPages = Math.max(1, Math.ceil((suppliers?.length || 0) / itemsPerPage));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSuppliers = Array.isArray(suppliers) ? suppliers.slice(indexOfFirstItem, indexOfLastItem) : [];

    return (
        <div style={{ padding: 14, fontFamily: "Arial, sans-serif" }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="m-0">Danh sách Nhà cung cấp</h4>

                <div className="d-flex gap-2" style={{ position: "relative" }}>
                    <button onClick={openAddModal} className="btn btn-primary fw-bold">
                        ➕ ADD
                    </button>
                </div>
            </div>

            {error && <p className="text-danger">Lỗi: {error}</p>}

            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (Array.isArray(suppliers) && suppliers.length === 0) ? (
                <>
                    <p>Không có kết quả nào.</p>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ backgroundColor: "#2c3e50", color: "white" }}>
                            <tr>
                                <th style={{ padding: 12, textAlign: "left" }}>ID</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Tên</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Số điện thoại</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Email</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Địa chỉ</th>
                                <th style={{ padding: 12, textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* hiển thị 1 hàng rỗng để giữ khung giao diện */}
                            <tr style={{ borderBottom: "1px solid #ddd" }}>
                                <td style={{ padding: 12 }}>-</td>
                                <td style={{ padding: 12 }}>-</td>
                                <td style={{ padding: 12 }}>-</td>
                                <td style={{ padding: 12 }}>-</td>
                                <td style={{ padding: 12 }}>-</td>
                                <td style={{ padding: 12, textAlign: "center" }}>
                                    <button className="btn btn-sm btn-warning me-1" disabled>✏️Sửa</button>
                                    <button className="btn btn-sm btn-danger" disabled>🗑️Xóa</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </>
            ) : (
                <>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ backgroundColor: "#2c3e50", color: "white" }}>
                            <tr>
                                <th style={{ padding: 12, textAlign: "left" }}>ID</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Tên</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Số điện thoại</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Email</th>
                                <th style={{ padding: 12, textAlign: "left" }}>Địa chỉ</th>
                                <th style={{ padding: 12, textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentSuppliers.map((sup) => (
                                <tr key={sup.id} style={{ borderBottom: "1px solid #ddd" }}>
                                    <td style={{ padding: 12 }}>{sup.id}</td>
                                    <td style={{ padding: 12 }}>
                                        <Link
                                            to={`/suppliers/${sup.id}`}
                                            style={{ color: "#0d6efd", textDecoration: "none", cursor: "pointer" }}
                                        >
                                            {sup.name}
                                        </Link>
                                    </td>
                                    <td style={{ padding: 12 }}>{sup.phone || "-"}</td>
                                    <td style={{ padding: 12 }}>{sup.email || "-"}</td>
                                    <td
                                        style={{
                                            padding: 12,
                                            maxWidth: "150px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            cursor: "pointer",
                                        }}
                                        data-tooltip-id={`tooltip-${sup.id}`}
                                        data-tooltip-content={sup.address || "-"}>
                                        {sup.address || "-"}
                                    </td>
                                    <td style={{ padding: 12, textAlign: "center" }}>
                                        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                                            <button
                                                className="btn btn-sm btn-warning"
                                                title="Sửa"
                                                onClick={() => openEditModal(sup)}
                                            >
                                                ✏️ Sửa
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => openDeleteModal(sup)}
                                            >
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {currentSuppliers.map((sup) => (
                        <ReactTooltip key={sup.id} id={`tooltip-${sup.id}`} place="top" type="dark" effect="solid" />
                    ))}
                    {/* Pagination controls */}
                    <div className="d-flex align-items-center justify-content-end mt-3 gap-3">
                        <div className="d-flex align-items-center gap-1">
                            <span>Hiển thị</span>
                            <select
                                className="form-select mx-2"
                                style={{ width: "70px" }}
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setCurrentPage(1);
                                    setItemsPerPage(Number(e.target.value));
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                            <span>bản ghi / trang</span>
                            <span className="ms-3">
                                Tổng {totalPages} trang ({suppliers.length} bản ghi)
                            </span>
                        </div>

                        <nav>
                            <ul className="pagination mb-0">
                                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(1)}>«</button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                            {i + 1}
                                        </button>
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

            {/* Modal thêm/sửa */}
            {showModal && (
                <div style={overlayStyle} onClick={() => setShowModal(false)}>
                    <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
                        <h2 style={modalTitleStyle}>
                            {isEditing ? `Sửa nhà cung cấp #${currentSupplier?.id ?? ""}` : "Thêm nhà cung cấp"}
                        </h2>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        <form onSubmit={handleSubmit}>
                            <div style={formGroupStyle}>
                                <label>Tên nhà cung cấp:</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} required />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Số điện thoại:</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Email:</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
                            </div>
                            <div style={formGroupStyle}>
                                <label>Địa chỉ:</label>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} style={inputStyle} />
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <button type="submit" style={btnPrimaryStyle}>
                                    {isEditing ? "💾 Cập nhật" : "➕ Thêm mới"}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={btnCancelStyle}>
                                    ❌ Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal xóa */}
            {showDeleteModal && (
                <div style={overlayStyle} onClick={() => setShowDeleteModal(false)}>
                    <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
                        <h2 style={modalTitleStyle}>
                            Xóa nhà cung cấp #{currentSupplier?.id ?? ""}
                        </h2>
                        <p>Bạn có chắc chắn muốn xóa nhà cung cấp <strong>{currentSupplier?.name ?? ""}</strong> không?</p>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                        <div style={{ textAlign: "right" }}>
                            <button onClick={handleDeleteConfirm} style={btnDangerStyle}>
                                🗑️ Xác nhận
                            </button>
                            <button onClick={() => setShowDeleteModal(false)} style={btnCancelStyle}>
                                ❌ Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Styles (giữ nguyên)
const overlayStyle = {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
    justifyContent: "center", zIndex: 1000,
};

const modalCardStyle = {
    background: "#fff", padding: "20px 25px", borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)", width: "400px", maxWidth: "90%",
};
const noBorderStyle = {
    borderCollapse: "collapse",
    width: "100%",
};

const cellStyle = {
    border: "none",
};
const modalTitleStyle = { marginBottom: "20px", fontSize: "20px", fontWeight: "bold", textAlign: "center" };
const formGroupStyle = { marginBottom: "15px", display: "flex", flexDirection: "column" };
const inputStyle = { padding: "8px 10px", border: "1px solid #ccc", borderRadius: "6px", fontSize: "14px" };
const btnPrimaryStyle = { background: "#2a9d8f", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "8px", fontWeight: "bold" };
const btnCancelStyle = { background: "#ccc", color: "#000", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer" };
const btnDangerStyle = { background: "#e53935", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", marginRight: "8px" };
