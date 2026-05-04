// src/components/shared/Navbar.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = userData?.role === "admin";

  const studentTabs = [
    { path: "/dashboard", label: "📚 " + t("my_books") },
    { path: "/leaderboard", label: "🏆 " + t("leaderboard") },
    { path: "/contests", label: "🎯 " + t("contests") },
  ];

  const adminTabs = [
    { path: "/admin", label: "📊 " + t("admin_panel") },
    { path: "/admin/users", label: "👥 " + t("users") },
    { path: "/admin/books", label: "📚 " + t("books") },
    { path: "/admin/tests", label: "✏️ " + t("tests") },
    { path: "/admin/contests", label: "🎯 " + t("contests") },
    { path: "/admin/leaderboard", label: "🏆 " + t("leaderboard") },
  ];

  const tabs = isAdmin ? adminTabs : studentTabs;

  function toggleLang() {
    i18n.changeLanguage(i18n.language === "uz" ? "ru" : "uz");
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}>
          📚 {t("app_name")}
        </div>
        <div className="nav-right">
          {!isAdmin && (
            <div className="nav-score">
              <span className="score-val">{userData?.totalScore || 0}</span>
              <span className="score-label">{t("total_score")}</span>
            </div>
          )}
          <button className="nav-lang-btn" onClick={toggleLang}>
            {i18n.language === "uz" ? "🇷🇺 RU" : "🇺🇿 UZ"}
          </button>
          <div className="nav-avatar" onClick={handleLogout} title={t("logout")}>
            {userData?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
        </div>
      </nav>
      <div className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.path}
            className={"nav-tab" + (location.pathname === tab.path ? " active" : "")}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
