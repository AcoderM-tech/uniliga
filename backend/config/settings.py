# ═══════════════════════════════════════════════════════════════════════════════
#  config/settings.py  —  acoderm.uz (Django + Channels + Cloudflare Tunnel)
#  Arxitektura:  Cloudflare Tunnel (TLS)  →  Nginx (80)  →  Daphne (8000)
#  Yagona domen: acoderm.uz  (eski football.* / api-football.* olib tashlandi)
# ═══════════════════════════════════════════════════════════════════════════════
from pathlib import Path
import os
from datetime import timedelta
from urllib.parse import urlparse, quote_plus

BASE_DIR = Path(__file__).resolve().parent.parent

# ── .env yuklash ───────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    pass


# ── ENV helperlari ─────────────────────────────────────────────────────────────
def env_bool(name: str, default: bool = False) -> bool:
    val = os.environ.get(name)
    if val is None:
        return default
    return str(val).strip().lower() in ('1', 'true', 'yes', 'y', 'on')


def env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, str(default)))
    except (TypeError, ValueError):
        return default


def env_list(name: str, default: list[str] | None = None) -> list[str]:
    val = os.environ.get(name)
    if val is None:
        return list(default or [])
    return [v.strip() for v in str(val).split(',') if v.strip()]


# ═════════════════════════════════════════════════════════════════════════════
#  ASOSIY
# ═════════════════════════════════════════════════════════════════════════════
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY') or os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError("DJANGO_SECRET_KEY env o'zgaruvchisi majburiy")

DEBUG = env_bool('DJANGO_DEBUG', False)

# ── Allowed Hosts ──────────────────────────────────────────────────────────────

ALLOWED_HOSTS = [
    #
]
if DEBUG:
    ALLOWED_HOSTS += ['.ngrok-free.dev', '.ngrok.io', '*']


# ═════════════════════════════════════════════════════════════════════════════
#  INSTALLED APPS
# ═════════════════════════════════════════════════════════════════════════════
INSTALLED_APPS = [
    'daphne',                         # ASGI server (birinchi bo'lishi shart)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',

    'core.apps.CoreConfig',
]


# ═════════════════════════════════════════════════════════════════════════════
#  MEDIA UCHUN KICHIK MIDDLEWARE (faqat CORP header — rasm/video uchun)
#  Boshqa hamma security headerlar Nginx da.
# ═════════════════════════════════════════════════════════════════════════════
class MediaCorpMiddleware:
    """
    Faqat /media/ va /api/protected-media/ uchun CORP=cross-origin qo'yadi.
    Bu Firefox da rasm/video yuklanmaslik muammosini hal qiladi.
    Nginx allaqachon /media/ ga bu headerni qo'yadi — bu zaxira sifatida
    Django SERVE_MEDIA=True bo'lgan holat uchun.
    """
    MEDIA_PREFIXES = ('/media/', '/api/protected-media/')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        path = request.path_info or ''
        if any(path.startswith(p) for p in self.MEDIA_PREFIXES):
            response['Cross-Origin-Resource-Policy'] = 'cross-origin'
        return response


# ═════════════════════════════════════════════════════════════════════════════
#  MIDDLEWARE — TARTIB MUHIM!
#  Kamaytirilgan, faqat zarur bo'lganlari. CSP endi faqat Nginx da.
# ═════════════════════════════════════════════════════════════════════════════
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',                 # 1. CORS (eng birinchi)
    'django.middleware.security.SecurityMiddleware',         # 2. HSTS, nosniff va b.
    'whitenoise.middleware.WhiteNoiseMiddleware',            # 3. Static (Django admin)
    'django.middleware.gzip.GZipMiddleware',                 # 4. GZip
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'config.settings.MediaCorpMiddleware',                   # faqat media uchun CORP
]

ROOT_URLCONF = 'config.urls'
ASGI_APPLICATION = 'config.asgi.application'
WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [BASE_DIR / 'templates'],
    'APP_DIRS': True,
    'OPTIONS': {
        'context_processors': [
            'django.template.context_processors.debug',
            'django.template.context_processors.request',
            'django.contrib.auth.context_processors.auth',
            'django.contrib.messages.context_processors.messages',
        ],
    },
}]


# ═════════════════════════════════════════════════════════════════════════════
#  DATABASE
# ═════════════════════════════════════════════════════════════════════════════
import dj_database_url

DB_ENGINE = (os.environ.get('DB_ENGINE', 'postgres') or 'postgres').strip().lower()
USE_SQLITE_FALLBACK = env_bool('USE_SQLITE_FALLBACK', DEBUG) and DEBUG
DB_CONNECT_TIMEOUT_SECONDS = env_int('DB_CONNECT_TIMEOUT_SECONDS', 2)
SQLITE_URL = (os.environ.get('SQLITE_URL') or f"sqlite:///{BASE_DIR / 'db.sqlite3'}").strip()


def _build_postgres_url() -> str:
    url = (os.environ.get('DATABASE_URL') or '').strip()
    if url:
        return url
    host = (os.environ.get('POSTGRES_HOST') or os.environ.get('DB_HOST') or '').strip()
    port = (os.environ.get('POSTGRES_PORT') or os.environ.get('DB_PORT') or '5432').strip() or '5432'
    name = (os.environ.get('POSTGRES_DB') or os.environ.get('DB_NAME') or '').strip()
    user = (os.environ.get('POSTGRES_USER') or os.environ.get('DB_USER') or '').strip()
    pwd  = (os.environ.get('POSTGRES_PASSWORD') or os.environ.get('DB_PASSWORD') or '').strip()
    if not (host and name and user):
        return ''
    user_q = quote_plus(user)
    pwd_q  = quote_plus(pwd) if pwd else ''
    auth = f"{user_q}:{pwd_q}@" if pwd_q else f"{user_q}@"
    return f"postgres://{auth}{host}:{port}/{name}"


db_url = SQLITE_URL if DB_ENGINE == 'sqlite' else _build_postgres_url()
if not db_url:
    if USE_SQLITE_FALLBACK:
        db_url = SQLITE_URL
    else:
        raise RuntimeError("PostgreSQL uchun DATABASE_URL (yoki POSTGRES_*/DB_*) env majburiy")

if (not DEBUG) and str(db_url).strip().lower().startswith('sqlite'):
    raise RuntimeError("SQLite productionda ishlamasligi kerak (DJANGO_DEBUG=False)")

DATABASES = {
    'default': dj_database_url.parse(db_url, conn_max_age=600, conn_health_checks=True),
}

# Postgres ishlamasa SQLite fallback (faqat DEBUG)
if USE_SQLITE_FALLBACK and DB_ENGINE != 'sqlite' and db_url.startswith(('postgres://', 'postgresql://')):
    try:
        import psycopg2
        u = urlparse(db_url)
        psycopg2.connect(
            dbname=(u.path or '').lstrip('/'),
            user=u.username, password=u.password,
            host=u.hostname, port=u.port or 5432,
            connect_timeout=DB_CONNECT_TIMEOUT_SECONDS,
        ).close()
    except Exception:
        DATABASES['default'] = dj_database_url.parse(SQLITE_URL, conn_max_age=0, conn_health_checks=False)


# ═════════════════════════════════════════════════════════════════════════════
#  CHANNEL LAYER (WebSocket — Redis)
# ═════════════════════════════════════════════════════════════════════════════
USE_REDIS = env_bool('USE_REDIS', not DEBUG)
REDIS_URL         = (os.environ.get('REDIS_URL') or '').strip()
REDIS_CHANNEL_URL = (os.environ.get('REDIS_CHANNEL_URL') or REDIS_URL).strip()
REDIS_CACHE_URL   = (os.environ.get('REDIS_CACHE_URL')   or REDIS_URL).strip()

REDIS_CONNECT_TIMEOUT_SECONDS = env_int('REDIS_CONNECT_TIMEOUT_SECONDS', 2)
REDIS_SOCKET_TIMEOUT_SECONDS  = env_int('REDIS_SOCKET_TIMEOUT_SECONDS',  2)


def _redis_available(url: str) -> bool:
    if not (USE_REDIS and url):
        return False
    try:
        import redis
        client = redis.from_url(
            url,
            socket_connect_timeout=REDIS_CONNECT_TIMEOUT_SECONDS,
            socket_timeout=REDIS_SOCKET_TIMEOUT_SECONDS,
        )
        client.ping()
        return True
    except Exception:
        return False


_redis_channel_available = _redis_available(REDIS_CHANNEL_URL)
CHANNEL_LAYER_CAPACITY = env_int('CHANNEL_LAYER_CAPACITY', 1000)
CHANNEL_LAYER_EXPIRY   = env_int('CHANNEL_LAYER_EXPIRY', 10)
CHANNEL_LAYER_PREFIX   = (os.environ.get('CHANNEL_LAYER_PREFIX') or 'uniliga').strip() or 'uniliga'

if _redis_channel_available:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [REDIS_CHANNEL_URL],
                'capacity': CHANNEL_LAYER_CAPACITY,
                'expiry':   CHANNEL_LAYER_EXPIRY,
                'prefix':   CHANNEL_LAYER_PREFIX,
            },
        }
    }
else:
    CHANNEL_LAYERS = {'default': {'BACKEND': 'channels.layers.InMemoryChannelLayer'}}


# ═════════════════════════════════════════════════════════════════════════════
#  CACHE
# ═════════════════════════════════════════════════════════════════════════════
_redis_cache_available = _redis_available(REDIS_CACHE_URL)
USE_REDIS_CACHE = bool(REDIS_CACHE_URL) and _redis_cache_available

if USE_REDIS_CACHE:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_CACHE_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'IGNORE_EXCEPTIONS': True,
                'SOCKET_CONNECT_TIMEOUT': REDIS_CONNECT_TIMEOUT_SECONDS,
                'SOCKET_TIMEOUT':         REDIS_SOCKET_TIMEOUT_SECONDS,
            },
            'KEY_PREFIX': (os.environ.get('CACHE_KEY_PREFIX') or 'uniliga').strip() or 'uniliga',
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'uniliga-locmem',
        }
    }

CACHE_TTL_HOME  = env_int('CACHE_TTL_HOME',  5)
CACHE_TTL_TABLE = env_int('CACHE_TTL_TABLE', 15)
CACHE_TTL_TOP   = env_int('CACHE_TTL_TOP',   15)


# ═════════════════════════════════════════════════════════════════════════════
#  TIL / VAQT
# ═════════════════════════════════════════════════════════════════════════════
LANGUAGE_CODE = 'uz'
TIME_ZONE     = 'Asia/Tashkent'
USE_I18N      = True
USE_TZ        = True


# ═════════════════════════════════════════════════════════════════════════════
#  STATIC / MEDIA
# ═════════════════════════════════════════════════════════════════════════════
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
SERVE_MEDIA = DEBUG or env_bool('SERVE_MEDIA', False)

if DEBUG:
    STATICFILES_DIRS = [
        d for d in [BASE_DIR / 'frontend' / 'dist']
        if (BASE_DIR / 'frontend' / 'dist').exists()
    ]
    STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
else:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

PROTECTED_MEDIA_ROOT = BASE_DIR / 'protected_media'


# ═════════════════════════════════════════════════════════════════════════════
#  CORS  —  yagona acoderm.uz domeniga
# ═════════════════════════════════════════════════════════════════════════════
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # productionda HECH QACHON True emas

CORS_ALLOWED_ORIGINS = [
  #
]

# DEBUG uchun local dev
if DEBUG:
    CORS_ALLOWED_ORIGINS += [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
    ]

# env dan qo'shimcha origin (masalan ngrok)
for origin in env_list('CORS_ALLOWED_ORIGINS'):
    if origin not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(origin)

CORS_ALLOWED_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with',
]
CORS_EXPOSE_HEADERS = ['Content-Type', 'X-CSRFToken']


# ═════════════════════════════════════════════════════════════════════════════
#  CSRF
# ═════════════════════════════════════════════════════════════════════════════
CSRF_TRUSTED_ORIGINS = [
    #
]
if DEBUG:
    CSRF_TRUSTED_ORIGINS += [
        #
    ]
for origin in env_list('CSRF_TRUSTED_ORIGINS'):
    if origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)


# ═════════════════════════════════════════════════════════════════════════════
#  CLOUDFLARE TUNNEL  —  Proxy sozlamalari
# ═════════════════════════════════════════════════════════════════════════════
# Cloudflare Tunnel TLS ni o'zi tugallaydi va bu headerni yuboradi:
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST    = True
USE_X_FORWARDED_PORT    = True

# MUHIM: Cloudflare Tunnel ortida SECURE_SSL_REDIRECT=True — redirect loop yaratadi!
SECURE_SSL_REDIRECT = False


# ═════════════════════════════════════════════════════════════════════════════
#  COOKIES  —  Yagona domen uchun SameSite=Lax (cross-site kerak emas)
# ═════════════════════════════════════════════════════════════════════════════
# Barcha trafik bitta acoderm.uz da — SameSite=Lax yetarli va xavfsizroq.
# (Eski `SameSite=None` faqat cross-site frontend→api uchun kerak edi.)

# Session
SESSION_ENGINE          = 'django.contrib.sessions.backends.cached_db' if USE_REDIS_CACHE else 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE      = 86400 * 7
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_NAME     = 'uniliga_sid'
SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
SESSION_COOKIE_SECURE   = not DEBUG

# CSRF
CSRF_COOKIE_HTTPONLY = False  # React frontend o'qishi uchun
CSRF_COOKIE_SAMESITE = os.environ.get('CSRF_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SECURE   = not DEBUG

# JWT (custom cookie)
JWT_REFRESH_COOKIE_NAME = os.environ.get('JWT_REFRESH_COOKIE_NAME', 'uniliga_refresh')
JWT_COOKIE_SECURE       = env_bool('JWT_COOKIE_SECURE', not DEBUG)
JWT_COOKIE_SAMESITE     = os.environ.get('JWT_COOKIE_SAMESITE', 'Lax')
_jwt_domain             = os.environ.get('JWT_COOKIE_DOMAIN', '').strip()
JWT_COOKIE_DOMAIN       = _jwt_domain if _jwt_domain else None
JWT_COOKIE_PATH         = os.environ.get('JWT_COOKIE_PATH', '/')


# ═════════════════════════════════════════════════════════════════════════════
#  SECURITY HEADERS
#  CSP va Permissions-Policy endi faqat Nginx da (takrorlanmasin).
# ═════════════════════════════════════════════════════════════════════════════
X_FRAME_OPTIONS             = 'SAMEORIGIN'       # YouTube embed bir xil domen ichida
SECURE_REFERRER_POLICY      = 'strict-origin-when-cross-origin'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER   = True

# COOP / COEP / CORP — YouTube embed va cross-origin resurslar uchun o'chirilgan
# (CORP media uchun MediaCorpMiddleware orqali qo'yiladi)
SECURE_CROSS_ORIGIN_EMBEDDER_POLICY = None
SECURE_CROSS_ORIGIN_OPENER_POLICY   = None

# HSTS — faqat production
if not DEBUG:
    SECURE_HSTS_SECONDS           = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD           = True


# ═════════════════════════════════════════════════════════════════════════════
#  PAROL VALIDATSIYA
# ═════════════════════════════════════════════════════════════════════════════
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ═════════════════════════════════════════════════════════════════════════════
#  DRF + JWT
# ═════════════════════════════════════════════════════════════════════════════
JWT_ACCESS_MINUTES         = env_int('JWT_ACCESS_MINUTES', 15)
JWT_REFRESH_DAYS           = env_int('JWT_REFRESH_DAYS',  7)
JWT_ROTATE_REFRESH_TOKENS  = env_bool('JWT_ROTATE_REFRESH_TOKENS',  True)
JWT_BLACKLIST_AFTER_ROTATION = env_bool('JWT_BLACKLIST_AFTER_ROTATION', True)
JWT_ALGORITHM              = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_SIGNING_KEY            = os.environ.get('JWT_SIGNING_KEY', SECRET_KEY)
JWT_AUTH_HEADER_TYPES      = tuple(
    h.strip() for h in os.environ.get('JWT_AUTH_HEADER_TYPES', 'Bearer').split(',') if h.strip()
)

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':   timedelta(minutes=JWT_ACCESS_MINUTES),
    'REFRESH_TOKEN_LIFETIME':  timedelta(days=JWT_REFRESH_DAYS),
    'ROTATE_REFRESH_TOKENS':   JWT_ROTATE_REFRESH_TOKENS,
    'BLACKLIST_AFTER_ROTATION': JWT_BLACKLIST_AFTER_ROTATION,
    'UPDATE_LAST_LOGIN':       True,
    'ALGORITHM':               JWT_ALGORITHM,
    'SIGNING_KEY':             JWT_SIGNING_KEY,
    'AUTH_HEADER_TYPES':       JWT_AUTH_HEADER_TYPES,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        *(['rest_framework.authentication.SessionAuthentication'] if DEBUG else []),
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 300,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon':  os.environ.get('THROTTLE_ANON',  '120/minute'),
        'user':  os.environ.get('THROTTLE_USER',  '300/minute'),
        'login': os.environ.get('THROTTLE_LOGIN', '10/minute'),
    },
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        *(['rest_framework.renderers.BrowsableAPIRenderer'] if DEBUG else []),
    ],
}


# ═════════════════════════════════════════════════════════════════════════════
#  FAYL YUKLASH CHEGARALARI
# ═════════════════════════════════════════════════════════════════════════════
DATA_UPLOAD_MAX_MEMORY_SIZE = 200 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 10  * 1024 * 1024
MAX_IMAGE_SIZE              = 15  * 1024 * 1024
MAX_VIDEO_SIZE              = 50  * 1024 * 1024
MAX_POST_IMAGES             = env_int('MAX_POST_IMAGES', 10)


# ═════════════════════════════════════════════════════════════════════════════
#  LOGGING
# ═════════════════════════════════════════════════════════════════════════════
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'DEBUG' if DEBUG else 'WARNING')

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '[{levelname}] {asctime} {module} {process:d} — {message}', 'style': '{'},
        'simple':  {'format': '[{levelname}] {message}', 'style': '{'},
    },
    'handlers': {
        'console': {'class': 'logging.StreamHandler', 'formatter': 'verbose'},
    },
    'root': {'handlers': ['console'], 'level': LOG_LEVEL},
    'loggers': {
        'django':            {'handlers': ['console'], 'level': LOG_LEVEL, 'propagate': False},
        'django.security':   {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'django.db.backends': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'daphne':            {'handlers': ['console'], 'level': 'INFO',    'propagate': False},
        'channels':          {'handlers': ['console'], 'level': 'INFO',    'propagate': False},
    },
}