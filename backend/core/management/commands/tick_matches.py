"""
Management command: python manage.py tick_matches
Run this in a background process to broadcast live match timer ticks
every 30 seconds so connected clients stay in sync.
"""
import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from core.models import Match
from core.serializers import MatchSerializer

LIVE_PHASES = ('first_half', 'second_half', 'extra_time')


class Command(BaseCommand):
    help = 'Broadcasts live match timer ticks via WebSocket every 30s'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting match tick broadcaster...')
        channel_layer = get_channel_layer()
        while True:
            try:
                live_matches = Match.objects.filter(
                    phase__in=LIVE_PHASES
                ).select_related('home_team', 'away_team', 'season').prefetch_related('events')

                for match in live_matches:
                    data = MatchSerializer(match).data
                    async_to_sync(channel_layer.group_send)(
                        f"match_{match.id}", {"type": "match_update", "data": data}
                    )
                    async_to_sync(channel_layer.group_send)(
                        "live_feed", {"type": "live_update", "data": data}
                    )

                if live_matches.exists():
                    self.stdout.write(f'Ticked {live_matches.count()} live matches')
            except Exception as e:
                self.stderr.write(f'Tick error: {e}')

            time.sleep(30)
