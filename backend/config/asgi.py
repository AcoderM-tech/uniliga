import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 1. Django ilovasini birinchi yuklash
django_asgi_app = get_asgi_application()

# 2. Setupdan keyingi importlar
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator # Validator qo'shildi
from core.ws_auth import JwtAuthMiddlewareStack
from core import routing
from django.conf import settings

def _get_allowed_ws_origins() -> list[str]:
    origins = [
        'https://football.acoderm.uz',
        'https://api-football.acoderm.uz',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ]
    extra = os.environ.get('WS_ALLOWED_ORIGINS', '')
    for o in extra.split(','):
        o = o.strip().rstrip('/')
        if o and o not in origins:
            origins.append(o)
    return origins

# 3. ASGI Application
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator( # Mana, biz kutgan validator
        JwtAuthMiddlewareStack(
            URLRouter(
                routing.websocket_urlpatterns
            )
        )
    ),
})