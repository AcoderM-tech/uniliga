# Uniliga — Backend

Django 5 + Django Channels (ASGI) backend with PostgreSQL and Redis.

## Requirements

- Python 3.11+
- PostgreSQL 15
- Redis 7

## Local Development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set environment variables (see root .env)
python manage.py migrate
python manage.py runserver
```

## Docker (recommended)

Use from the root directory:

```bash
docker compose up --build -d
```

## Management Commands

```bash
# Seed initial data
python manage.py seed

# Tick live match timers
python manage.py tick_matches

# Auto-finish expired matches
python manage.py auto_finish_matches
```
