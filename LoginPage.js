// src/pages/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Email yoki parol noto'g'ri");
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-orb orb1" />
      <div className="login-orb orb2" />
      <div className="login-card card">
        <div className="login-logo">📚</div>
        <h1 className="login-title">{t("app_name")}</h1>
        <p className="login-sub">O'quv platformasi</p>
        <div className="lang-toggle">
          <button
            className={"lt-btn" + (i18n.language === "uz" ? " active" : "")}
            onClick={() => i18n.changeLanguage("uz")}
          >🇺🇿 O'zbek</button>
          <button
            className={"lt-btn" + (i18n.language === "ru" ? " active" : "")}
            onClick={() => i18n.changeLanguage("ru")}
          >🇷🇺 Русский</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t("email")}</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="example@mail.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t("password")}</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? t("loading") : t("login_btn")}
          </button>
        </form>
      </div>
    </div>
  );
}
