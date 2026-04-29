"""
Management command: python manage.py auto_finish_matches

O'tgan kunga tegishli 'upcoming' va 'live' o'yinlarni avtomatik
'finished' holatiga o'tkazadi va jadval statistikasini qayta hisoblaydi.

Ishlatish:
  # Bir marta ishlatish
  python manage.py auto_finish_matches

  # Har kuni avtomatik (crontab):
  0 2 * * * cd /app && python manage.py auto_finish_matches >> /var/log/auto_finish.log 2>&1
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from core.models import Match, LeagueTable


class Command(BaseCommand):
    help = "O'tgan kundagi yakunlanmagan o'yinlarni avtomatik 'finished' qiladi"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help="Haqiqatda o'zgartirmasdan faqat hisobot chiqar",
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        today = timezone.localdate()   # Asia/Tashkent bo'yicha bugungi sana

        # Kechagi va undan oldingi yakunlanmagan o'yinlar
        pending = Match.objects.filter(
            match_date__lt=today,   # bugundan oldingi sanalar
        ).exclude(
            status='finished',
        ).exclude(
            status='cancelled',
        ).select_related('season', 'home_team', 'away_team')

        count = pending.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS("✓ Yakunlanmagan o'yin yo'q."))
            return

        self.stdout.write(
            f"{'[DRY-RUN] ' if dry_run else ''}"
            f"{count} ta o'yinni 'finished' qilish..."
        )

        affected_seasons = set()

        with transaction.atomic():
            for match in pending:
                self.stdout.write(
                    f"  [{match.match_date}] {match.home_team} {match.home_score}–"
                    f"{match.away_score} {match.away_team}  (holat: {match.status})"
                )
                if not dry_run:
                    match.status = 'finished'
                    match.phase  = 'finished'
                    match.save(update_fields=['status', 'phase', 'updated_at'])
                    affected_seasons.add(match.season)

            # Jadval statistikasini qayta hisoblash
            if not dry_run:
                for season in affected_seasons:
                    LeagueTable.recalculate(season)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  ✓ '{season}' mavsum jadvali qayta hisoblandi."
                        )
                    )

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"[DRY-RUN] {count} ta o'yin o'zgartirilmadi (--dry-run rejim)."
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"✓ {count} ta o'yin muvaffaqiyatli yakunlandi."
            ))