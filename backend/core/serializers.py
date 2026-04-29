from rest_framework import serializers
from .models import Season, Team, Player, Match, MatchEvent, LeagueTable, Post, PostImage, MatchPlayer, HomeSlide


class HomeSlideSerializer(serializers.ModelSerializer):
    bg = serializers.SerializerMethodField()

    class Meta:
        model  = HomeSlide
        fields = ['id', 'tag', 'h1a', 'h1b', 'h1c', 'desc', 'bg', 'order']

    def get_bg(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class HomeSlideAdminSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = HomeSlide
        fields = ['id', 'tag', 'h1a', 'h1b', 'h1c', 'desc', 'image', 'image_url',
                  'order', 'is_active', 'created_at', 'updated_at']

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Season
        fields = '__all__'


class SeasonArchiveSerializer(serializers.ModelSerializer):
    """Qisqa ko'rinish — arxiv ro'yxatida ishlatiladi."""
    matches_count  = serializers.SerializerMethodField()
    goals_count    = serializers.SerializerMethodField()
    teams_count    = serializers.SerializerMethodField()

    class Meta:
        model  = Season
        fields = ['id','name','is_active','is_archived','start_date','end_date',
                  'weeks_total','created_at','matches_count','goals_count','teams_count']

    def get_matches_count(self, obj):
        return obj.matches.filter(status='finished').count()

    def get_goals_count(self, obj):
        from django.db.models import Count
        from .models import MatchEvent
        return MatchEvent.objects.filter(
            match__season=obj, event_type__in=['goal','penalty']
        ).count()

    def get_teams_count(self, obj):
        return obj.teams.count()


class PlayerSerializer(serializers.ModelSerializer):
    photo_url  = serializers.ReadOnlyField()
    team_name  = serializers.CharField(source='team.name', read_only=True)
    team_color = serializers.CharField(source='team.primary_color', read_only=True)

    class Meta:
        model  = Player
        fields = '__all__'


class TeamSerializer(serializers.ModelSerializer):
    logo_url = serializers.ReadOnlyField()

    class Meta:
        model  = Team
        fields = '__all__'


class MatchEventSerializer(serializers.ModelSerializer):
    team_name  = serializers.CharField(source='team.name', read_only=True)
    team_color = serializers.CharField(source='team.primary_color', read_only=True)

    class Meta:
        model  = MatchEvent
        fields = '__all__'


class MatchSerializer(serializers.ModelSerializer):
    home_team_name   = serializers.CharField(source='home_team.name', read_only=True)
    home_team_short  = serializers.CharField(source='home_team.short_name', read_only=True)
    home_team_logo   = serializers.CharField(source='home_team.logo_url', read_only=True)
    home_team_color  = serializers.CharField(source='home_team.primary_color', read_only=True)
    away_team_name   = serializers.CharField(source='away_team.name', read_only=True)
    away_team_short  = serializers.CharField(source='away_team.short_name', read_only=True)
    away_team_logo   = serializers.CharField(source='away_team.logo_url', read_only=True)
    away_team_color  = serializers.CharField(source='away_team.primary_color', read_only=True)
    season_name      = serializers.CharField(source='season.name', read_only=True)
    events           = MatchEventSerializer(many=True, read_only=True)
    display_minute   = serializers.SerializerMethodField()
    display_extra    = serializers.SerializerMethodField()

    class Meta:
        model  = Match
        fields = '__all__'

    def get_display_minute(self, obj):
        m, _ = obj.get_display_minute()
        return m

    def get_display_extra(self, obj):
        _, e = obj.get_display_minute()
        return e


class MatchListSerializer(serializers.ModelSerializer):
    home_team_name  = serializers.CharField(source='home_team.name', read_only=True)
    home_team_short = serializers.CharField(source='home_team.short_name', read_only=True)
    home_team_logo  = serializers.CharField(source='home_team.logo_url', read_only=True)
    home_team_color = serializers.CharField(source='home_team.primary_color', read_only=True)
    away_team_name  = serializers.CharField(source='away_team.name', read_only=True)
    away_team_short = serializers.CharField(source='away_team.short_name', read_only=True)
    away_team_logo  = serializers.CharField(source='away_team.logo_url', read_only=True)
    away_team_color = serializers.CharField(source='away_team.primary_color', read_only=True)
    display_minute  = serializers.SerializerMethodField()
    display_extra   = serializers.SerializerMethodField()

    class Meta:
        model  = Match
        exclude = []

    def get_display_minute(self, obj):
        m, _ = obj.get_display_minute()
        return m

    def get_display_extra(self, obj):
        _, e = obj.get_display_minute()
        return e


class LeagueTableSerializer(serializers.ModelSerializer):
    team_name  = serializers.CharField(source='team.name', read_only=True)
    team_short = serializers.CharField(source='team.short_name', read_only=True)
    team_logo  = serializers.CharField(source='team.logo_url', read_only=True)
    team_color = serializers.CharField(source='team.primary_color', read_only=True)
    position   = serializers.SerializerMethodField()

    class Meta:
        model  = LeagueTable
        fields = '__all__'

    def get_position(self, obj):
        qs  = LeagueTable.objects.filter(season=obj.season).order_by('-points','-goal_diff','-goals_for')
        ids = list(qs.values_list('id', flat=True))
        return ids.index(obj.id) + 1 if obj.id in ids else 0


class PostSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    images          = serializers.SerializerMethodField()
    video_file_url  = serializers.SerializerMethodField()
    match_info      = serializers.SerializerMethodField()

    class Meta:
        model  = Post
        fields = '__all__'

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        first   = obj.images.first()
        if first and first.image:
            return request.build_absolute_uri(first.image.url) if request else first.image.url
        if obj.cover_image:
            return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url
        return None

    def get_images(self, obj):
        request = self.context.get('request')
        imgs    = []
        for im in obj.images.all():
            if not im.image:
                continue
            imgs.append(request.build_absolute_uri(im.image.url) if request else im.image.url)
        if not imgs and obj.cover_image:
            imgs.append(request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url)
        return imgs

    def get_video_file_url(self, obj):
        if not obj.video_file:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.video_file.url) if request else obj.video_file.url

    def get_match_info(self, obj):
        if not obj.match:
            return None
        m = obj.match
        return {
            'id':         m.id,
            'home_team':  m.home_team.name,
            'away_team':  m.away_team.name,
            'home_score': m.home_score,
            'away_score': m.away_score,
            'status':     m.status,
            'match_date': str(m.match_date),
        }


# ─── Match Center Serializers ─────────────────────────────────────────────────

class MatchPlayerSerializer(serializers.ModelSerializer):
    player_name   = serializers.CharField(source='player.name',          read_only=True)
    player_number = serializers.IntegerField(source='player.number',     read_only=True)
    player_photo  = serializers.CharField(source='player.photo_url',     read_only=True)
    player_pos    = serializers.CharField(source='player.position',      read_only=True)
    team_name     = serializers.CharField(source='team.name',            read_only=True)
    team_color    = serializers.CharField(source='team.primary_color',   read_only=True)
    team_short    = serializers.CharField(source='team.short_name',      read_only=True)

    class Meta:
        model  = MatchPlayer
        fields = '__all__'


class MatchLineupSerializer(serializers.ModelSerializer):
    """Match with full lineup for tactical board."""
    match_players     = MatchPlayerSerializer(many=True, read_only=True)
    home_team_name    = serializers.CharField(source='home_team.name',          read_only=True)
    home_team_color   = serializers.CharField(source='home_team.primary_color', read_only=True)
    home_team_short   = serializers.CharField(source='home_team.short_name',    read_only=True)
    away_team_name    = serializers.CharField(source='away_team.name',          read_only=True)
    away_team_color   = serializers.CharField(source='away_team.primary_color', read_only=True)
    away_team_short   = serializers.CharField(source='away_team.short_name',    read_only=True)

    class Meta:
        model  = Match
        fields = [
            'id', 'home_team', 'away_team',
            'home_team_name', 'home_team_color', 'home_team_short',
            'away_team_name', 'away_team_color', 'away_team_short',
            'home_score', 'away_score', 'status', 'phase',
            'match_date', 'match_time', 'stadium',
            'match_players',
        ]
