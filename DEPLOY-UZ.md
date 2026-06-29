# Deploy Qilish (O'zbekcha qo'llanma)

## ✅ ENG OSON VA ISHONCHLI YO'L: Render (404 bo'lmaydi)

Vercel'dagi **404** xatosi — bu Vercel'ning serverless yo'naltirishidan.
**Render** esa oddiy serverni ishga tushiradi: Express o'zi ham saytni, ham
API'ni beradi → 404 bo'lmaydi. Render bazani ham o'zi yaratib ulaydi —
**siz hech narsa sozlamaysiz**.

### Qadamlar
1. Kod GitHub'da bo'lsin (men yuklab beraman).
2. https://render.com ga kiring (GitHub bilan ro'yxatdan o'ting — bepul).
3. **New** → **Blueprint** → repongizni (`shohruxmuminov/mockbest`) tanlang.
4. Render `render.yaml` ni o'qiydi va o'zi yaratadi:
   - **Postgres baza** (bepul) + `DATABASE_URL` avtomatik ulanadi ✅
   - **Web service** (Express server) ✅
   - `JWT_SECRET` avtomatik, `ADMIN_CODE = 2010` ✅
5. **Apply** / **Create** bosing. 3-5 daqiqada tayyor.
6. Render bergan manzilga kiring → `/admin/login` → kod **`2010`** → kirasiz. 🎉

> Render'da hech qanday Output Directory, parol yoki qo'shimcha sozlama
> kerak emas — `render.yaml` hammasini qiladi.

---

## Muqobil: Vercel

Agar baribir Vercel ishlatmoqchi bo'lsangiz:

1. Vercel → **Add New → Project** → repo.
2. **Settings → Build & Output Settings**'da hamma narsani **default/bo'sh**
   qoldiring (Output Directory'ni `public` qilib qo'ymang!). `vercel.json`
   o'zi sozlaydi.
3. **Storage**'da Postgres (Neon) yarating yoki `DATABASE_URL` ga Supabase
   "Transaction pooler" satrini (parol bilan) qo'ying.
4. `JWT_SECRET` qo'shing. **Deploy**.

> Yangi `vercel.json` dashboard sozlamalarini bekor qiladi va to'g'ri
> yo'naltiradi — 404 muammosi hal bo'ladi.

---

## Lokal ishga tushirish

Postgres kerak:
```bash
npm install
npm run client:install
cp .env.example .env       # DATABASE_URL ni to'ldiring
npm run dev:server         # http://localhost:8080
npm run dev:client         # http://localhost:5173
```
Yoki bitta serverda: `npm run build && npm start`

---

## Foydalanish
- **Admin**: `/admin/login` → kod **`2010`** → Mock Tests / Candidates / Monitoring / Review.
- **Nomzod**: bosh sahifa → 14 xonali kod → testlar.

Omad! 🚀
