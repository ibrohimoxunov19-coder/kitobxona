// src/pages/student/BookReader.js
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  doc, getDoc, collection, query, where, getDocs,
  setDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/shared/Navbar";
import "./BookReader.css";

export default function BookReader() {
  const { bookId } = useParams();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [activeChapter, setActiveChapter] = useState(null);
  const [progress, setProgress] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0); // seconds
  const [testUnlocked, setTestUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      const bookDoc = await getDoc(doc(db, "books", bookId));
      if (!bookDoc.exists()) return;
      setBook({ id: bookDoc.id, ...bookDoc.data() });

      const chapSnap = await getDocs(
        query(collection(db, "chapters"), where("bookId", "==", bookId))
      );
      const chaps = chapSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.order - b.order);
      setChapters(chaps);

      if (chaps.length > 0) {
        // Find first incomplete chapter
        let firstIncomplete = chaps[0];
        for (const ch of chaps) {
          const progDoc = await getDoc(doc(db, "progress", `${currentUser.uid}_${ch.id}`));
          if (!progDoc.exists() || progDoc.data().status !== "completed") {
            firstIncomplete = ch;
            break;
          }
        }
        await loadChapter(firstIncomplete, bookDoc.data().minReadMinutes || 15);
      }
      setLoading(false);
    }
    fetchData();
    return () => clearInterval(timerRef.current);
  }, [bookId]);

  async function loadChapter(chapter, minMinutes) {
    setActiveChapter(chapter);
    setTestUnlocked(false);
    clearInterval(timerRef.current);

    const progRef = doc(db, "progress", `${currentUser.uid}_${chapter.id}`);
    const progDoc = await getDoc(progRef);
    const existing = progDoc.exists() ? progDoc.data() : null;
    const alreadySpent = existing?.timeSpentSeconds || 0;
    setTimeSpent(alreadySpent);

    if (existing?.status === "completed" || alreadySpent >= minMinutes * 60) {
      setTestUnlocked(true);
      setProgress(existing);
      return;
    }

    setProgress(existing);
    let elapsed = alreadySpent;
    timerRef.current = setInterval(async () => {
      elapsed++;
      setTimeSpent(elapsed);
      if (elapsed >= minMinutes * 60) {
        clearInterval(timerRef.current);
        setTestUnlocked(true);
        await setDoc(progRef, {
          userId: currentUser.uid,
          bookId,
          chapterId: chapter.id,
          timeSpentSeconds: elapsed,
          status: "completed",
          completedAt: serverTimestamp()
        }, { merge: true });
      } else if (elapsed % 30 === 0) {
        // Save every 30 seconds
        await setDoc(progRef, {
          userId: currentUser.uid,
          bookId,
          chapterId: chapter.id,
          timeSpentSeconds: elapsed,
          status: "reading",
        }, { merge: true });
      }
    }, 1000);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function getRemaining(secs, minMinutes) {
    const rem = Math.max(0, minMinutes * 60 - secs);
    return formatTime(rem);
  }

  if (loading) return <><Navbar /><div className="loading-screen">{t("loading")}</div></>;
  if (!book) return <><Navbar /><div className="loading-screen">{t("error")}</div></>;

  const minMins = book.minReadMinutes || 15;

  return (
    <>
      <Navbar />
      <div className="reader-container">
        {/* Header */}
        <div className="card reader-header">
          <div className="reader-info">
            <h2>{book.name}</h2>
            <p>{book.author} — {activeChapter?.name} ({activeChapter?.pageFrom}-{activeChapter?.pageTo} {t("pages")})</p>
          </div>
          <div className="timer-box">
            <span className="timer-icon">⏱</span>
            <div>
              <div className="timer-val">{formatTime(timeSpent)}</div>
              <div className="timer-label">{t("min_read_time")}: {minMins} {t("minutes")}</div>
            </div>
          </div>
        </div>

        {/* Chapter navigation */}
        <div className="chapter-nav">
          {chapters.map(ch => (
            <button
              key={ch.id}
              className={"ch-btn" + (activeChapter?.id === ch.id ? " active" : "")}
              onClick={() => loadChapter(ch, minMins)}
            >
              {ch.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card reader-content">
          {activeChapter?.contentType === "pdf" ? (
            <div className="pdf-notice">
              <p>📄 PDF fayl: <a href={activeChapter.pdfUrl} target="_blank" rel="noreferrer">Ochish</a></p>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: activeChapter?.content || "<p>Kontent yuklanmoqda...</p>" }} />
          )}
        </div>

        {/* Footer */}
        <div className="card reader-footer">
          {testUnlocked ? (
            <div className="test-unlock unlocked">
              <span>✅</span>
              <div>
                <div className="unlock-text">{t("test_unlocked")}</div>
                <div className="unlock-sub">{t("reading")} yakunlandi</div>
              </div>
            </div>
          ) : (
            <div className="test-unlock locked">
              <span>🔒</span>
              <div>
                <div className="unlock-text locked">
                  {t("test_unlocks_in")}: {getRemaining(timeSpent, minMins)}
                </div>
                <div className="unlock-sub">{minMins} {t("minutes")} {t("min_read_time").toLowerCase()}</div>
              </div>
            </div>
          )}
          <button
            className="btn-primary"
            disabled={!testUnlocked}
            onClick={() => navigate(`/test/daily/${bookId}/${activeChapter?.id}`)}
          >
            {t("daily_test")} →
          </button>
        </div>
      </div>
    </>
  );
}
