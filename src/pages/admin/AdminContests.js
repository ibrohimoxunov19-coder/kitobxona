// src/pages/admin/AdminContests.js
import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import Navbar from "../../components/shared/Navbar";
import "./Admin.css";

export default function AdminContests() {
  const [contests, setContests] = useState([]);
  const [prizes, setPrizes] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [activeContest, setActiveContest] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", startDate: "", endDate: "",
    channelUsername: "", channelId: "", active: true
  });

  const [prizeForm, setPrizeForm] = useState({ rank: 1, description: "" });

  useEffect(() => { fetchContests(); }, []);

  async function fetchContests() {
    const snap = await getDocs(collection(db, "contests"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setContests(data);
    for (const c of data) {
      const pSnap = await getDocs(query(collection(db, "prizes"), where("contestId", "==", c.id)));
      setPrizes(prev => ({ ...prev, [c.id]: pSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.rank - b.rank) }));
    }
  }

  async function saveContest(e) {
    e.preventDefault();
    setSaving(true);
    await addDoc(collection(db, "contests"), { ...form, createdAt: serverTimestamp() });
    setForm({ name: "", description: "", startDate: "", endDate: "", channelUsername: "", channelId: "", active: true });
    setShowForm(false);
    fetchContests();
    setSaving(false);
  }

  async function addPrize(e) {
    e.preventDefault();
    setSaving(true);
    await addDoc(collection(db, "prizes"), { contestId: activeContest.id, ...prizeForm, rank: parseInt(prizeForm.rank) });
    setPrizeForm({ rank: (prizes[activeContest.id]?.length || 0) + 2, description: "" });
    fetchContests();
    setSaving(false);
  }

  async function deletePrize(prizeId) {
    await deleteDoc(doc(db, "prizes", prizeId));
    fetchContests();
  }

  async function toggleContest(contestId, active) {
    await updateDoc(doc(db, "contests", contestId), { active: !active });
    fetchContests();
  }

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="page-title">Tanlovlar</h1>
            <p className="page-sub">{contests.length} ta tanlov</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Tanlov yaratish</button>
        </div>

        {showForm && (
          <div className="card form-card">
            <h3 style={{ marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Yangi tanlov</h3>
            <form onSubmit={saveContest}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanlov nomi</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Boshlanish sanasi</label>
                  <input className="form-input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tugash sanasi</label>
                  <input className="form-input" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tavsif</label>
                <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Telegram kanal username (@siz)</label>
                  <input className="form-input" value={form.channelUsername} onChange={e => setForm({ ...form, channelUsername: e.target.value })} placeholder="kitobxona_uz" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Telegram kanal ID (bot uchun)</label>
                  <input className="form-input" value={form.channelId} onChange={e => setForm({ ...form, channelId: e.target.value })} placeholder="-100123456789" required />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
                <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>Bekor</button>
              </div>
            </form>
          </div>
        )}

        <div className="contests-admin-list">
          {contests.map(contest => (
            <div key={contest.id} className="card contest-admin-card">
              <div className="contest-admin-header">
                <div>
                  <div className="contest-admin-title">{contest.name}</div>
                  <div className="contest-admin-meta">{contest.startDate} — {contest.endDate} • @{contest.channelUsername}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={"badge " + (contest.active ? "badge-green" : "badge-red")}>{contest.active ? "Faol" : "Faol emas"}</span>
                  <button className="btn-sm" onClick={() => { setActiveContest(contest); setPrizeForm({ rank: (prizes[contest.id]?.length || 0) + 1, description: "" }); }}>Sovrinlar</button>
                  <button className="btn-sm btn-sm-red" onClick={() => toggleContest(contest.id, contest.active)}>{contest.active ? "O'chirish" : "Yoqish"}</button>
                </div>
              </div>

              {/* Prizes */}
              {prizes[contest.id]?.length > 0 && (
                <div className="prizes-admin">
                  {prizes[contest.id].map(p => (
                    <div key={p.id} className="prize-admin-item">
                      <span>{p.rank}-o'rin: {p.description}</span>
                      <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => deletePrize(p.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add prize */}
              {activeContest?.id === contest.id && (
                <form onSubmit={addPrize} className="prize-form">
                  <input className="form-input" type="number" min="1" value={prizeForm.rank} onChange={e => setPrizeForm({ ...prizeForm, rank: e.target.value })} style={{ width: 80 }} placeholder="O'rin" />
                  <input className="form-input" value={prizeForm.description} onChange={e => setPrizeForm({ ...prizeForm, description: e.target.value })} required placeholder="Sovrin tavsifi (masalan: 100,000 so'm)" style={{ flex: 1 }} />
                  <button className="btn-primary" type="submit" disabled={saving}>{saving ? "..." : "+ Qo'shish"}</button>
                  <button className="btn-secondary" type="button" onClick={() => setActiveContest(null)}>Yopish</button>
                </form>
              )}
            </div>
          ))}
          {contests.length === 0 && <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--ink3)" }}>Tanlov yo'q</div>}
        </div>
      </div>
    </>
  );
}
