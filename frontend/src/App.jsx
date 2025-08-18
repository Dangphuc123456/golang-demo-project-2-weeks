import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LoginPages from "./pages/Login/LoginPages";
import RegisterPages from "./pages/Register/RegisterPages";
import CompletePage from "./pages/Register/CompletePage";
import FailPage from "./pages/Register/FailPage";
import UsersPage from "./pages/User/UserPage";
import SuppliersPage from "./pages/Suppliers/SuppliersPage";
import EquipmentsPage from "./pages/Equipments/EquipmentsPage";
import SupplierDetailPage from "./pages/Suppliers/SupplierDetailPage";
import EquipmentsDetailPage from "./pages/Equipments/EquipmentsDetailPage";
import MaintenancePage from "./pages/Maintenance/MaintenancePage";
import MaintenanceDetailPage from "./pages/Maintenance/MaintenanceDetailPage";
import RepairHistoryPage from "./pages/RepairHistory/RepairHistoryPage";
import HomeLayout from "./layouts/Layout";
import DashboardPage from "./pages/Home/DashboardPage";


function App() {
  return (
    <>
      <Routes>
        {/* Layout cho các trang sau login */}
        <Route path="/" element={<HomeLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="user" element={<UsersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="equipments" element={<EquipmentsPage />} />
          <Route path="/equipments/:id" element={<EquipmentsDetailPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
          <Route path="repairs" element={<RepairHistoryPage />} />
        </Route>

        {/* Các route độc lập */}
        <Route path="/login" element={<LoginPages />} />
        <Route path="/register" element={<RegisterPages />} />
        <Route path="/register/complete" element={<CompletePage />} />
        <Route path="/register/failpage" element={<FailPage />} />

        {/* Redirect mặc định nếu truy cập route khác */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
