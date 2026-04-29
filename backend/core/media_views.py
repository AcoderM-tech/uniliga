from __future__ import annotations

import mimetypes
import os

from django.conf import settings
from django.core.exceptions import SuspiciousFileOperation
from django.http import FileResponse, Http404, HttpResponse
from django.utils._os import safe_join
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


# Rasm formatlarining MIME turlarini to'g'ri belgilash
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/avif', '.avif')


def _add_media_headers(response: HttpResponse, request) -> HttpResponse:
    """
    Media response'ga zarur headerlarni qo'shadi:
    - CORP: cross-origin — img src va video src dan yuklanishi uchun
    - Cache-Control — brauzer keshlasin
    - CORS headers — frontend domain'dan so'ralganda ishlashi uchun
    """
    # Cross-Origin-Resource-Policy: cross-origin
    # Bu header bo'lmasa yoki 'same-origin' bo'lsa — boshqa origin'dan
    # <img src="..."> ishlaMaydi (CORP bloklanadi)
    response['Cross-Origin-Resource-Policy'] = 'cross-origin'

    # Brauzer keshi: 1 soat
    response['Cache-Control'] = 'public, max-age=3600'

    # CORS — Authorization headeri yuborilgan so'rovlar uchun
    origin = request.META.get('HTTP_ORIGIN', '')
    allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])

    if origin in allowed_origins:
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Vary'] = 'Origin'
    elif not origin:
        # Direct so'rov (curl, server-side) — origin tekshiruvsiz
        pass

    # Content sniffing'ni oldini olish
    response['X-Content-Type-Options'] = 'nosniff'

    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def protected_media(request, file_path: str):
    """
    Media fayllarni xavfsiz tarzda beradi.

    - Path traversal hujumidan himoyalangan (safe_join)
    - CORP va CORS headerlarini to'g'ri qo'yadi
    - Kelajakda auth tekshiruvini qo'shish uchun: IsAuthenticated yoki
      custom permission class ishlatish mumkin

    URL: /api/protected-media/<path:file_path>/
    """
    base = getattr(settings, 'PROTECTED_MEDIA_ROOT', None)
    if not base:
        raise Http404

    try:
        full_path = safe_join(str(base), file_path)
    except SuspiciousFileOperation:
        raise Http404

    if not os.path.isfile(full_path):
        raise Http404

    content_type, encoding = mimetypes.guess_type(full_path)
    if not content_type:
        content_type = 'application/octet-stream'

    response = FileResponse(
        open(full_path, 'rb'),
        content_type=content_type,
    )

    _add_media_headers(response, request)

    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def public_media(request, file_path: str):
    """
    MEDIA_ROOT dan ommaviy fayllarni beradi.
    Django DEBUG=False bo'lganda va Nginx/CDN yo'q bo'lganda ishlatiladi.

    URL: /media/<path:file_path>/
    """
    base = getattr(settings, 'MEDIA_ROOT', None)
    if not base:
        raise Http404

    try:
        full_path = safe_join(str(base), file_path)
    except SuspiciousFileOperation:
        raise Http404

    if not os.path.isfile(full_path):
        raise Http404

    content_type, _ = mimetypes.guess_type(full_path)
    if not content_type:
        content_type = 'application/octet-stream'

    response = FileResponse(
        open(full_path, 'rb'),
        content_type=content_type,
    )

    _add_media_headers(response, request)

    return response
