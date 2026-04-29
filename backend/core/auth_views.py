from __future__ import annotations

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.contrib.auth import authenticate

from .throttles import LoginRateThrottle


def _set_refresh_cookie(response: Response, refresh: str) -> None:
    max_age = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
    response.set_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        refresh,
        max_age=max_age,
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        domain=settings.JWT_COOKIE_DOMAIN,
        path=settings.JWT_COOKIE_PATH,
    )


def _delete_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        settings.JWT_REFRESH_COOKIE_NAME,
        domain=settings.JWT_COOKIE_DOMAIN,
        path=settings.JWT_COOKIE_PATH,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def token_obtain(request):
    """
    Admin token login.
    - Access token: JSON response
    - Refresh token: HttpOnly cookie
    """
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''
    if not username or not password:
        return Response({'detail': 'username va password majburiy'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if not user or not user.is_staff:
        return Response({'detail': "Login yoki parol noto'g'ri, yoki admin huquqi yo'q"}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    access  = str(refresh.access_token)

    resp = Response({
        'access': access,
        'user': {
            'username': user.username,
            'full_name': user.get_full_name() or user.username,
            'is_staff': bool(user.is_staff),
            'is_superuser': bool(getattr(user, 'is_superuser', False)),
        }
    })
    _set_refresh_cookie(resp, str(refresh))
    return resp


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    refresh_cookie = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
    if not refresh_cookie:
        return Response({'detail': 'Refresh token topilmadi'}, status=status.HTTP_401_UNAUTHORIZED)

    ser = TokenRefreshSerializer(data={'refresh': refresh_cookie})
    try:
        ser.is_valid(raise_exception=True)
    except Exception:
        resp = Response({'detail': 'Refresh token yaroqsiz'}, status=status.HTTP_401_UNAUTHORIZED)
        _delete_refresh_cookie(resp)
        return resp

    data = ser.validated_data
    resp = Response({'access': data['access']})
    if 'refresh' in data:
        _set_refresh_cookie(resp, data['refresh'])
    return resp


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    refresh_cookie = request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
    if refresh_cookie:
        try:
            RefreshToken(refresh_cookie).blacklist()
        except Exception:
            # blacklist ixtiyoriy; xato bo'lsa ham cookie o'chadi
            pass

    resp = Response({'ok': True})
    _delete_refresh_cookie(resp)
    return resp


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({
        'username': u.username,
        'full_name': u.get_full_name() or u.username,
        'is_staff': bool(getattr(u, 'is_staff', False)),
        'is_superuser': bool(getattr(u, 'is_superuser', False)),
    })

