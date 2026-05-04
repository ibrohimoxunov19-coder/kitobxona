// src/pages/admin/AdminUsers.js
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import Navbar from "../../components/shared/Navbar";
import "./Admin.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    const snap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
    setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  async function addUser(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: form.name,
        email: form.email,
        role: "student",
        totalScore: 0,
        dailyTestScore: 0,
        finalTestScore: 0,
        streak: 0,
        createdAt: serverTimestamp()
      });
      setForm({ name: "", email: "", password: "" });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      alert("Xato: " + err.message);
    }
    setSaving(false);
  }

  async function toggleBlock(userId, blocked) {
    await updateDoc(doc(db, "users", userId), { blocked: !blocked });
    fetchUsers();
  }

  async function allowRetry(userId) {
    await updateDoc(doc(db, "users", userId), { retryAllowed: true });
    alert("Qayta urinish ruxsati berildi");
  }

  if (loading) return <><Navbar /><div className="loading-screen">Yuklanmoqda...</div></>;

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="page-title">Foydalanuvchilar</h1>
            <p className="page-sub">{users.length} ta o'quvchi</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Qo'shish</button>
        </div>

        {showForm && (
          <div className="card form-card">
            <h3 style={{ marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Yangi foydalanuvchi</h3>
            <form onSubmit={addUser}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ism</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="To'liq ismi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="email@mail.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Parol</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Kamida 6 ta belgi" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
                <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>Bekor qilish</button>
              </div>
            </form>
          </div>
        )}

        <div className="card table-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ism</th>
                <th>Email</th>
                <th>Umumiy ball</th>
                <th>Kunlik test</th>
                <th>Yakuniy test</th>
                <th>Holat</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className={user.blocked ? "blocked-row" : ""}>
                  <td className="td-name">{user.name}</td>
                  <td className="td-email">{user.email}</td>
                  <td className="td-ball">{user.totalScore || 0}</td>
                  <td className="td-ball">{user.dailyTestScore || 0}</td>
                  <td className="td-ball">{user.finalTestScore || 0}</td>
                  <td><span className={"badge " + (user.blocked ? "badge-red" : "badge-green")}>{user.blocked ? "Bloklangan" : "Faol"}</span></td>
                  <td className="td-actions">
                    <button className="btn-sm" onClick={() => allowRetry(user.id)}>Qayta ruxsat</button>
                    <button className={"btn-sm " + (user.blocked ? "btn-sm-green" : "btn-sm-red")} onClick={() => toggleBlock(user.id, user.blocked)}>
                      {user.blocked ? "Blokni ochish" : "Bloklash"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--ink3)" }}>Foydalanuvchi yo'q</div>}
        </div>
      </div>
    </>
  );
}
