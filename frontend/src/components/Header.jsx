import React, { useState, useEffect } from "react";
import { Bell, Sun, User, Search, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function Header() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false); // cho search
  const [userMenuOpen, setUserMenuOpen] = useState(false); // cho user menu
  const navigate = useNavigate();

  // debounce search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (keyword.trim() === "") {
        setResults([]);
        return;
      }
      fetch(`${API_BASE}/api/search?q=${encodeURIComponent(keyword)}`)
        .then(async (res) => {
          const text = await res.text();
          try { return JSON.parse(text); } 
          catch { return []; }
        })
        .then((data) => setResults(data))
        .catch((err) => console.error(err));
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [keyword]);

  const handleSelect = (item) => {
    switch (item.type) {
      case "equipment": navigate(`/equipments/${item.id}`); break;
      case "maintenance": navigate(`/maintenance/${item.id}`); break;
      case "repair": navigate(`/repair/${item.id}`); break;
      case "supplier": navigate(`/suppliers/${item.id}`); break;
      default: break;
    }
    setShowDropdown(false);
    setKeyword("");
  };

  const handleLogout = () => {
    // Chuyển về login mà không xóa context
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-left">
        <span className="app-name">Device Management</span>
      </div>

      <div className="header-center">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />
          <Search size={16} className="search-icon" />
          {showDropdown && results.length > 0 && (
            <ul className="search-dropdown">
              {results.map((item) => (
                <li key={`${item.type}-${item.id}`} onClick={() => handleSelect(item)}>
                  <span className="item-type">{item.type}</span> — {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="header-right">
        <div className="header-icon">
          <Bell size={20} />
          <span className="badge">1</span>
        </div>
        <div className="header-icon">
          <Sun size={20} />
        </div>

        {/* User menu cố định */}
        <div className="header-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
          <User size={20} />
          <span>SA</span>

          {userMenuOpen && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
