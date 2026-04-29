from rest_framework import viewsets, status
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.cache import cache
from django.db import transaction
from django.db.models import Q, Count, Max
from django.shortcuts import get_object_or_404
from django.middleware.csrf import get_token
from django.utils import timezone
from datetime import datetime, timedelta
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (
    Season, Team, Player, Match, MatchEvent, LeagueTable, Post, PostImage, MatchPlayer, HomeSlide,
    validate_image_file,
)
from .serializers import (
    SeasonSerializer, TeamSerializer, PlayerSerializer, MatchSerializer,
    MatchListSerializer, MatchEventSerializer, LeagueTableSerializer,
    PostSerializer, SeasonArchiveSerializer,
    HomeSlideSerializer,
    HomeSlideAdminSerializer,
    MatchPlayerSerializer,
    MatchLineupSerializer,
)

LIVE_STATUSES = ('live', 'half_time', 'second_half', 'extra_time')


# ─── WebSocket broadcast ─────────────────────────────────────────────────────

def _invalidate_match_caches(match):
    """
    Gol qo'shilganda / o'chirilganda / o'yin holati o'zgarganda
    bosh sahifa, top futbolchilar va liga jadvali cache-larini tozalaydi.
    """
    try:
        season = match.season
        if not season:
            return
        season_key = str(season.id)
        # Barcha hostlar uchun cache-larni tozalash (wildcard yo'q,
        # shuning uchun har ikki host variantini o'chiramiz)
        for host in ['localhost', 'localhost:8000', '127.0.0.1',
                     '127.0.0.1:8000', 'testserver']:
            cache.delete(f"bosh_sahifa:v3:{host}:{season_key}")
            cache.delete(f"top_futbolchilar:v2:{host}:{season_key}")
            cache.delete(f"top_futbolchilar:v2:{host}:active")
            cache.delete(f"liga_jadvali:v1:{host}:{season_key}")
            cache.delete(f"liga_jadvali:v1:{host}:active")
        # Muhit o'zgaruvchisidan host olish
        import os
        ext_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME', '')
        if ext_host:
            cache.delete(f"bosh_sahifa:v3:{ext_host}:{season_key}")
            cache.delete(f"top_futbolchilar:v2:{ext_host}:{season_key}")
            cache.delete(f"top_futbolchilar:v2:{ext_host}:active")
            cache.delete(f"liga_jadvali:v1:{ext_host}:{season_key}")
    except Exception:
        pass


def broadcast_match(match):
    # Cache-larni tozalash — gol/hodisa qo'shilganda top_futbolchilar yangilansin
    _invalidate_match_caches(match)
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        data = MatchSerializer(match).data
        async_to_sync(channel_layer.group_send)(
            f"match_{match.id}", {"type": "match_update", "data": data}
        )
        async_to_sync(channel_layer.group_send)(
            "live_feed", {"type": "live_update", "data": data}
        )
    except Exception:
        # Redis/ChannelLayer o'chib qolsa ham API yiqilmasin
        pass


def get_active_season():
    return Season.objects.filter(is_active=True).first()


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf(request):
    return Response({'csrfToken': get_token(request)})


# ─── Mavsumlar ────────────────────────────────────────────────────────────────

class SeasonViewSet(viewsets.ModelViewSet):
    # Ommaviy GET — AllowAny; yozish — faqat admin
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    serializer_class = SeasonSerializer

    def get_queryset(self):
        return Season.objects.all().order_by('-start_date')

    @action(detail=False, methods=['get'])
    def faol(self, request):
        season = get_active_season()
        if not season:
            return Response({'xato': 'Faol mavsum topilmadi'}, status=404)
        return Response(SeasonSerializer(season).data)

    @action(detail=True, methods=['post'])
    def faollashtirish(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """Admin: Mavsumni faol qilish."""
        season = self.get_object()
        season.is_active = True
        season.is_archived = False
        season.save()
        return Response(SeasonSerializer(season).data)

    @action(detail=True, methods=['post'])
    def arxivlash(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """Admin: Mavsumni arxivga o'tkazish."""
        season = self.get_object()
        season.arxivlash()
        return Response(SeasonSerializer(season).data)

    @action(detail=True, methods=['get'])
    def arxiv_malumot(self, request, pk=None):
        """Arxivlangan mavsum uchun to'liq ma'lumot: o'yinlar, jadval, statistika, postlar."""
        season = self.get_object()
        matches = Match.objects.filter(season=season).select_related('home_team', 'away_team')
        table   = LeagueTable.objects.filter(season=season).select_related('team').order_by(
            '-points', '-goal_diff', '-goals_for'
        )
        posts   = Post.objects.filter(
            Q(season=season) | Q(match__season=season)
        ).filter(is_published=True).distinct()[:20]
        events  = MatchEvent.objects.filter(match__season=season)

        # Top futbolchilar
        goals_qs   = events.filter(event_type__in=['goal','penalty']).values(
            'player_name','team__name','team__primary_color'
        ).annotate(gollar=Count('id'))
        assists_qs = events.filter(event_type='assist').values(
            'player_name','team__name'
        ).annotate(assistlar=Count('id'))
        assist_map = {(a['player_name'],a['team__name']): a['assistlar'] for a in assists_qs}

        top = sorted([{
            'futbolchi_ism': g['player_name'],
            'jamoa_ism':    g['team__name'],
            'jamoa_rang':   g['team__primary_color'],
            'gollar':       g['gollar'],
            'assistlar':    assist_map.get((g['player_name'], g['team__name']), 0),
            'ball':         g['gollar'] * 3 + assist_map.get((g['player_name'], g['team__name']), 0),
        } for g in goals_qs], key=lambda x: -x['ball'])[:10]

        # Jamoalar — arxivlangan mavsum jamoalari
        jamoalar = Team.objects.filter(season=season).order_by('name')

        return Response({
            'mavsum':          SeasonSerializer(season).data,
            'oyinlar':         MatchListSerializer(matches, many=True).data,
            'jadval':          LeagueTableSerializer(table, many=True).data,
            'top_futbolchilar':top,
            'yangiliklar':     PostSerializer(posts, many=True, context={'request': request}).data,
            'jamoalar':        TeamSerializer(jamoalar, many=True, context={'request': request}).data,
            'stats': {
                'jami_oyinlar':   matches.count(),
                'tugagan_oyinlar':matches.filter(status='finished').count(),
                'jami_gollar':    events.filter(event_type__in=['goal','penalty','own_goal']).count(),
                'jami_jamoalar':  jamoalar.count(),
            }
        })


# ─── Jamoalar ─────────────────────────────────────────────────────────────────

class HomeSlideViewSet(viewsets.ModelViewSet):
    serializer_class = HomeSlideAdminSerializer
    queryset = HomeSlide.objects.all().order_by('order', 'id')

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

class TeamViewSet(viewsets.ModelViewSet):
    # Ommaviy GET — AllowAny; yozish — faqat admin
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    serializer_class = TeamSerializer

    def get_queryset(self):
        qs = Team.objects.all()
        season_id = self.request.query_params.get('mavsum')
        is_admin  = self.request.user.is_authenticated and self.request.user.is_staff

        if season_id:
            qs = qs.filter(season_id=season_id)
        elif is_admin:
            # Admin: faqat faol mavsum jamoalarini ko'rsat
            active = get_active_season()
            if active:
                qs = qs.filter(season=active)
            else:
                qs = qs.none()
        else:
            # Ommaviy: faqat faol mavsum
            active = get_active_season()
            if active:
                qs = qs.filter(season=active)
            else:
                qs = qs.none()
        return qs


# ─── Futbolchilar ─────────────────────────────────────────────────────────────

class PlayerViewSet(viewsets.ModelViewSet):
    # Ommaviy GET — AllowAny; yozish — faqat admin
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    serializer_class = PlayerSerializer

    def get_queryset(self):
        qs = Player.objects.select_related('team').filter(is_active=True)
        team_id   = self.request.query_params.get('jamoa')
        season_id = self.request.query_params.get('mavsum')
        if team_id:
            qs = qs.filter(team_id=team_id)
        if season_id:
            qs = qs.filter(team__season_id=season_id)
        else:
            active = get_active_season()
            if active:
                qs = qs.filter(team__season=active)
            else:
                # No active season — hide all players
                qs = qs.none()
        return qs


# ─── O'yinlar ─────────────────────────────────────────────────────────────────

class MatchViewSet(viewsets.ModelViewSet):
    # Ommaviy GET — AllowAny; yozish — faqat admin
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        return MatchSerializer if self.action == 'retrieve' else MatchListSerializer

    def get_queryset(self):
        qs = Match.objects.select_related('home_team', 'away_team', 'season')
        season_id = self.request.query_params.get('mavsum')
        holat     = self.request.query_params.get('holat')
        hafta     = self.request.query_params.get('hafta')

        if season_id:
            qs = qs.filter(season_id=season_id)
        else:
            # Faqat faol mavsum
            active = get_active_season()
            if active:
                qs = qs.filter(season=active)
            else:
                return qs.none()

        if holat == 'live':
            qs = qs.filter(status__in=LIVE_STATUSES)
        elif holat:
            qs = qs.filter(status=holat)
        if hafta:
            qs = qs.filter(week=hafta)
        return qs

    @action(detail=False, methods=['get'])
    def jonli(self, request):
        qs = self.get_queryset().filter(status__in=LIVE_STATUSES)
        return Response(MatchSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def kelgusi(self, request):
        qs = self.get_queryset().filter(status='upcoming').order_by('match_date', 'match_time')[:6]
        return Response(MatchListSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def oxirgi(self, request):
        qs = self.get_queryset().filter(status='finished').order_by('-match_date', '-match_time')[:5]
        return Response(MatchListSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def boshlanish_xabari(self, request):
        """
        Admin dashboard: vaqti yetgan va hali boshlanmagan o'yinlarni qaytaradi.
        Frontend bu orqali 'O'yin vaqti yetdi!' notifikatsiyasini ko'rsatadi.
        """
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response([], status=403)
        now      = timezone.localtime(timezone.now())
        tz       = timezone.get_current_timezone()
        active   = get_active_season()
        if not active:
            return Response([])
        candidates = Match.objects.filter(
            season=active, status='upcoming', phase='not_started'
        ).select_related('home_team', 'away_team')
        result = []
        for m in candidates:
            start = timezone.make_aware(datetime.combine(m.match_date, m.match_time), tz)
            diff  = (now - start).total_seconds()
            # 0 dan 30 daqiqagacha bo'lsa xabar ber
            if 0 <= diff <= 1800:
                result.append(MatchListSerializer(m).data)
        return Response(result)

    # ── Match lifecycle ────────────────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def boshlash(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """1-yarimni boshlash."""
        match    = self.get_object()
        duration = int(request.data.get('first_half_duration', 45))
        match.status              = 'live'
        match.phase               = 'first_half'
        match.first_half_duration = duration
        match.phase_started_at    = timezone.now()
        match.minute              = 0
        match.extra_minute        = 0
        match.save()
        broadcast_match(match)
        return Response(MatchSerializer(match).data)

    @action(detail=True, methods=['post'])
    def birinchi_yarim_qoshimcha(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """1-yarim qo'shimcha vaqtini belgilash."""
        match       = self.get_object()
        extra       = int(request.data.get('extra', 0))
        match.first_half_extra = extra
        match.save(update_fields=['first_half_extra'])
        broadcast_match(match)
        return Response(MatchSerializer(match).data)

    @action(detail=True, methods=['post'])
    def tanaffus(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """TANAFFUS boshlash."""
        match    = self.get_object()
        duration = int(request.data.get('half_time_duration', 15))
        match.status              = 'half_time'
        match.phase               = 'half_time'
        match.half_time_duration  = duration
        match.half_time_started_at= timezone.now()
        match.phase_started_at    = None
        match.save()
        broadcast_match(match)
        return Response(MatchSerializer(match).data)

    @action(detail=True, methods=['post'])
    def ikkinchi_yarim(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """2-yarimni boshlash."""
        match    = self.get_object()
        duration = int(request.data.get('second_half_duration', 45))
        match.status               = 'second_half'
        match.phase                = 'second_half'
        match.second_half_duration = duration
        match.phase_started_at     = timezone.now()
        match.save()
        broadcast_match(match)
        return Response(MatchSerializer(match).data)

    @action(detail=True, methods=['post'])
    def ikkinchi_yarim_qoshimcha(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """2-yarim qo'shimcha vaqti."""
        match = self.get_object()
        extra = int(request.data.get('extra', 0))
        match.second_half_extra = extra
        match.status            = 'extra_time'
        match.phase             = 'extra_time'
        match.save(update_fields=['second_half_extra', 'status', 'phase'])
        broadcast_match(match)
        return Response(MatchSerializer(match).data)

    @action(detail=True, methods=['post'])
    def tugatish(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        """O'yinni yakunlash."""
        match              = self.get_object()
        match.status       = 'finished'
        match.phase        = 'finished'
        match.phase_started_at = None
        match.save()
        LeagueTable.recalculate(match.season)
        broadcast_match(match)
        return Response(MatchSerializer(match).data)

    @action(detail=True, methods=['patch'])
    def hisob_yangilash(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        match = self.get_object()
        for api_k, model_k, cast in [
            ('home_score', 'home_score', int),
            ('away_score', 'away_score', int),
            ('minute',     'minute',     int),
        ]:
            val = request.data.get(api_k)
            if val is not None:
                setattr(match, model_k, cast(val))
        if request.data.get('status'):
            match.status = request.data['status']
        match.save()
        if match.status == 'finished':
            LeagueTable.recalculate(match.season)
        broadcast_match(match)
        return Response(MatchSerializer(match).data)

    @action(detail=True, methods=['post'])
    def hodisa_qoshish(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        match = self.get_object()
        data  = {**request.data, 'match': match.id}

        ser = MatchEventSerializer(data=data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)

        event_type = ser.validated_data.get('event_type')
        team       = ser.validated_data.get('team')
        minute     = int(ser.validated_data.get('minute') or 0)
        extra      = int(ser.validated_data.get('extra_minute') or 0)

        if not team or team.id not in (match.home_team_id, match.away_team_id):
            return Response({'team': "Jamoa bu o'yinga tegishli emas"}, status=400)
        if minute > 130:
            return Response({'minute': "Daqiqa 0-130 oralig'ida bo'lishi kerak"}, status=400)
        if extra > 30:
            return Response({'extra_minute': "Qo'shimcha daqiqa 0-30 oralig'ida bo'lishi kerak"}, status=400)

        with transaction.atomic():
            event = ser.save()

            if event_type in ('goal', 'penalty'):
                if team.id == match.home_team_id:
                    match.home_score += 1
                else:
                    match.away_score += 1
                match.save(update_fields=['home_score', 'away_score'])
            elif event_type == 'own_goal':
                if team.id == match.home_team_id:
                    match.away_score += 1
                else:
                    match.home_score += 1
                match.save(update_fields=['home_score', 'away_score'])

            assist_name = (event.assist_player or '').strip()
            if assist_name and event_type in ('goal', 'penalty'):
                MatchEvent.objects.create(
                    match=match, minute=event.minute, extra_minute=event.extra_minute,
                    event_type='assist', player_name=assist_name, team=team,
                )

        broadcast_match(match)
        # Request host bilan aniq cache tozalash
        try:
            host = request.get_host()
            season_key = str(match.season_id) if match.season_id else 'active'
            cache.delete(f"bosh_sahifa:v3:{host}:{season_key}")
            cache.delete(f"top_futbolchilar:v2:{host}:{season_key}")
            cache.delete(f"top_futbolchilar:v2:{host}:active")
            cache.delete(f"liga_jadvali:v1:{host}:{season_key}")
        except Exception:
            pass
        return Response(MatchEventSerializer(event).data, status=201)

    @action(detail=True, methods=['post'])
    def hodisa_ochirish(self, request, pk=None):
        if not (request.user.is_authenticated and request.user.is_staff):
            return Response({'xato': 'Ruxsat yo\'q'}, status=status.HTTP_403_FORBIDDEN)
        event_id_raw = request.data.get('hodisa_id')
        try:
            event_id = int(event_id_raw)
        except (TypeError, ValueError):
            return Response({'xato': 'Hodisa ID noto\'g\'ri'}, status=400)
        try:
            match = self.get_object()
            ev    = MatchEvent.objects.get(id=event_id, match=match)

            with transaction.atomic():
                if ev.event_type in ('goal', 'penalty'):
                    if ev.team_id == match.home_team_id:
                        match.home_score = max(0, match.home_score - 1)
                    else:
                        match.away_score = max(0, match.away_score - 1)
                    match.save(update_fields=['home_score', 'away_score'])

                    if ev.assist_player:
                        MatchEvent.objects.filter(
                            match=match,
                            minute=ev.minute,
                            extra_minute=ev.extra_minute,
                            event_type='assist',
                            player_name=ev.assist_player,
                            team_id=ev.team_id,
                        ).delete()

                elif ev.event_type == 'own_goal':
                    if ev.team_id == match.home_team_id:
                        match.away_score = max(0, match.away_score - 1)
                    else:
                        match.home_score = max(0, match.home_score - 1)
                    match.save(update_fields=['home_score', 'away_score'])

                ev.delete()
            broadcast_match(match)
            # Request host bilan aniq cache tozalash
            try:
                host = request.get_host()
                season_key = str(match.season_id) if match.season_id else 'active'
                cache.delete(f"bosh_sahifa:v3:{host}:{season_key}")
                cache.delete(f"top_futbolchilar:v2:{host}:{season_key}")
                cache.delete(f"top_futbolchilar:v2:{host}:active")
                cache.delete(f"liga_jadvali:v1:{host}:{season_key}")
            except Exception:
                pass
            return Response({'muvaffaqiyat': True})
        except MatchEvent.DoesNotExist:
            return Response({'xato': 'Hodisa topilmadi'}, status=404)

    @action(detail=False, methods=['get'])
    def linkable_matches(self, request):
        """Post uchun bog'lanadigan o'yinlar (jonli + postlanmagan tugagan)."""
        qs     = Match.objects.select_related('home_team', 'away_team')
        active = get_active_season()
        if active:
            qs = qs.filter(season=active)
        live     = qs.filter(status__in=LIVE_STATUSES)
        finished = qs.filter(status='finished').filter(Q(posts__isnull=True)).distinct()
        return Response(MatchListSerializer(list(live) + list(finished), many=True).data)


# ─── Liga jadvali ─────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def liga_jadvali(request):
    season_key = (request.query_params.get('mavsum') or '').strip() or 'active'
    cache_key  = f"liga_jadvali:v1:{request.get_host()}:{season_key}"
    cached     = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    season_id = request.query_params.get('mavsum')
    if season_id:
        season = get_object_or_404(Season, pk=season_id)
    else:
        season = get_active_season()
        if not season:
            cache.set(cache_key, [], timeout=settings.CACHE_TTL_TABLE)
            return Response([])
    table = LeagueTable.objects.filter(season=season).select_related('team').order_by(
        '-points', '-goal_diff', '-goals_for'
    )
    data = LeagueTableSerializer(table, many=True).data
    cache.set(cache_key, data, timeout=settings.CACHE_TTL_TABLE)
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def jadval_hisoblash(request):
    season_id = request.data.get('mavsum')
    season    = get_object_or_404(Season, pk=season_id) if season_id else get_active_season()
    if season:
        LeagueTable.recalculate(season)
        return Response({'holat': 'qayta hisoblandi'})
    return Response({'xato': 'mavsum topilmadi'}, status=400)


# ─── Top futbolchilar ─────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def top_futbolchilar(request):
    season_key = (request.query_params.get('mavsum') or '').strip() or 'active'
    cache_key  = f"top_futbolchilar:v2:{request.get_host()}:{season_key}"
    cached     = cache.get(cache_key)
    if cached is not None:
        return Response(cached)

    season_id = request.query_params.get('mavsum')
    if season_id:
        matches = Match.objects.filter(season_id=season_id)
        season_for_photos_id = season_id
    else:
        active  = get_active_season()
        matches = Match.objects.filter(season=active) if active else Match.objects.none()
        season_for_photos_id = active.id if active else None

    events     = MatchEvent.objects.filter(match__in=matches)
    goals_qs   = events.filter(event_type__in=['goal','penalty','own_goal']).values(
        'player_name','team__name','team__primary_color'
    ).annotate(gollar=Count('id'))
    assists_qs = events.filter(event_type='assist').values(
        'player_name','team__name'
    ).annotate(assistlar=Count('id'))

    assist_map = {(a['player_name'], a['team__name']): a['assistlar'] for a in assists_qs}

    player_photos = {}
    if season_for_photos_id:
        for p in Player.objects.filter(team__season_id=season_for_photos_id).select_related('team'):
            player_photos[p.name.lower().strip()] = p.photo_url

    natija = []
    for g in goals_qs:
        ism  = g['player_name']
        rasm = player_photos.get(ism.lower().strip())
        a    = assist_map.get((ism, g['team__name']), 0)
        natija.append({
            'futbolchi_ism': ism,
            'jamoa_ism':    g['team__name'],
            'jamoa_rang':   g['team__primary_color'],
            'gollar':       g['gollar'],
            'assistlar':    a,
            'ball':         g['gollar'] * 3 + a,
            'rasm':         rasm,
        })

    natija.sort(key=lambda x: -x['ball'])
    out = natija[:20]
    cache.set(cache_key, out, timeout=settings.CACHE_TTL_TOP)
    return Response(out)


# ─── Yangiliklar ─────────────────────────────────────────────────────────────

class PostViewSet(viewsets.ModelViewSet):
    # Ommaviy GET — AllowAny; yozish — faqat admin
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    serializer_class = PostSerializer

    def get_queryset(self):
        qs = Post.objects.all().prefetch_related('images').select_related('match', 'season')

        if not (self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(is_published=True)

        season_id = self.request.query_params.get('mavsum')
        if season_id:
            qs = qs.filter(Q(season_id=season_id) | Q(match__season_id=season_id))
        else:
            # Faqat faol mavsum postlari
            active = get_active_season()
            if active:
                qs = qs.filter(Q(season=active) | Q(season__isnull=True, match__season=active) | Q(season__isnull=True, match__isnull=True))
            else:
                # No active season — hide all posts
                qs = qs.none()

        cat = self.request.query_params.get('kategoriya') or self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category=cat)
        return qs

    def create(self, request, *args, **kwargs):
        images = request.FILES.getlist('images')
        if images:
            if len(images) > settings.MAX_POST_IMAGES:
                return Response({'images': f"Maksimum {settings.MAX_POST_IMAGES} ta rasm yuklash mumkin"}, status=400)
            for f in images:
                try:
                    validate_image_file(f)
                except ValidationError as e:
                    return Response({'images': e.messages}, status=400)
        data = {k: v for k, v in request.data.items()}
        if 'images' in data:
            data.pop('images')

        match_id = data.get('match')
        if match_id and not data.get('season'):
            try:
                m = Match.objects.get(pk=match_id)
                data['season'] = m.season_id
            except Match.DoesNotExist:
                pass

        if not data.get('season'):
            active = get_active_season()
            if active:
                data['season'] = active.id

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        post = serializer.instance

        if images:
            for idx, file in enumerate(images):
                PostImage.objects.create(post=post, image=file, order=idx)

        out     = self.get_serializer(post)
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'])
    def tanlangan(self, request):
        active = get_active_season()
        qs     = Post.objects.filter(is_published=True, is_featured=True)
        if active:
            qs = qs.filter(Q(season=active) | Q(season__isnull=True))
        return Response(PostSerializer(qs[:3], many=True, context={'request': request}).data)


# ─── Statistika ───────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAdminUser])
def boshqaruv_statistika(request):
    active  = get_active_season()
    matches = Match.objects.filter(season=active) if active else Match.objects.none()
    return Response({
        'jami_oyinlar':     matches.count(),
        'jonli_oyinlar':    matches.filter(status__in=LIVE_STATUSES).count(),
        'tugagan_oyinlar':  matches.filter(status='finished').count(),
        'kutilgan_oyinlar': matches.filter(status='upcoming').count(),
        'jami_jamoalar':    Team.objects.filter(season=active).count() if active else 0,
        'jami_gollar':      MatchEvent.objects.filter(
            match__in=matches, event_type__in=['goal', 'penalty']
        ).count(),
        'faol_mavsum':      SeasonSerializer(active).data if active else None,
    })


# ─── Bosh sahifa ──────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def bosh_sahifa(request):
    active  = get_active_season()
    season_key = str(active.id) if active else 'none'
    cache_key  = f"bosh_sahifa:v3:{request.get_host()}:{season_key}"

    slides = HomeSlideSerializer(
        HomeSlide.objects.filter(is_active=True).order_by('order', 'id'),
        many=True,
        context={'request': request},
    ).data

    cached = cache.get(cache_key)
    if cached is not None:
        # Slaydlar admin paneldan tez-tez o'zgarishi mumkin — cache'dan tashqarida qaytariladi
        cached_data = dict(cached)
        cached_data['slides'] = slides
        return Response(cached_data)

    matches = (
        Match.objects.filter(season=active).select_related('home_team', 'away_team')
        if active else Match.objects.none()
    )

    jonli   = matches.filter(status__in=LIVE_STATUSES)
    kelgusi = matches.filter(status='upcoming').order_by('match_date', 'match_time')[:4]

    cutoff  = timezone.localdate() - timedelta(days=3)
    oxirgi  = matches.filter(status='finished', match_date__gte=cutoff).order_by('-match_date', '-match_time')[:4]

    jadval  = (
        LeagueTable.objects.filter(season=active).select_related('team')
        .order_by('-points', '-goal_diff', '-goals_for')[:8]
        if active else []
    )

    events     = MatchEvent.objects.filter(match__in=matches)
    goals_qs   = events.filter(event_type__in=['goal','penalty']).values(
        'player_name','team__name','team__primary_color'
    ).annotate(gollar=Count('id'))
    assists_qs = events.filter(event_type='assist').values(
        'player_name','team__name'
    ).annotate(assistlar=Count('id'))
    assist_map = {(a['player_name'],a['team__name']): a['assistlar'] for a in assists_qs}

    player_photos = {}
    if active:
        for p in Player.objects.filter(team__season=active).select_related('team'):
            player_photos[p.name.lower().strip()] = p.photo_url

    top = sorted([{
        'futbolchi_ism': g['player_name'],
        'jamoa_ism':    g['team__name'],
        'jamoa_rang':   g['team__primary_color'],
        'gollar':       g['gollar'],
        'assistlar':    assist_map.get((g['player_name'], g['team__name']), 0),
        'ball':         g['gollar'] * 3 + assist_map.get((g['player_name'], g['team__name']), 0),
        'rasm':         player_photos.get(g['player_name'].lower().strip()),
    } for g in goals_qs], key=lambda x: -x['ball'])[:8]

    yangiliklar = Post.objects.filter(is_published=True).filter(
        Q(season=active) | Q(season__isnull=True, match__season=active) | Q(season__isnull=True, match__isnull=True)
    ).order_by('-created_at').distinct()[:3]

    hafta_soni = (
        active.weeks_total if (active and active.weeks_total)
        else (matches.aggregate(Max('week')).get('week__max') or 0)
    )

    data = {
        'mavsum':          SeasonSerializer(active).data if active else None,
        'stats': {
            'jamoa': Team.objects.filter(season=active).count() if active else 0,
            'hafta': hafta_soni,
            'oyin':  matches.count(),
            'gol':   events.filter(event_type__in=['goal','penalty','own_goal']).count(),
        },
        'slides':          slides,
        'jonli_oyinlar':   MatchSerializer(jonli, many=True).data,
        'kelgusi_oyinlar': MatchListSerializer(kelgusi, many=True).data,
        'oxirgi_oyinlar':  MatchListSerializer(oxirgi, many=True).data,
        'jadval':          LeagueTableSerializer(jadval, many=True).data,
        'top_futbolchilar':top,
        'yangiliklar':     PostSerializer(yangiliklar, many=True, context={'request': request}).data,
    }

    cache_data = dict(data)
    cache_data.pop('slides', None)
    cache.set(cache_key, cache_data, timeout=settings.CACHE_TTL_HOME)
    return Response(data)


# ─── Match Center Views ────────────────────────────────────────────────────────
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def _broadcast_match(match_id, payload):
    """Helper: broadcast to match WebSocket group."""
    try:
        layer = get_channel_layer()
        async_to_sync(layer.group_send)(
            f"match_{match_id}",
            {"type": "match_update", "data": payload}
        )
    except Exception:
        pass


class MatchPlayerViewSet(viewsets.ModelViewSet):
    # Ommaviy GET — AllowAny; yozish — faqat admin
    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [AllowAny()]
        return [IsAdminUser()]

    serializer_class = MatchPlayerSerializer
    queryset = MatchPlayer.objects.select_related('player', 'team', 'match').all()

    def get_queryset(self):
        qs = super().get_queryset()
        match_id = self.request.query_params.get('match')
        if match_id:
            qs = qs.filter(match_id=match_id)
        return qs

    @action(detail=True, methods=['patch'], url_path='position')
    def update_position(self, request, pk=None):
        mp = self.get_object()
        x  = request.data.get('position_x')
        y  = request.data.get('position_y')
        if x is not None: mp.position_x = float(x)
        if y is not None: mp.position_y = float(y)
        mp.save(update_fields=['position_x', 'position_y', 'updated_at'])
        _broadcast_match(mp.match_id, {
            'event': 'POSITION',
            'player_id': mp.id,
            'position_x': mp.position_x,
            'position_y': mp.position_y,
        })
        return Response(MatchPlayerSerializer(mp).data)

    @action(detail=True, methods=['post'], url_path='event')
    def add_event(self, request, pk=None):
        mp      = self.get_object()
        etype   = request.data.get('type', '').upper()
        minute  = request.data.get('minute', mp.match.minute or 0)
        player2 = request.data.get('player2_name', '')  # for sub/assist

        try:
            minute = int(minute)
        except (TypeError, ValueError):
            minute = int(mp.match.minute or 0)
        minute = max(0, min(minute, 130))

        player2 = str(player2 or '').strip()
        if len(player2) > 100:
            player2 = player2[:100]

        VALID = {'GOAL', 'ASSIST', 'YELLOW', 'RED', 'SUB', 'OWN_GOAL'}
        if etype not in VALID:
            return Response({'error': f'Invalid event type. Use: {VALID}'}, status=400)

        # Update player status
        if etype == 'RED':
            mp.status = 'red'
            mp.save(update_fields=['status'])
        elif etype == 'SUB':
            mp.status = 'sub_out'
            mp.save(update_fields=['status'])

        # Create MatchEvent record (+ score update) — atomik
        et_map = {'GOAL':'goal','ASSIST':'assist','YELLOW':'yellow',
                  'RED':'red','SUB':'sub','OWN_GOAL':'own_goal'}
        with transaction.atomic():
            MatchEvent.objects.create(
                match       = mp.match,
                minute      = minute,
                event_type  = et_map.get(etype, 'goal'),
                player_name = mp.player.name,
                player_out  = player2 if etype == 'SUB' else '',
                team        = mp.team,
            )

            if etype in ('GOAL', 'OWN_GOAL'):
                m = mp.match
                if etype == 'GOAL':
                    if mp.team_id == m.home_team_id:
                        m.home_score += 1
                    else:
                        m.away_score += 1
                else:  # own goal
                    if mp.team_id == m.home_team_id:
                        m.away_score += 1
                    else:
                        m.home_score += 1
                m.save(update_fields=['home_score', 'away_score'])

        # Broadcast
        _broadcast_match(mp.match_id, {
            'event': etype,
            'player_id': mp.id,
            'player_name': mp.player.name,
            'team_id': mp.team_id,
            'minute': minute,
            'player2': player2,
            'home_score': mp.match.home_score,
            'away_score': mp.match.away_score,
        })

        return Response({'ok': True, 'event': etype, 'player': mp.player.name})


@api_view(['GET'])
@permission_classes([AllowAny])
def match_lineup(request, match_id):
    """Full lineup for tactical board."""
    match = get_object_or_404(Match, pk=match_id)
    data  = MatchLineupSerializer(match).data
    # Add available players (team members not yet in lineup)
    home_in = set(MatchPlayer.objects.filter(match=match, team=match.home_team).values_list('player_id', flat=True))
    away_in = set(MatchPlayer.objects.filter(match=match, team=match.away_team).values_list('player_id', flat=True))

    data['home_available'] = PlayerSerializer(
        Player.objects.filter(team=match.home_team, is_active=True).exclude(id__in=home_in), many=True
    ).data
    data['away_available'] = PlayerSerializer(
        Player.objects.filter(team=match.away_team, is_active=True).exclude(id__in=away_in), many=True
    ).data
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_player_to_match(request, match_id):
    """Add a player to match lineup."""
    match     = get_object_or_404(Match, pk=match_id)
    player_id = request.data.get('player_id')
    team_id   = request.data.get('team_id')
    is_starter= request.data.get('is_starter', True)
    pos_x     = request.data.get('position_x', 50.0)
    pos_y     = request.data.get('position_y', 50.0)

    if isinstance(is_starter, str):
        is_starter = is_starter.strip().lower() not in ('0', 'false', 'no', 'off')
    else:
        is_starter = bool(is_starter)

    try:
        pos_x = float(pos_x)
    except (TypeError, ValueError):
        pos_x = 50.0
    try:
        pos_y = float(pos_y)
    except (TypeError, ValueError):
        pos_y = 50.0
    pos_x = max(0.0, min(pos_x, 100.0))
    pos_y = max(0.0, min(pos_y, 100.0))

    player = get_object_or_404(Player, pk=player_id)
    team   = get_object_or_404(Team,   pk=team_id)

    if team not in (match.home_team, match.away_team):
        return Response({'error': 'Team not in this match'}, status=400)

    mp, created = MatchPlayer.objects.get_or_create(
        player=player, match=match,
        defaults={
            'team': team, 'is_starter': is_starter,
            'position_x': pos_x, 'position_y': pos_y,
            'shirt_number': player.number or 0,
        }
    )
    if not created:
        return Response({'error': 'Player already in lineup'}, status=400)

    _broadcast_match(match_id, {
        'event': 'PLAYER_ADDED',
        'player': MatchPlayerSerializer(mp).data,
    })
    return Response(MatchPlayerSerializer(mp).data, status=201)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def apply_formation(request, match_id):
    """Apply a formation preset to a team's lineup."""
    match      = get_object_or_404(Match, pk=match_id)
    team_id    = request.data.get('team_id')
    formation  = request.data.get('formation', '4-4-2')

    try:
        team_id_int = int(team_id)
    except (TypeError, ValueError):
        return Response({'error': 'team_id is required'}, status=400)

    if team_id_int not in (match.home_team_id, match.away_team_id):
        return Response({'error': 'Team not in this match'}, status=400)

    team_id = team_id_int
    is_home = (team_id == match.home_team_id)

    # Formation templates: (x%, y%) — home team plays bottom→top, away top→bottom
    # Home team: bottom half (y: 60-92), Away team gets y flipped (100-y)
    FORMATIONS = {
        '4-4-2': [
            (50, 91),                                             # GK
            (12,74),(33,72),(67,72),(88,74),                      # DEF
            (12,57),(35,55),(65,55),(88,57),                      # MID
            (33,38),(67,38),                                      # FWD
        ],
        '4-3-3': [
            (50, 91),
            (12,74),(33,72),(67,72),(88,74),
            (22,55),(50,52),(78,55),
            (18,34),(50,30),(82,34),
        ],
        '3-5-2': [
            (50, 91),
            (22,74),(50,72),(78,74),
            (8,57),(27,55),(50,52),(73,55),(92,57),
            (35,34),(65,34),
        ],
        '4-2-3-1': [
            (50, 91),
            (12,74),(33,72),(67,72),(88,74),
            (30,58),(70,58),
            (12,44),(50,41),(88,44),
            (50,28),
        ],
        '5-3-2': [
            (50, 91),
            (5,74),(23,73),(50,72),(77,73),(95,74),
            (22,55),(50,52),(78,55),
            (35,34),(65,34),
        ],
    }

    positions = FORMATIONS.get(formation, FORMATIONS['4-4-2'])

    # Flip Y for away team
    if not is_home:
        positions = [(x, 100 - y) for x, y in positions]

    players = MatchPlayer.objects.filter(
        match=match, team_id=team_id, is_starter=True
    ).order_by('shirt_number', 'id')

    updated = []
    to_update = []
    for i, mp in enumerate(players[:11]):
        if i < len(positions):
            mp.position_x, mp.position_y = positions[i]
            to_update.append(mp)
            updated.append({'id': mp.id, 'position_x': mp.position_x, 'position_y': mp.position_y})
    if to_update:
        MatchPlayer.objects.bulk_update(to_update, ['position_x', 'position_y'])

    _broadcast_match(match_id, {
        'event': 'FORMATION',
        'team_id': team_id,
        'formation': formation,
        'positions': updated,
    })
    return Response({'ok': True, 'formation': formation, 'updated': len(updated)})