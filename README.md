# 📚 Kitobxona — O'quv platformasi

O'zbek va Rus tillarida kitob o'qish, test ishlash va tanlov tizimi.

---

## 🚀 O'rnatish va ishga tushirish

### 1. Firebase loyiha yaratish

1. [Firebase Console](https://console.firebase.google.com) ga kiring
2. "Add project" bosing, loyiha nomi kiriting
3. Authentication > Sign-in method > Email/Password yoqing
4. Firestore Database yarating (Production mode)
5. Storage yarating
6. Project Settings > Your apps > Web app qo'shing
7. Config ma'lumotlarini nusxa oling

### 2. Firebase config kiritish

`src/firebase.js` faylini oching va o'zingizning ma'lumotlaringizni kiriting:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 3. Loyihani o'rnatish

```bash
npm install
npm start
```

### 4. Admin foydalanuvchi yaratish

Firebase Console > Authentication > Users > Add user:
- Email: admin@kitobxona.uz
- Password: xavfsiz_parol

Keyin Firestore > users kolleksiyasiga qo'lda qo'shing:
```
Document ID: (auth uid)
{
  name: "Admin",
  email: "admin@kitobxona.uz",
  role: "admin",
  totalScore: 0
}
```

### 5. Firestore rules deploy qilish

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy --only firestore:rules
```

### 6. Saytni deploy qilish

```bash
npm run build
firebase deploy --only hosting
```

---

## 🤖 Telegram Bot sozlash (Cloudflare Workers)

1. Telegram'da @BotFather ga yuboring: `/newbot`
2. Bot token oling
3. [Cloudflare Workers](https://workers.cloudflare.com) ga kiring
4. `cloudflare-worker/index.js` faylini yarating
5. `BOT_TOKEN` ni o'zgartiring
6. Worker URL ni `src/pages/student/Contests.js` faylidagi `your-worker.workers.dev` ga almashtiring

### Telegram kanal ID topish:
Bot'ni kanalga admin sifatida qo'shing, keyin:
`https://api.telegram.org/bot<TOKEN>/getUpdates`

---

## 📁 Loyiha strukturasi

```
src/
├── context/
│   └── AuthContext.js          # Auth tizimi
├── i18n/
│   ├── index.js                # i18n sozlama
│   └── locales/
│       ├── uz.json             # O'zbek tili
│       └── ru.json             # Rus tili
├── components/
│   └── shared/
│       ├── Navbar.js           # Navigatsiya
│       └── Navbar.css
├── pages/
│   ├── LoginPage.js            # Kirish sahifasi
│   ├── student/
│   │   ├── StudentDashboard.js # Kitoblar ro'yxati
│   │   ├── BookReader.js       # Kitob o'qish
│   │   ├── DailyTest.js        # Kunlik test
│   │   ├── FinalTest.js        # Yakuniy test
│   │   ├── Leaderboard.js      # Reyting
│   │   └── Contests.js         # Tanlovlar
│   └── admin/
│       ├── AdminDashboard.js   # Admin bosh sahifa
│       ├── AdminUsers.js       # Foydalanuvchilar
│       ├── AdminBooks.js       # Kitoblar + Boblar
│       ├── AdminTests.js       # Testlar + Savollar
│       ├── AdminContests.js    # Tanlovlar + Sovrinlar
│       └── AdminLeaderboard.js # Reyting (admin)
├── firebase.js                 # Firebase config
├── App.js                      # Routing
└── index.css                   # Global uslublar

cloudflare-worker/
└── index.js                    # Telegram bot backend
```

---

## 🏗️ Firebase ma'lumotlar strukturasi

| Kolleksiya | Tavsif |
|---|---|
| `users` | Foydalanuvchilar (rol, ball, streak) |
| `books` | Kitoblar (nomi, muallif, minReadMinutes) |
| `chapters` | Boblar (kitob_id, sahifalar, kontent) |
| `questions` | Savollar (bob_id, variantlar, ball) |
| `tests` | Test sessiyalari (ochilish vaqti, davomiylik) |
| `results` | Natijalar (user_id, test_id, ball) |
| `progress` | O'qish taraqqiyoti (user_id, bob_id, vaqt) |
| `contests` | Tanlovlar (kanal, sana) |
| `prizes` | Sovrinlar (tanlov_id, o'rin, tavsif) |
| `contest_entries` | Ishtirokchilar (user_id, tanlov_id) |

---

## 💰 Narx

- Firebase Spark (bepul): 50 tagacha foydalanuvchi
- Firebase Blaze (to'lovli): 500-5000 foydalanuvchi — taxminan $10-30/oy
- Cloudflare Workers: bepul (100,000 so'rov/kun)

---

## 📞 Yordam

Savollar bo'lsa, loyiha egasi bilan bog'laning.
