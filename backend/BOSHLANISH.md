# ⚡ TATU MAKON LIGA — Tezkor Ishga Tushirish

## Qadam 1: Backend
```bash
cd tuit-makon
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate && python manage.py seed
python manage.py runserver 0.0.0.0:8000
```
→ http://localhost:8000/api/

## Qadam 2: Frontend (yangi terminal)
```bash
cd frontend && npm install && npm run dev
```
→ http://localhost:3000

## 🔑 Loginlar
- React Admin: localhost:3000/admin
- Django Admin: localhost:8000/django-admin/ → admin / admin123

## 🖼️ Rasmlar
frontend/public/static/ papkasiga:
- stadium-bg.jpg (stadion rasmi)
- tatu-logo.png (TATU logosi)
