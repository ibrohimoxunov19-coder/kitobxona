// src/pages/student/StudentDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/shared/Navbar";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [progresses, setProgresses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Fetch active books
      const booksSnap = await getDocs(query(collection(db, "books"), where("active", "==", true)));
      const booksData = booksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setBooks(booksData);

      // Fetch user progress for each book
      const prog = {};
      for (const book of booksData) {
        const progSnap = await getDocs(
          query(collection(db, "progress"),
            where("userId", "==", currentUser.uid),
            where("bookId", "==", book.id))
        );
        const chaptersSnap = await getDocs(query(collection(db, "chapters"), where("bookId", "==", book.id)));
        const totalChapters = chaptersSnap.size;
        const readChapters = progSnap.docs.filter(d => d.data().status === "completed").length;
        prog[book.id] = { readChapters, totalChapters, percent: totalChapters ? Math.round((readChapters / totalChapters) * 100) : 0 };
      }
      setProgresses(prog);
      setLoading(false);
    }
    fetchData();
  }, [currentUser]);

  const coverColors = ["c1", "c2", "c3", "c4"];
  const coverEmojis = ["📗", "📙", "📘", "📕"];

  if (loading) return <><Navbar /><div className="loading-screen">{t("loading")}</div></>;

  return (
    <>
      <Navbar />
      <div className="page-container">
        <h1 className="page-title">{t("my_books")}</h1>
        <div className="books-grid">
          {books.map((book, i) => {
            const prog = progresses[book.id] || { readChapters: 0, totalChapters: 0, percent: 0 };
            const status = prog.percent === 100 ? "completed" : prog.percent > 0 ? "in_progress" : "not_started";
            return (
              <div key={book.id} className="book-card" onClick={() => navigate(`/book/${book.id}`)}>
                <div className={`book-cover ${coverColors[i % 4]}`}>{coverEmojis[i % 4]}</div>
                <div className="book-body">
                  <div className="book-name">{book.name}</div>
                  <div className="book-author">{book.author}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: prog.percent + "%" }} />
                  </div>
                  <div className="book-meta">
                    <span>{prog.readChapters}/{prog.totalChapters} {t("chapter")}</span>
                    <span>{prog.percent}%</span>
                  </div>
                  <span className={"badge " + (status === "completed" ? "badge-orange" : "badge-green")}>
                    {t(status)}
                  </span>
                </div>
              </div>
            );
          })}
          {books.length === 0 && <div className="no-books">{t("no_data")}</div>}
        </div>
      </div>
    </>
  );
}
