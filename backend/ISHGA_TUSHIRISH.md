# 🚀 UniLiga — Ishga tushirish yo'riqnomasi

## Talablar
- Python 3.10+
- Node.js 18+

---

## 1) Backend (Django)

PowerShell (Windows)da:

```powershell
cd C:\Users\Lenovo\Desktop\unilga5

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser

# Dev server — WebSocket + REST (ikkalasi bitta buyruqda)
daphne -b 0.0.0.0 -p 8000 config.asgi:application

# ❌ NOTO'G'RI — bu WebSocket ni ishlamaydi:
# python manage.py runserver
```

Backend: `http://localhost:8000` (LAN: `http://<LAN_IP>:8000`)

---

## 2) Frontend (Vite + React) — yangi terminal

```powershell
cd C:\Users\Lenovo\Desktop\unilga5\frontend
npm install

# Frontend env (API/WS port 8000)
Copy-Item .env.example .env.local
# Kerak bo'lsa `.env.local` ichida host/IP ni o'zgartiring:
# VITE_API_URL=http://<LAN_IP>:8000
# VITE_WS_URL=ws://<LAN_IP>:8000

npm run dev
```

Frontend: `http://localhost:5173`

---

## Prod uchun qisqa eslatma

- PostgreSQL va Redis proddan oldin qo'yiladi:
  - `DATABASE_URL=postgres://...`
  - `USE_REDIS=True`
  - `REDIS_URL=redis://.../0`
  - (ixtiyoriy) `REDIS_CHANNEL_URL=redis://.../0`
  - (ixtiyoriy) `REDIS_CACHE_URL=redis://.../1`
- `DJANGO_DEBUG=False` va `ALLOWED_HOSTS=...` ni to'g'ri sozlang.
- Static/media'ni prod-da Nginx/CDN orqali servis qilish tavsiya qilinadi (yoki vaqtinchalik `SERVE_MEDIA=True`).
