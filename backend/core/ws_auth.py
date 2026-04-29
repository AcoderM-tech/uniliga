from __future__ import annotations

from urllib.parse import parse_qs

from asgiref.sync import sync_to_async
from channels.auth import AuthMiddlewareStack
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from rest_framework_simplejwt.authentication import JWTAuthentication


@sync_to_async
def _get_user_from_token(token: str):
    jwt_auth = JWTAuthentication()
    validated = jwt_auth.get_validated_token(token)
    return jwt_auth.get_user(validated)


class JwtQueryAuthMiddleware:
    """
    WebSocket auth middleware:
    - token query param: ?token=<access_token>
    - Falls back to session auth (AuthMiddlewareStack) when token is missing/invalid.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        close_old_connections()

        query = parse_qs(scope.get('query_string', b'').decode())
        token = (query.get('token') or [None])[0]

        if token:
            try:
                scope['user'] = await _get_user_from_token(token)
            except Exception:
                scope['user'] = scope.get('user') or AnonymousUser()

        return await self.inner(scope, receive, send)


def JwtAuthMiddlewareStack(inner):
    return JwtQueryAuthMiddleware(AuthMiddlewareStack(inner))

