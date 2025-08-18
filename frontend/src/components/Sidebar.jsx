import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/Sidebar.css";
const menuItems = [
  { page: "/", id: 1, icon: "🏠", name: "Dashboard" },
  { page: "/user", id: 2, icon: "👤", name: "Users" },
  { page: "/suppliers", id: 3, icon: "🚚", name: "Suppliers" },
  { page: "/equipments", id: 4, icon: "💻", name: "Equipments" },
  { page: "/maintenance", id: 5, icon: "📅", name: "Maintenance" },
  { page: "/repairs", id: 6, icon: "🔧", name: "Repair History" },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const nav = useNavigate();
  const location = useLocation();

  return (
    <aside className={`sidebar ${expanded ? "expanded" : "collapsed"}`}>
      <nav className="menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${location.pathname === item.page ? "active" : ""}`}
            onClick={() => nav(item.page)}
          >
            <div className="icon">{item.icon}</div>
            {expanded && <div className="label">{item.name}</div>}
          </div>
        ))}
      </nav>
      <button className="toggle-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </aside>
  );
}
