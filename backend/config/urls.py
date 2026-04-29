from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
# Admin panel sozlamalari
admin.site.site_header = "UniLiga — TATU"
admin.site.site_title = "UniLiga Admin"
admin.site.index_title = "Boshqaruv paneli"

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('core.urls')),
     path('api/health/', lambda r: JsonResponse({'status': 'ok'})),

]

# ─── MEDIA FAYLLARNI BERISH ───────────────────────────────────────────────────
# DEBUG=True: Django o'zi beradi (development)
# DEBUG=False + SERVE_MEDIA=True: Docker muhitida Nginx yo'q bo'lganda
if settings.DEBUG or getattr(settings, 'SERVE_MEDIA', False):
    from core.media_views import public_media

    # /media/<path>/ — ommaviy media fayllar (rasm, video)
    # static() o'rniga view ishlatamiz — CORP/CORS headerlarini to'g'ri qo'yadi
    urlpatterns += [
        path('media/<path:file_path>', public_media, name='public-media'),
    ]

    # Static fayllar (CSS, JS) — WhiteNoise boshqarmasa
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
