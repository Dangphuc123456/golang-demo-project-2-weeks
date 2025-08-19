import React, { useEffect, useState } from "react";
import { getEquipmentStats, getEquipments } from "../../api/equipmentApi";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Đăng ký ChartJS
ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardPage = () => {
  const [stats, setStats] = useState({
    total: 0,
    in_use: 0,
    broken: 0,
    maintenance: 0,
  });
  const [equipments, setEquipments] = useState([]);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(
    Number(localStorage.getItem("rowsPerPage")) || 10
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await getEquipmentStats();
        const statsObj = {
          total: statsData.reduce((sum, s) => sum + s.count, 0),
          in_use: statsData.find((s) => s.status === "active")?.count || 0,
          broken: statsData.find((s) => s.status === "inactive")?.count || 0,
          maintenance:
            statsData.find((s) => s.status === "maintenance")?.count || 0,
        };
        setStats(statsObj);

        const listData = await getEquipments();
        setEquipments(listData);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setError("Không thể tải dữ liệu");
      }
    };
    fetchData();
  }, []);

  // Tính toán phân trang
  const totalPages = Math.ceil(equipments.length / rowsPerPage);
  const currentEquipments = equipments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Dữ liệu Pie Chart
  const pieData = {
    labels: ["Đang sử dụng", "Hỏng", "Chờ bảo trì"],
    datasets: [
      {
        label: "Số lượng thiết bị",
        data: [stats.in_use, stats.broken, stats.maintenance],
        backgroundColor: ["#28a745", "#dc3545","#ffc107"],
        hoverOffset: 10,
      },
    ],
  };

  return (
    <div className="container mt-3">
      <h4 className="mb-4 fw-bold">Dashboard</h4>

      {/* Cards thống kê */}
      <div className="row mb-4">
        {[
          { title: "Tổng thiết bị", value: stats.total, bg: "bg-primary" },
          { title: "Đang sử dụng", value: stats.in_use, bg: "bg-success" },
          { title: "Thiết bị hỏng", value: stats.broken, bg: "bg-danger" },
          { title: "Chờ bảo trì", value: stats.maintenance, bg: "bg-warning" },
        ].map((card, idx) => (
          <div className="col-md-3" key={idx}>
            <div className={`card text-white ${card.bg} shadow`}>
              <div className="card-body text-center">
                <h5 className="card-title">{card.title}</h5>
                <h2>{card.value}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Layout biểu đồ và bảng */}
      <div className="row">
        {/* Biểu đồ tròn bên trái */}
        <div className="col-md-3 mb-3">
          <h5 className="fw-semibold mb-3">Tỷ lệ trạng thái thiết bị</h5>
          <Pie data={pieData} />
        </div>

        {/* Bảng danh sách bên phải */}
        <div className="col-md-9 pe-0"> {/* giảm padding phải */}
          {error && <p className="text-danger">{error}</p>}
          <div style={{ maxHeight: "500px", overflowY: "auto" }}>
            <table className="table table-hover">
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Tên thiết bị</th>
                  <th style={tableHeaderStyle}>Giá</th>
                  <th style={tableHeaderStyle}>Trạng thái</th>
                  <th style={tableHeaderStyle}>Ngày nhập</th>
                </tr>
              </thead>
              <tbody>
                {currentEquipments.map((eq) => (
                  <tr
                    key={eq.id}
                    className={
                      eq.status === "Hỏng"
                        ? "table-danger"
                        : eq.status === "Chờ bảo trì"
                          ? "table-warning"
                          : ""
                    }
                  >
                    <td>{eq.name}</td>
                    <td>{Number(eq.price).toLocaleString("vi-VN")}₫</td>
                    <td>{eq.status}</td>
                    <td>
                      {eq.purchase_date
                        ? new Date(eq.purchase_date).toLocaleDateString("vi-VN")
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          <div className="d-flex align-items-center justify-content-end mt-3 gap-3">
            <div className="d-flex align-items-center gap-1">
              <span>Hiển thị</span>
              <select
                className="form-select mx-2"
                style={{ width: "70px" }}
                value={rowsPerPage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setRowsPerPage(value);
                  localStorage.setItem("rowsPerPage", value);
                  setCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>bản ghi / trang</span>
              <span className="ms-3">
                Tổng {totalPages} trang ({equipments.length} bản ghi)
              </span>
            </div>

            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(1)}>
                    «
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li
                    key={i + 1}
                    className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""
                    }`}
                >
                  <button
                    className="page-link"
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    »
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

const tableHeaderStyle = {
  backgroundColor: "#2c3e50",
  color: "#fff",
};
