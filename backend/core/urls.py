from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth_views
from . import media_views

router = DefaultRouter()
router.register(r'mavsumlar',    views.SeasonViewSet,  basename='mavsum')
router.register(r'jamoalar',     views.TeamViewSet,    basename='jamoa')
router.register(r'futbolchilar', views.PlayerViewSet,  basename='futbolchi')
router.register(r'oyinlar',      views.MatchViewSet,   basename='oyin')
router.register(r'yangiliklar',  views.PostViewSet,    basename='yangilik')
router.register(r'match-players', views.MatchPlayerViewSet, basename='match-player')
router.register(r'home-slides',  views.HomeSlideViewSet, basename='home-slide')

# Moslik uchun
router.register(r'seasons', views.SeasonViewSet,  basename='season-compat')
router.register(r'teams',   views.TeamViewSet,    basename='team-compat')
router.register(r'matches', views.MatchViewSet,   basename='match-compat')
router.register(r'posts',   views.PostViewSet,    basename='post-compat')

urlpatterns = [
    path('', include(router.urls)),
    path('jadval/',           views.liga_jadvali,         name='liga-jadvali'),
    path('jadval/hisoblash/', views.jadval_hisoblash,     name='jadval-hisoblash'),
    path('table/',            views.liga_jadvali,         name='table-compat'),
    path('top-futbolchilar/', views.top_futbolchilar,     name='top-futbolchilar'),
    path('top-scorers/',      views.top_futbolchilar,     name='top-scorers-compat'),
    path('statistika/',       views.boshqaruv_statistika, name='statistika'),
    path('dashboard/stats/',  views.boshqaruv_statistika, name='dashboard-stats-compat'),
    path('bosh-sahifa/',      views.bosh_sahifa,          name='bosh-sahifa'),
    path('homepage/',         views.bosh_sahifa,          name='homepage-compat'),
    path('csrf/',             views.csrf,                 name='csrf'),
    path('oyinlar/<int:match_id>/lineup/',      views.match_lineup,        name='match-lineup'),
    path('oyinlar/<int:match_id>/add-player/',  views.add_player_to_match, name='match-add-player'),
    path('oyinlar/<int:match_id>/formation/',   views.apply_formation,     name='match-formation'),


    # JWT auth (admin panel)
    path('auth/token/',           auth_views.token_obtain,  name='token-obtain'),
    path('auth/token/refresh/',   auth_views.token_refresh, name='token-refresh'),
    path('auth/logout/',          auth_views.logout_view,   name='auth-logout'),
    path('auth/me/',              auth_views.me,            name='auth-me'),

    # Protected media (admin-only)
    path('protected-media/<path:file_path>/',  media_views.protected_media, name='protected-media'),
]
