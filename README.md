# ⚽ Uniliga — Football League Management System

A full-stack football league management web application built with Django, React, WebSockets, and Docker.

**Developed by [AcoderM](https://github.com/AcoderM)**

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 5 + Django Channels (Daphne/ASGI) |
| Frontend | React 18 + Vite |
| Database | PostgreSQL 15 |
| Cache / WebSocket Layer | Redis 7 |
| Web Server | Nginx |
| Tunnel | Cloudflare Tunnel |
| Containerization | Docker + Docker Compose |

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/AcoderM/uniliga.git
cd uniliga
```

### 2. Configure environment variables

Copy and fill in the environment files:

```bash
# Root .env — backend config
cp .env .env   # already present, just fill in the values
```

Required variables to fill in `.env`:

```
DJANGO_SECRET_KEY=          # Generate: python -c "import secrets; print(secrets.token_hex(50))"
POSTGRES_DB=uniliga_db
POSTGRES_USER=uniliga_user
POSTGRES_PASSWORD=          # Set a strong password
DATABASE_URL=postgres://uniliga_user:YOUR_PASS@uniliga_db:5432/uniliga_db
AUTO_SUPERUSER_USERNAME=    # Admin panel username
AUTO_SUPERUSER_PASSWORD=    # Admin panel password
AUTO_SUPERUSER_EMAIL=       # Admin email
FRONTEND_ORIGIN=            # https://yourdomain.com
CORS_ALLOWED_ORIGINS=       # https://yourdomain.com
CSRF_TRUSTED_ORIGINS=       # https://yourdomain.com
JWT_COOKIE_DOMAIN=          # .yourdomain.com
```

Fill in `frontend/.env.local`:

```
VITE_API_URL=https://yourdomain.com
VITE_WS_URL=wss://yourdomain.com
```

### 3. Configure Cloudflare Tunnel (optional but recommended)

1. Go to [Cloudflare Zero Trust Dashboard](https://dash.cloudflare.com) → Tunnels
2. Create a new tunnel and download the credentials JSON file
3. Place the credentials file in `.cloudflared/YOUR_TUNNEL_ID.json`
4. Update `.cloudflared/config.yml` with your tunnel ID and domain

### 4. Build and run

```bash
docker compose up --build -d
```

### 5. Access

- Frontend: `https://yourdomain.com`
- Django Admin: `https://yourdomain.com/admin/`

---

## 📁 Project Structure

```
uniliga/
├── backend/                # Django application
│   ├── config/             # Settings, URLs, ASGI/WSGI
│   ├── core/               # Main app (models, views, serializers, consumers)
│   │   ├── migrations/
│   │   ├── management/commands/
│   │   └── ...
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── admin/          # Admin panel components
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── lib/
│   ├── public/
│   ├── Dockerfile
│   └── nginx.conf
├── .cloudflared/           # Cloudflare Tunnel config (add your credentials)
├── docker-compose.yml
└── .env                    # Environment variables (fill before running)
```

---

## ⚙️ Services

| Service | Container | Port |
|---|---|---|
| PostgreSQL | `uniliga_db` | internal |
| Redis | `uniliga_redis` | internal |
| Django/Daphne | `uniliga_backend` | 8000 (internal) |
| Nginx/Frontend | `uniliga_frontend` | 80 (internal) |
| Cloudflare Tunnel | `uniliga_cloudflare` | — |

---

## 🔑 Features

- Live match scores via WebSockets
- League table, players, matches, seasons management
- News / posts system with image galleries
- Admin dashboard (React-based)
- JWT authentication (cookie-based, HTTP-only)
- Cloudflare Tunnel for zero-config HTTPS
- Docker-based one-command deployment

---

## 📄 License

MIT License — see [LICENSE](LICENSE)
