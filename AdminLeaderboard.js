// src/pages/admin/AdminLeaderboard.js
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import Navbar from "../../components/shared/Navbar";
import "./Admin.css";

export default function AdminLeaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(query(collection(db, "users"), where("role", "==", "student"), orderBy("totalScore", "desc")));
      setUsers(snap.docs.map((d, i) => ({ id: d.id, rank: i + 1, ...d.data() })));
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  if (loading) return <><Navbar /><div className="loading-screen">Yuklanmoqda...</div></>;

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <h1 className="page-title">Yakuniy reyting jadvali</h1>
        <p className="page-sub">{users.length} ta o'quvchi</p>

        <div className="card table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>O'rin</th>
                <th>Ism</th>
                <th>Email</th>
                <th>Kunlik test bali</th>
                <th>Yakuniy test bali</th>
                <th>Umumiy ball</th>
                <th>Streak</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user.id}>
                  <td style={{ textAlign: "center", fontSize: i < 3 ? 20 : 14, fontWeight: 700 }}>
                    {i < 3 ? medals[i] : user.rank}
                  </td>
                  <td className="td-name">{user.name}</td>
                  <td className="td-email">{user.email}</td>
                  <td className="td-ball">{user.dailyTestScore || 0}</td>
                  <td className="td-ball">{user.finalTestScore || 0}</td>
                  <td className="td-ball" style={{ color: "var(--accent)", fontWeight: 700, fontSize: 15 }}>{user.totalScore || 0}</td>
                  <td className="td-ball">{user.streak || 0} 🔥</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--ink3)" }}>Ma'lumot yo'q</div>}
        </div>
      </div>
    </>
  );
}
