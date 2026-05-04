// src/pages/student/Leaderboard.js
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/shared/Navbar";
import "./Leaderboard.css";

export default function Leaderboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("overall");

  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(query(collection(db, "users"), orderBy("totalScore", "desc")));
      setUsers(snap.docs
        .filter(d => d.data().role === "student")
        .map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() }))
      );
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  if (loading) return <><Navbar /><div className="loading-screen">{t("loading")}</div></>;

  return (
    <>
      <Navbar />
      <div className="lb-container">
        <h1 className="page-title">{t("leaderboard")}</h1>
        <p className="page-sub">Barcha o'quvchilar natijalari</p>

        <div className="filter-tabs">
          {["overall", "daily", "final"].map(f => (
            <button key={f} className={"ft" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>
              {f === "overall" ? "Umumiy" : f === "daily" ? "Kunlik test" : "Yakuniy test"}
            </button>
          ))}
        </div>

        <div className="card lb-table">
          <div className="lb-head">
            <div>{t("rank")}</div>
            <div>{t("student")}</div>
            <div>{t("daily_score")}</div>
            <div>{t("final_score")}</div>
            <div>{t("total")}</div>
          </div>
          {users.map((user, i) => (
            <div key={user.id} className={"lb-row" + (user.id === currentUser.uid ? " me" : "")}>
              <div className={"rank" + (i < 3 ? " top" + (i + 1) : "")}>
                {i < 3 ? medals[i] : user.rank}
              </div>
              <div className="lb-name">
                {user.name}
                {user.id === currentUser.uid && <span className="you-tag">(Siz)</span>}
                <span className="lb-sub">{user.streak || 0} kun streak 🔥</span>
              </div>
              <div className="lb-ball">{user.dailyTestScore || 0}</div>
              <div className="lb-ball">{user.finalTestScore || 0}</div>
              <div className="lb-ball total">{user.totalScore || 0}</div>
            </div>
          ))}
          {users.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--ink3)" }}>{t("no_data")}</div>}
        </div>
      </div>
    </>
  );
}
