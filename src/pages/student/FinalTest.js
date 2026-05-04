// src/pages/student/FinalTest.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/shared/Navbar";
import "./DailyTest.css";

export default function FinalTest() {
  const { testId } = useParams();
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [testSession, setTestSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    async function fetchTest() {
      const testDoc = await getDoc(doc(db, "tests", testId));
      if (!testDoc.exists() || testDoc.data().status !== "open") {
        setLoading(false);
        return;
      }
      const testData = { id: testDoc.id, ...testDoc.data() };
      setTestSession(testData);

      // Check retry permission
      const existingSnap = await getDocs(
        query(collection(db, "results"),
          where("userId", "==", currentUser.uid),
          where("testId", "==", testId))
      );
      if (!existingSnap.empty && !existingSnap.docs[0].data().retryAllowed) {
        setResult(existingSnap.docs[0].data());
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Fetch questions based on distribution set by admin
      const allQs = [];
      const distribution = testData.distribution || [];
      for (const dist of distribution) {
        const snap = await getDocs(
          query(collection(db, "questions"),
            where("bookId", "==", dist.bookId))
        );
        const qs = shuffle(snap.docs.map(d => ({ id: d.id, ...d.data() }))).slice(0, dist.count);
        allQs.push(...qs);
      }

      const finalQs = testData.questionOrder === "random" ? shuffle(allQs) : allQs;
      setQuestions(finalQs);

      const durationSecs = (testData.durationHours || 2) * 3600;
      setTimeLeft(durationSecs);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmitFn(finalQs, answers); return 0; }
          return prev - 1;
        });
      }, 1000);
      setLoading(false);
    }
    fetchTest();
    return () => clearInterval(timerRef.current);
  }, []);

  function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

  async function handleSubmitFn(qs = questions, ans = answers) {
    clearInterval(timerRef.current);
    let totalScore = 0, correctCount = 0;
    qs.forEach(q => {
      if (ans[q.id] === q.correctAnswer) { totalScore += q.points || 10; correctCount++; }
    });
    await addDoc(collection(db, "results"), {
      userId: currentUser.uid,
      testId,
      type: "final",
      score: totalScore,
      correctCount,
      totalQuestions: qs.length,
      answers: ans,
      submittedAt: serverTimestamp()
    });
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      totalScore: (userData?.totalScore || 0) + totalScore,
      finalTestScore: totalScore
    });
    setResult({ score: totalScore, correctCount, totalQuestions: qs.length });
    setSubmitted(true);
  }

  function formatTime(secs) {
    if (!secs) return "00:00";
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  if (loading) return <><Navbar /><div className="loading-screen">{t("loading")}</div></>;
  if (!testSession) return (
    <><Navbar /><div className="test-page">
      <div className="card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <p style={{ color: "var(--ink3)" }}>Yakuniy test hali ochilmagan.</p>
        <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Orqaga</button>
      </div>
    </div></>
  );
  if (submitted && result) return (
    <><Navbar /><div className="test-page">
      <div className="card result-card">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
        <div className="result-score">{result.score}</div>
        <div className="result-label">{t("final_test")} natijasi</div>
        <div className="result-stats">
          <div className="stat"><div className="stat-val">{result.correctCount}</div><div className="stat-label">{t("correct")}</div></div>
          <div className="stat"><div className="stat-val">{result.totalQuestions - result.correctCount}</div><div className="stat-label">{t("wrong")}</div></div>
        </div>
        <div className="result-msg">Yakuniy ball reytingga qo'shildi!</div>
        <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/leaderboard")}>{t("leaderboard")} →</button>
      </div>
    </div></>
  );

  const q = questions[current];
  const letters = ["A", "B", "C", "D"];
  return (
    <><Navbar />
      <div className="test-page">
        <div className="test-header">
          <div>
            <div className="test-title">{t("final_test")}</div>
            <div className="test-meta">{questions.length} {t("question")}</div>
          </div>
          <div className="test-timer">
            <div className="test-timer-val">{formatTime(timeLeft)}</div>
            <div className="test-timer-label">qoldi</div>
          </div>
        </div>
        <div className="q-dots">
          {questions.map((_, i) => (
            <div key={i} className={"q-dot" + (i === current ? " current" : "") + (answers[questions[i]?.id] !== undefined ? " answered" : "")} onClick={() => setCurrent(i)}>{i + 1}</div>
          ))}
        </div>
        {q && (
          <div className="card question-card">
            <div className="q-type">{t("final_test")}</div>
            <div className="q-text">{q.question}</div>
            <div className="q-ball">{q.points || 10} {t("points")}</div>
            <div className="options">
              {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, i) => (
                <div key={i} className={"option" + (answers[q.id] === i ? " selected" : "")} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: i }))}>
                  <div className="opt-letter">{letters[i]}</div>
                  <div className="opt-text">{opt}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="test-nav">
          <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← {t("prev")}</button>
          <span className="q-counter">{current + 1} / {questions.length}</span>
          {current < questions.length - 1
            ? <button className="btn-secondary" onClick={() => setCurrent(c => c + 1)}>{t("next")} →</button>
            : <button className="btn-green" onClick={() => handleSubmitFn()}>{t("submit_test")} ✓</button>}
        </div>
      </div>
    </>
  );
}
