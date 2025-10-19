import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome, FiRepeat, FiBarChart2 } from "react-icons/fi"; // use react-icons for icons
import "./Sidebar.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: "Enrollment", path: "/", icon: <FiHome /> },
    { name: "Renewal", path: "/renewals", icon: <FiRepeat /> },
    { name: "LTV", path: "/ltv", icon: <FiBarChart2 /> },
  ];

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        {isOpen && <span className="header-title">Dashboard</span>}
        <button className="toggle-btn" onClick={toggleSidebar}>
          ☰
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => (
          <Link key={idx} to={item.path} className="sidebar-link">
            <span className="icon">{item.icon}</span>
            {isOpen && <span className="link-text">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
