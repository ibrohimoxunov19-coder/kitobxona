// src/pages/admin/AdminTests.js
import React, { useEffect, useState } from "react";
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, query, where, serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import Navbar from "../../components/shared/Navbar";
import "./Admin.css";

export default function AdminTests() {
  const [books, setBooks] = useState([]);
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");
  const [showTestForm, setShowTestForm] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [testForm, setTestForm] = useState({
    bookId: "", type: "daily", openType: "datetime",
    openDate: "", openTime: "", afterDays: 1,
    durationHours: 2, questionCount: 10,
    questionOrder: "random", status: "waiting",
    distribution: []
  });

  const [qForm, setQForm] = useState({
    bookId: "", chapterId: "",
    question: "", optionA: "", optionB: "", optionC: "", optionD: "",
    correctAnswer: 0, points: 5
  });

  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    fetchBooks();
    fetchTests();
  }, []);

  async function fetchBooks() {
    const snap = await getDocs(collection(db, "books"));
    setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function fetchTests() {
    const snap = await getDocs(collection(db, "tests"));
    setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function fetchQuestions(bookId) {
    const snap = await getDocs(query(collection(db, "questions"), where("bookId", "==", bookId)));
    setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function fetchChapters(bookId) {
    const snap = await getDocs(query(collection(db, "chapters"), where("bookId", "==", bookId)));
    setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.order - b.order));
  }

  async function saveTest(e) {
    e.preventDefault();
    setSaving(true);
    let openAt = null;
    if (testForm.openType === "datetime" && testForm.openDate && testForm.openTime) {
      openAt = new Date(`${testForm.openDate}T${testForm.openTime}`);
    }
    await addDoc(collection(db, "tests"), {
      ...testForm,
      openAt,
      status: "waiting",
      createdAt: serverTimestamp()
    });
    setShowTestForm(false);
    fetchTests();
    setSaving(false);
  }

  async function saveQuestion(e) {
    e.preventDefault();
    setSaving(true);
    await addDoc(collection(db, "questions"), {
      ...qForm,
      correctAnswer: parseInt(qForm.correctAnswer),
      points: parseInt(qForm.points),
      createdAt: serverTimestamp()
    });
    setQForm({ ...qForm, question: "", optionA: "", optionB: "", optionC: "", optionD: "" });
    fetchQuestions(qForm.bookId);
    setSaving(false);
  }

  async function openTest(testId) {
    await updateDoc(doc(db, "tests", testId), { status: "open", openedAt: serverTimestamp() });
    fetchTests();
  }

  async function closeTest(testId) {
    await updateDoc(doc(db, "tests", testId), { status: "closed", closedAt: serverTimestamp() });
    fetchTests();
  }

  async function deleteQuestion(qId) {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    await deleteDoc(doc(db, "questions", qId));
    fetchQuestions(qForm.bookId);
  }

  const statusBadge = (s) => {
    if (s === "open") return <span className="badge badge-green">Ochiq</span>;
    if (s === "closed") return <span className="badge badge-red">Yopiq</span>;
    return <span className="badge badge-orange">Kutilmoqda</span>;
  };

  return (
    <>
      <Navbar />
      <div className="admin-container">
        <h1 className="page-title">Testlar boshqaruvi</h1>

        {/* TABS */}
        <div className="admin-tabs">
          <button className={"atab" + (!showQForm ? " active" : "")} onClick={() => setShowQForm(false)}>📋 Testlar</button>
          <button className={"atab" + (showQForm ? " active" : "")} onClick={() => setShowQForm(true)}>❓ Savollar</button>
        </div>

        {/* TESTS TAB */}
        {!showQForm && (
          <>
            <div className="admin-header" style={{ marginTop: 16 }}>
              <p className="page-sub">{tests.length} ta test</p>
              <button className="btn-primary" onClick={() => setShowTestForm(true)}>+ Test yaratish</button>
            </div>

            {showTestForm && (
              <div className="card form-card">
                <h3 style={{ marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Yangi test</h3>
                <form onSubmit={saveTest}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Kitob</label>
                      <select className="form-input" value={testForm.bookId} onChange={e => setTestForm({ ...testForm, bookId: e.target.value })} required>
                        <option value="">Tanlang</option>
                        {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Test turi</label>
                      <select className="form-input" value={testForm.type} onChange={e => setTestForm({ ...testForm, type: e.target.value })}>
                        <option value="daily">Kunlik (10 ta savol)</option>
                        <option value="final">Yakuniy</option>
                      </select>
                    </div>
                    {testForm.type === "final" && (
                      <div className="form-group">
                        <label className="form-label">Savollar soni</label>
                        <input className="form-input" type="number" min="5" max="100" value={testForm.questionCount} onChange={e => setTestForm({ ...testForm, questionCount: parseInt(e.target.value) })} />
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ochilish usuli</label>
                      <select className="form-input" value={testForm.openType} onChange={e => setTestForm({ ...testForm, openType: e.target.value })}>
                        <option value="datetime">Aniq sana va vaqt</option>
                        <option value="after">O'qishdan keyin</option>
                        <option value="manual">Qo'lda ochish</option>
                      </select>
                    </div>
                    {testForm.openType === "datetime" && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Sana</label>
                          <input className="form-input" type="date" value={testForm.openDate} onChange={e => setTestForm({ ...testForm, openDate: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Vaqt</label>
                          <input className="form-input" type="time" value={testForm.openTime} onChange={e => setTestForm({ ...testForm, openTime: e.target.value })} />
                        </div>
                      </>
                    )}
                    {testForm.openType === "after" && (
                      <div className="form-group">
                        <label className="form-label">O'qishdan necha kun keyin</label>
                        <input className="form-input" type="number" min="0" max="30" value={testForm.afterDays} onChange={e => setTestForm({ ...testForm, afterDays: parseInt(e.target.value) })} />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Davomiyligi (soat)</label>
                      <input className="form-input" type="number" min="0.5" max="24" step="0.5" value={testForm.durationHours} onChange={e => setTestForm({ ...testForm, durationHours: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Savollar tartibi</label>
                      <select className="form-input" value={testForm.questionOrder} onChange={e => setTestForm({ ...testForm, questionOrder: e.target.value })}>
                        <option value="random">Tasodifiy (random)</option>
                        <option value="sequential">Ketma-ket</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
                    <button className="btn-secondary" type="button" onClick={() => setShowTestForm(false)}>Bekor</button>
                  </div>
                </form>
              </div>
            )}

            <div className="card table-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Kitob</th>
                    <th>Turi</th>
                    <th>Ochilish</th>
                    <th>Davomiylik</th>
                    <th>Holat</th>
                    <th>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map(test => (
                    <tr key={test.id}>
                      <td>{books.find(b => b.id === test.bookId)?.name || test.bookId}</td>
                      <td>{test.type === "daily" ? "Kunlik" : "Yakuniy"}</td>
                      <td>{test.openType === "manual" ? "Qo'lda" : test.openType === "after" ? `${test.afterDays} kun keyin` : `${test.openDate} ${test.openTime}`}</td>
                      <td>{test.durationHours} soat</td>
                      <td>{statusBadge(test.status)}</td>
                      <td className="td-actions">
                        {test.status !== "open" && <button className="btn-sm btn-sm-green" onClick={() => openTest(test.id)}>Ochish</button>}
                        {test.status === "open" && <button className="btn-sm btn-sm-red" onClick={() => closeTest(test.id)}>Yopish</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tests.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--ink3)" }}>Test yo'q</div>}
            </div>
          </>
        )}

        {/* QUESTIONS TAB */}
        {showQForm && (
          <>
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Kitob tanlang</label>
                  <select className="form-input" value={selectedBook} onChange={e => {
                    setSelectedBook(e.target.value);
                    setQForm({ ...qForm, bookId: e.target.value, chapterId: "" });
                    fetchQuestions(e.target.value);
                    fetchChapters(e.target.value);
                  }}>
                    <option value="">Tanlang</option>
                    {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {selectedBook && (
              <div className="card form-card">
                <h3 style={{ marginBottom: 16, fontFamily: "'Playfair Display', serif" }}>Savol qo'shish</h3>
                <form onSubmit={saveQuestion}>
                  <div className="form-group">
                    <label className="form-label">Bob (qism)</label>
                    <select className="form-input" value={qForm.chapterId} onChange={e => setQForm({ ...qForm, chapterId: e.target.value })} required>
                      <option value="">Bob tanlang</option>
                      {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name} ({ch.pageFrom}-{ch.pageTo} sahifa)</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Savol matni</label>
                    <textarea className="form-input" rows="3" value={qForm.question} onChange={e => setQForm({ ...qForm, question: e.target.value })} required placeholder="Savolni kiriting..." />
                  </div>
                  <div className="form-row">
                    {["A", "B", "C", "D"].map((l, i) => (
                      <div className="form-group" key={l}>
                        <label className="form-label">{l} variant</label>
                        <input className="form-input" value={qForm[`option${l}`]} onChange={e => setQForm({ ...qForm, [`option${l}`]: e.target.value })} required placeholder={`${l} variant`} />
                      </div>
                    ))}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">To'g'ri javob</label>
                      <select className="form-input" value={qForm.correctAnswer} onChange={e => setQForm({ ...qForm, correctAnswer: parseInt(e.target.value) })}>
                        <option value={0}>A</option>
                        <option value={1}>B</option>
                        <option value={2}>C</option>
                        <option value={3}>D</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ball</label>
                      <input className="form-input" type="number" min="1" max="100" value={qForm.points} onChange={e => setQForm({ ...qForm, points: parseInt(e.target.value) })} required />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit" disabled={saving}>{saving ? "Saqlanmoqda..." : "Savol qo'shish"}</button>
                </form>
              </div>
            )}

            {selectedBook && questions.length > 0 && (
              <div className="card table-card">
                <table className="admin-table">
                  <thead>
                    <tr><th>Savol</th><th>Bob</th><th>Ball</th><th>To'g'ri</th><th></th></tr>
                  </thead>
                  <tbody>
                    {questions.map(q => (
                      <tr key={q.id}>
                        <td style={{ maxWidth: 300 }}>{q.question}</td>
                        <td>{chapters.find(c => c.id === q.chapterId)?.name || q.chapterId}</td>
                        <td>{q.points}</td>
                        <td>{["A", "B", "C", "D"][q.correctAnswer]}</td>
                        <td><button className="btn-danger" onClick={() => deleteQuestion(q.id)}>O'chirish</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
