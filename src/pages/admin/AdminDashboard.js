// src/pages/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import Navbar from "../../components/shared/Navbar";
import "./Admin.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, books: 0, tests: 0, contests: 0 });

  useEffect(() => {
    async function fetchStats() {
      const [u, b, t, c] = await Promise.all([
        getDocs(query(collection(db, "users"), where("role", "==", "student"))),
        getDocs(collection(db, "books")),
        getDocs(collection(db, "tests")),
        getDocs(collection(db, "contests")),
      ]);
      setStats({ users: u.size, books: b.size, tests: t.size, contests: c.size });
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Foydalanuvchilar", value: stats.users, icon: "👥", path: "/admin/users", color: "#2D6A4F" },
    { label: "Kitoblar", value: stats.books, icon: "📚", path: "/admin/books", color: "#C2590A" },
    { label: "Testlar", value: stats.tests, icon: "✏️", path: "/admin/tests", color: "#1D3557" },
    { label: "Tanlovlar", value: stats.contests, icon: "🎯", path: "/admin/contests", color: "#6B21A8" },
  ];

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <h1 className="page-title">Admin panel</h1>
        <p className="page-sub">Boshqaruv markazi</p>
        <div className="stats-grid">
          {cards.map(card => (
            <div key={card.path} className="stat-card card" onClick={() => navigate(card.path)}>
              <div className="stat-icon" style={{ background: card.color }}>{card.icon}</div>
              <div className="stat-info">
                <div className="stat-number">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
              <div className="stat-arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
