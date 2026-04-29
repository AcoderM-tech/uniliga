from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Season, Team, Player, Match, MatchEvent,
    LeagueTable, Post, PostImage, MatchPlayer, HomeSlide
)


# ─── Inline classes ───────────────────────────────────────────────────────────

class MatchEventInline(admin.TabularInline):
    model  = MatchEvent
    extra  = 0
    fields = ['minute', 'extra_minute', 'event_type', 'player_name',
              'assist_player', 'player_out', 'team']


class MatchPlayerInline(admin.TabularInline):
    model         = MatchPlayer
    extra         = 0
    fields        = ('player', 'team', 'is_starter', 'shirt_number',
                     'status', 'position_x', 'position_y')
    raw_id_fields = ('player',)


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0


# ─── Model admins ─────────────────────────────────────────────────────────────

@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display  = ['name', 'is_active', 'is_archived', 'start_date', 'end_date']
    list_filter   = ['is_active', 'is_archived']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display  = ['name', 'short_name', 'season', 'faculty', 'primary_color']
    list_filter   = ['season']
    search_fields = ['name']


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display  = ['name', 'team', 'number', 'position', 'is_active']
    list_filter   = ['team', 'is_active']
    search_fields = ['name']


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display    = ['__str__', 'match_date', 'match_time', 'status',
                       'phase', 'home_score', 'away_score', 'week']
    list_filter     = ['season', 'status', 'phase']
    list_editable   = ['status']
    inlines         = [MatchEventInline, MatchPlayerInline]
    readonly_fields = ['phase_started_at', 'half_time_started_at',
                       'created_at', 'updated_at']
    fieldsets = [
        ('Match Info',    {'fields': ['season', 'home_team', 'away_team',
                                      'match_date', 'match_time', 'stadium', 'week']}),
        ('Score & Status',{'fields': ['status', 'phase', 'home_score', 'away_score',
                                      'minute', 'extra_minute']}),
        ('Phase Durations',{'fields': [
            'first_half_duration', 'first_half_extra',
            'half_time_duration',
            'second_half_duration', 'second_half_extra',
        ]}),
        ('Timer Tracking',{'fields': ['phase_started_at', 'half_time_started_at'],
                           'classes': ['collapse']}),
        ('Timestamps',    {'fields': ['created_at', 'updated_at'],
                           'classes': ['collapse']}),
    ]


@admin.register(MatchEvent)
class MatchEventAdmin(admin.ModelAdmin):
    list_display  = ['match', 'minute', 'extra_minute', 'event_type',
                     'player_name', 'assist_player', 'team']
    list_filter   = ['event_type', 'match__season']
    search_fields = ['player_name']


@admin.register(MatchPlayer)
class MatchPlayerAdmin(admin.ModelAdmin):
    list_display  = ('player', 'match', 'team', 'is_starter', 'status', 'shirt_number')
    list_filter   = ('match', 'team', 'is_starter', 'status')
    search_fields = ('player__name', 'match__home_team__name', 'match__away_team__name')


@admin.register(LeagueTable)
class LeagueTableAdmin(admin.ModelAdmin):
    list_display = ['team', 'season', 'played', 'won', 'drawn', 'lost',
                    'goals_for', 'goals_against', 'goal_diff', 'points']
    list_filter  = ['season']


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display    = ['title', 'category', 'match', 'is_published',
                       'is_featured', 'created_at']
    list_filter     = ['category', 'is_published', 'is_featured']
    list_editable   = ['is_published', 'is_featured']
    search_fields   = ['title']
    inlines         = [PostImageInline]
    raw_id_fields   = ['match']


@admin.register(HomeSlide)
class HomeSlideAdmin(admin.ModelAdmin):
    list_display  = ['tag', 'order', 'is_active', 'preview']
    list_display_links = ['tag']
    list_filter   = ['is_active']
    list_editable = ['order', 'is_active']
    search_fields = ['tag', 'h1a', 'h1b', 'h1c', 'desc']
    ordering      = ['order', 'id']

    def preview(self, obj):
        if not obj.image:
            return '—'
        return format_html(
            '<img src="{}" style="height:36px;width:72px;object-fit:cover;border-radius:6px;border:1px solid #ddd;" />',
            obj.image.url,
        )

    preview.short_description = 'Rasm'
