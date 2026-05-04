// src/pages/student/DailyTest.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  collection, query, where, getDocs, doc, getDoc,
  addDoc, serverTimestamp, updateDoc
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/shared/Navbar";
import "./DailyTest.css";

export default function DailyTest() {
  const { bookId, chapterId } = useParams();
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testSession, setTestSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    async function fetchTest() {
      // Check active test for this book
      const testsSnap = await getDocs(
        query(collection(db, "tests"),
          where("bookId", "==", bookId),
          where("type", "==", "daily"),
          where("status", "==", "open"))
      );
      if (testsSnap.empty) {
        setLoading(false);
        return;
      }
      const testData = { id: testsSnap.docs[0].id, ...testsSnap.docs[0].data() };
      setTestSession(testData);

      // Check if already attempted
      const existingSnap = await getDocs(
        query(collection(db, "results"),
          where("userId", "==", currentUser.uid),
          where("testId", "==", testData.id))
      );
      if (!existingSnap.empty) {
        setResult(existingSnap.docs[0].data());
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Get questions: 5 from today's chapter, 5 from previous
      const todayQSnap = await getDocs(
        query(collection(db, "questions"),
          where("bookId", "==", bookId),
          where("chapterId", "==", chapterId))
      );
      const prevQSnap = await getDocs(
        query(collection(db, "questions"),
          where("bookId", "==", bookId),
          where("chapterId", "!=", chapterId))
      );

      const todayQs = shuffle(todayQSnap.docs.map(d => ({ id: d.id, source: "today", ...d.data() }))).slice(0, 5);
      const prevQs = shuffle(prevQSnap.docs.map(d => ({ id: d.id, source: "previous", ...d.data() }))).slice(0, 5);

      let allQs = [...todayQs, ...prevQs];
      if (testData.questionOrder === "random") allQs = shuffle(allQs);

      setQuestions(allQs);

      // Start timer
      const durationSecs = (testData.durationHours || 1) * 3600;
      setTimeLeft(durationSecs);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleSubmit(allQs, answers); return 0; }
          return prev - 1;
        });
      }, 1000);

      setLoading(false);
    }
    fetchTest();
    return () => clearInterval(timerRef.current);
  }, []);

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function selectAnswer(qId, optIdx) {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  }

  async function handleSubmit(qs = questions, ans = answers) {
    clearInterval(timerRef.current);
    let totalScore = 0, correctCount = 0;
    qs.forEach(q => {
      if (ans[q.id] === q.correctAnswer) {
        totalScore += q.points || 5;
        correctCount++;
      }
    });

    // Save result
    await addDoc(collection(db, "results"), {
      userId: currentUser.uid,
      testId: testSession.id,
      bookId,
      chapterId,
      type: "daily",
      score: totalScore,
      correctCount,
      totalQuestions: qs.length,
      answers: ans,
      submittedAt: serverTimestamp()
    });

    // Update user total score
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      totalScore: (userData?.totalScore || 0) + totalScore,
      dailyTestScore: (userData?.dailyTestScore || 0) + totalScore
    });

    setResult({ score: totalScore, correctCount, totalQuestions: qs.length });
    setSubmitted(true);
  }

  function formatTime(secs) {
    if (!secs) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  if (loading) return <><Navbar /><div className="loading-screen">{t("loading")}</div></>;

  if (!testSession) return (
    <>
      <Navbar />
      <div className="test-page">
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <p style={{ color: "var(--ink3)" }}>Test hali ochilmagan. Iltimos, keyinroq kiring.</p>
          <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate(-1)}>← Orqaga</button>
        </div>
      </div>
    </>
  );

  if (submitted && result) return (
    <>
      <Navbar />
      <div className="test-page">
        <div className="card result-card">
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div className="result-score">{result.score}</div>
          <div className="result-label">{t("total_score")}</div>
          <div className="result-stats">
            <div className="stat"><div className="stat-val">{result.correctCount}</div><div className="stat-label">{t("correct")}</div></div>
            <div className="stat"><div className="stat-val">{result.totalQuestions - result.correctCount}</div><div className="stat-label">{t("wrong")}</div></div>
            <div className="stat"><div className="stat-val">{result.totalQuestions}</div><div className="stat-label">{t("question")}</div></div>
          </div>
          <div className="result-msg">Ball reytingga qo'shildi!</div>
          <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate("/dashboard")}>{t("back_home")}</button>
        </div>
      </div>
    </>
  );

  const q = questions[current];
  const letters = ["A", "B", "C", "D"];

  return (
    <>
      <Navbar />
      <div className="test-page">
        {/* Header */}
        <div className="test-header">
          <div>
            <div className="test-title">{t("daily_test")}</div>
            <div className="test-meta">10 {t("question")} • 5 {t("from_today")} + 5 {t("from_previous")}</div>
          </div>
          <div className="test-timer">
            <div className="test-timer-val">{formatTime(timeLeft)}</div>
            <div className="test-timer-label">qoldi</div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="q-dots">
          {questions.map((_, i) => (
            <div
              key={i}
              className={"q-dot" + (i === current ? " current" : "") + (answers[questions[i]?.id] !== undefined ? " answered" : "")}
              onClick={() => setCurrent(i)}
            >{i + 1}</div>
          ))}
        </div>

        {/* Question */}
        {q && (
          <div className="card question-card">
            <div className="q-type">{q.source === "today" ? t("from_today") : t("from_previous")}</div>
            <div className="q-text">{q.question}</div>
            <div className="q-ball">{q.points || 5} {t("points")}</div>
            <div className="options">
              {[q.optionA, q.optionB, q.optionC, q.optionD].map((opt, i) => (
                <div
                  key={i}
                  className={"option" + (answers[q.id] === i ? " selected" : "")}
                  onClick={() => selectAnswer(q.id, i)}
                >
                  <div className="opt-letter">{letters[i]}</div>
                  <div className="opt-text">{opt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="test-nav">
          <button className="btn-secondary" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>← {t("prev")}</button>
          <span className="q-counter">{current + 1} / {questions.length}</span>
          {current < questions.length - 1
            ? <button className="btn-secondary" onClick={() => setCurrent(c => c + 1)}>{t("next")} →</button>
            : <button className="btn-green" onClick={() => handleSubmit()}>{t("submit_test")} ✓</button>
          }
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn-green" onClick={() => handleSubmit()}>{t("submit_test")}</button>
        </div>
      </div>
    </>
  );
}
