// src/pages/admin/AdminBooks.js
import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import Navbar from "../../components/shared/Navbar";
import "./Admin.css";

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeBook, setActiveBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [showChapters, setShowChapters] = useState(false);
  const [form, setForm] = useState({ name: "", author: "", description: "", minReadMinutes: 15, active: true });
  const [chForm, setChForm] = useState({ name: "", order: 1, pageFrom: 1, pageTo: 10, contentType: "text", content: "" });
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchBooks(); }, []);

  async function fetchBooks() {
    const snap = await getDocs(collection(db, "books"));
    setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function fetchChapters(bookId) {
    const snap = await getDocs(query(collection(db, "chapters"), where("bookId", "==", bookId)));
    setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.order - b.order));
  }

  async function saveBook(e) {
    e.preventDefault();
    setSaving(true);
    await addDoc(collection(db, "books"), { ...form, createdAt: serverTimestamp() });
    setForm({ name: "", author: "", description: "", minReadMinutes: 15, active: true });
    setShowForm(false);
    fetchBooks();
    setSaving(false);
  }

  async function saveChapter(e) {
    e.preventDefault();
    setSaving(true);
    let pdfUrl = "";
    if (pdfFile) {
      const storageRef = ref(storage, `books/${activeBook.id}/${pdfFile.name}`);
      await uploadBytes(storageRef, pdfFile);
      pdfUrl = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, "chapters"), {
      bookId: activeBook.id,
      ...chForm,
      pdfUrl,
      createdAt: serverTimestamp()
    });
    setChForm({ name: "", order: chapters.length + 2, pageFrom: 1, pageTo: 10, contentType: "text", content: "" });
    setPdfFile(null);
    fetchChapters(activeBook.id);
    setSaving(false);
  }

  async function toggleActive(bookId, active) {
    await updateDoc(doc(db, "books", bookId), { active: !active });
    fetchBooks();
  }

  async function deleteChapter(chId) {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    await deleteDoc(doc(db, "chapters", chId));
    fetchChapters(activeBook.id);
  }

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="page-title">Kitoblar</h1>
            <p className="page-sub">{books.length} ta kitob</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Kitob qo'shish</button>
        </div>

        {showForm && (
          <div className="card form-card">
            <h3 style={{ marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Yangi kitob</h3>
            <form onSubmit={saveBook}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kitob nomi</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Muallif</label>
                  <input className="form-input" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimal o'qish vaqti (daqiqa)</label>
                  <input className="form-input" type="number" min="1" max="120" value={form.minReadMinutes} onChange={e => setForm({ ...form, minReadMinutes: parseInt(e.target.value) })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tavsif</label>
                <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
                <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>Bekor</button>
              </div>
            </form>
          </div>
        )}

        {/* Books list */}
        <div className="books-list">
          {books.map(book => (
            <div key={book.id} className="card book-admin-card">
              <div className="book-admin-info">
                <div className="book-admin-name">{book.name}</div>
                <div className="book-admin-meta">{book.author} • {book.minReadMinutes} daqiqa minimal o'qish</div>
              </div>
              <div className="book-admin-actions">
                <span className={"badge " + (book.active ? "badge-green" : "badge-red")}>{book.active ? "Faol" : "Faol emas"}</span>
                <button className="btn-sm" onClick={() => { setActiveBook(book); fetchChapters(book.id); setShowChapters(true); }}>Boblar</button>
                <button className="btn-sm btn-sm-red" onClick={() => toggleActive(book.id, book.active)}>{book.active ? "O'chirish" : "Yoqish"}</button>
              </div>
            </div>
          ))}
        </div>

        {/* Chapters modal */}
        {showChapters && activeBook && (
          <div className="modal-overlay" onClick={() => setShowChapters(false)}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{activeBook.name} — Boblar</h3>
                <button className="modal-close" onClick={() => setShowChapters(false)}>✕</button>
              </div>

              {/* Chapter form */}
              <form onSubmit={saveChapter} className="chapter-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bob nomi</label>
                    <input className="form-input" value={chForm.name} onChange={e => setChForm({ ...chForm, name: e.target.value })} required placeholder="I bob: Kirish" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tartib raqam</label>
                    <input className="form-input" type="number" min="1" value={chForm.order} onChange={e => setChForm({ ...chForm, order: parseInt(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sahifadan</label>
                    <input className="form-input" type="number" min="1" value={chForm.pageFrom} onChange={e => setChForm({ ...chForm, pageFrom: parseInt(e.target.value) })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sahifagacha</label>
                    <input className="form-input" type="number" min="1" value={chForm.pageTo} onChange={e => setChForm({ ...chForm, pageTo: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Kontent turi</label>
                  <select className="form-input" value={chForm.contentType} onChange={e => setChForm({ ...chForm, contentType: e.target.value })}>
                    <option value="text">Matn</option>
                    <option value="pdf">PDF fayl</option>
                  </select>
                </div>
                {chForm.contentType === "text" ? (
                  <div className="form-group">
                    <label className="form-label">Matn (HTML)</label>
                    <textarea className="form-input" rows="6" value={chForm.content} onChange={e => setChForm({ ...chForm, content: e.target.value })} placeholder="<h3>Bob nomi</h3><p>Matn...</p>" />
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">PDF fayl yuklash</label>
                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0])} />
                  </div>
                )}
                <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "+ Bob qo'shish"}</button>
              </form>

              {/* Chapters list */}
              <div className="chapters-list">
                {chapters.map(ch => (
                  <div key={ch.id} className="chapter-item">
                    <div>
                      <div className="ch-name">{ch.name}</div>
                      <div className="ch-meta">{ch.pageFrom}-{ch.pageTo} sahifalar • {ch.contentType === "pdf" ? "PDF" : "Matn"}</div>
                    </div>
                    <button className="btn-danger" onClick={() => deleteChapter(ch.id)}>O'chirish</button>
                  </div>
                ))}
                {chapters.length === 0 && <p style={{ color: "var(--ink3)", textAlign: "center", padding: 20 }}>Bob yo'q</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
