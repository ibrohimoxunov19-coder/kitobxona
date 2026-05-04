// src/pages/student/Contests.js
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/shared/Navbar";
import "./Contests.css";

export default function Contests() {
  const { t } = useTranslation();
  const { currentUser, userData } = useAuth();
  const [contests, setContests] = useState([]);
  const [prizes, setPrizes] = useState({});
  const [entries, setEntries] = useState({});
  const [telegramId, setTelegramId] = useState(userData?.telegramId || "");
  const [checking, setChecking] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const snap = await getDocs(query(collection(db, "contests"), where("active", "==", true)));
      const contestsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setContests(contestsData);

      const prizesMap = {};
      const entriesMap = {};
      for (const c of contestsData) {
        const pSnap = await getDocs(query(collection(db, "prizes"), where("contestId", "==", c.id)));
        prizesMap[c.id] = pSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.rank - b.rank);

        const eSnap = await getDocs(
          query(collection(db, "contest_entries"),
            where("contestId", "==", c.id),
            where("userId", "==", currentUser.uid))
        );
        entriesMap[c.id] = eSnap.empty ? null : eSnap.docs[0].data();
      }
      setPrizes(prizesMap);
      setEntries(entriesMap);
      setLoading(false);
    }
    fetchData();
  }, []);

  async function checkMembership(contestId, channelId) {
    if (!telegramId) return alert("Telegram ID kiriting");
    setChecking(prev => ({ ...prev, [contestId]: true }));
    try {
      // Cloudflare Workers endpoint
      const res = await fetch(`https://your-worker.workers.dev/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, channelId })
      });
      const data = await res.json();
      if (data.isMember) {
        await setDoc(doc(db, "contest_entries", `${currentUser.uid}_${contestId}`), {
          userId: currentUser.uid,
          contestId,
          telegramId,
          telegramVerified: true,
          joinedAt: serverTimestamp()
        });
        setEntries(prev => ({ ...prev, [contestId]: { telegramVerified: true } }));
      } else {
        alert("Siz hali kanalga a'zo emassiz. Avval kanalga qo'shiling!");
      }
    } catch {
      alert("Tekshirishda xato. Keyinroq urinib ko'ring.");
    }
    setChecking(prev => ({ ...prev, [contestId]: false }));
  }

  if (loading) return <><Navbar /><div className="loading-screen">{t("loading")}</div></>;

  return (
    <>
      <Navbar />
      <div className="contests-container">
        <h1 className="page-title">{t("contests")}</h1>
        <p className="page-sub">Faol tanlovlar</p>

        {contests.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--ink3)" }}>
            Hozircha faol tanlov yo'q
          </div>
        )}

        {contests.map(contest => {
          const entry = entries[contest.id];
          const isJoined = entry?.telegramVerified;
          const contestPrizes = prizes[contest.id] || [];

          return (
            <div key={contest.id} className="card contest-card">
              <div className="contest-header">
                <div>
                  <h2 className="contest-title">{contest.name}</h2>
                  <p className="contest-dates">
                    {contest.startDate} — {contest.endDate}
                  </p>
                </div>
                <span className={"badge " + (isJoined ? "badge-green" : "badge-orange")}>
                  {isJoined ? "✅ Ishtirokchi" : "Ishtirok etilmagan"}
                </span>
              </div>

              <p className="contest-desc">{contest.description}</p>

              {/* Prizes */}
              {contestPrizes.length > 0 && (
                <div className="prizes-section">
                  <div className="prizes-title">🏆 {t("prizes")}</div>
                  <div className="prizes-list">
                    {contestPrizes.map(prize => (
                      <div key={prize.id} className="prize-item">
                        <span className="prize-rank">
                          {prize.rank === 1 ? "🥇" : prize.rank === 2 ? "🥈" : prize.rank === 3 ? "🥉" : `${prize.rank}-o'rin`}
                        </span>
                        <span className="prize-text">{prize.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Join section */}
              {!isJoined && (
                <div className="join-section">
                  <div className="join-title">📋 {t("contest_conditions")}</div>
                  <p className="join-desc">Ishtirok etish uchun quyidagi Telegram kanalga a'zo bo'ling:</p>
                  <a href={`https://t.me/${contest.channelUsername}`} target="_blank" rel="noreferrer" className="channel-link">
                    📢 @{contest.channelUsername}
                  </a>
                  <div className="telegram-check">
                    <input
                      className="form-input"
                      placeholder={t("enter_telegram_id")}
                      value={telegramId}
                      onChange={e => setTelegramId(e.target.value)}
                    />
                    <button
                      className="btn-primary"
                      onClick={() => checkMembership(contest.id, contest.channelId)}
                      disabled={checking[contest.id]}
                    >
                      {checking[contest.id] ? t("loading") : t("check_membership")}
                    </button>
                  </div>
                  <p className="tg-hint">
                    Telegram ID topish uchun: @userinfobot ga /start yuboring
                  </p>
                </div>
              )}

              {isJoined && (
                <div className="joined-msg">
                  ✅ Siz ushbu tanlovda ishtirok etmoqdasiz! Eng ko'p ball to'plab yuqori o'rin egallang.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
