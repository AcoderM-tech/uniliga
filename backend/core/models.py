from django.db import models
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.conf import settings

def validate_image_file(value):
    """Rasm fayl turi va hajmini tekshirish."""
    allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
    if ext not in allowed:
        raise ValidationError(f'Faqat {", ".join(allowed)} formatlar ruxsat etilgan.')
    max_size = getattr(settings, 'MAX_IMAGE_SIZE', 5 * 1024 * 1024)
    if value.size > max_size:
        raise ValidationError(f'Rasm hajmi {max_size // 1024 // 1024} MB dan oshmasligi kerak.')

def validate_video_file(value):
    """Video fayl turi va hajmini tekshirish."""
    allowed = ['mp4', 'webm', 'ogg', 'mov']
    ext = value.name.rsplit('.', 1)[-1].lower() if '.' in value.name else ''
    if ext not in allowed:
        raise ValidationError(f'Faqat {", ".join(allowed)} formatlar ruxsat etilgan.')
    max_size = getattr(settings, 'MAX_VIDEO_SIZE', 50 * 1024 * 1024)
    if value.size > max_size:
        raise ValidationError(f'Video hajmi {max_size // 1024 // 1024} MB dan oshmasligi kerak.')

from django.db.models import Count, Q
import secrets


class Season(models.Model):
    name        = models.CharField(max_length=50, verbose_name="Mavsum nomi")
    is_active   = models.BooleanField(default=False, verbose_name="Faol mavsum")
    is_archived = models.BooleanField(default=False, verbose_name="Arxivlangan")
    start_date  = models.DateField(verbose_name="Boshlanish sanasi")
    end_date    = models.DateField(verbose_name="Tugash sanasi")
    weeks_total = models.PositiveIntegerField(default=0, verbose_name="Haftalar soni")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']
        verbose_name = "Mavsum"
        verbose_name_plural = "Mavsumlar"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.is_active:
            Season.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def arxivlash(self):
        """Mavsumni arxivga o'tkazish — faollikni o'chiradi."""
        self.is_active = False
        self.is_archived = True
        self.save(update_fields=['is_active', 'is_archived'])


class Team(models.Model):
    name            = models.CharField(max_length=100, verbose_name="Jamoa nomi")
    short_name      = models.CharField(max_length=10, verbose_name="Qisqa nomi")
    faculty         = models.CharField(max_length=150, blank=True, verbose_name="Fakultet")
    logo            = models.ImageField(upload_to='teams/', blank=True, null=True, validators=[validate_image_file], verbose_name="Logotip")
    primary_color   = models.CharField(max_length=7, default='#cc1a2e', verbose_name="Asosiy rang")
    secondary_color = models.CharField(max_length=7, default='#060810', verbose_name="Ikkinchi rang")
    season          = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='teams', verbose_name="Mavsum")
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Jamoa"
        verbose_name_plural = "Jamoalar"

    def __str__(self):
        return self.name

    @property
    def logo_url(self):
        return self.logo.url if self.logo else None


class Player(models.Model):
    name       = models.CharField(max_length=100, verbose_name="Ism Familiya")
    team       = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='players', verbose_name="Jamoa")
    photo      = models.ImageField(upload_to='players/', blank=True, null=True, validators=[validate_image_file], verbose_name="Rasm")
    number     = models.PositiveIntegerField(default=0, verbose_name="Raqam")
    position   = models.CharField(max_length=30, blank=True, verbose_name="Mavqe")
    is_active  = models.BooleanField(default=True, verbose_name="Faol")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Futbolchi"
        verbose_name_plural = "Futbolchilar"

    def __str__(self):
        return f"{self.name} ({self.team.name})"

    @property
    def photo_url(self):
        return self.photo.url if self.photo else None


class Match(models.Model):
    STATUS_CHOICES = [
        ('upcoming',    'Kutilmoqda'),
        ('live',        'Jonli'),
        ('half_time',   'Tanaffus'),
        ('second_half', 'Ikkinchi yarim'),
        ('extra_time',  "Qo'shimcha vaqt"),
        ('finished',    'Tugagan'),
    ]

    PHASE_CHOICES = [
        ('not_started', 'Boshlanmagan'),
        ('first_half',  'Birinchi yarim'),
        ('half_time',   'Tanaffus'),
        ('second_half', 'Ikkinchi yarim'),
        ('extra_time',  "Qo'shimcha vaqt"),
        ('finished',    'Tugagan'),
    ]

    season      = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='matches', verbose_name="Mavsum")
    home_team   = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='home_matches', verbose_name="Uy jamoasi")
    away_team   = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='away_matches', verbose_name="Mehmon jamoasi")
    match_date  = models.DateField(verbose_name="Sana")
    match_time  = models.TimeField(verbose_name="Vaqt")
    stadium     = models.CharField(max_length=100, default='TATU Maydon', verbose_name="Stadium")
    week        = models.PositiveIntegerField(default=1, verbose_name="Hafta")

    status      = models.CharField(max_length=15, choices=STATUS_CHOICES, default='upcoming', verbose_name="Holat")
    phase       = models.CharField(max_length=15, choices=PHASE_CHOICES, default='not_started', verbose_name="Faza")

    home_score  = models.PositiveIntegerField(default=0, verbose_name="Uy gollari")
    away_score  = models.PositiveIntegerField(default=0, verbose_name="Mehmon gollari")

    minute       = models.PositiveIntegerField(default=0, verbose_name="Daqiqa")
    extra_minute = models.PositiveIntegerField(default=0, verbose_name="Qo'shimcha daqiqa")

    first_half_duration  = models.PositiveIntegerField(default=45, verbose_name="1-yarim davomiyligi")
    first_half_extra     = models.PositiveIntegerField(default=0,  verbose_name="1-yarim qo'shimcha")
    half_time_duration   = models.PositiveIntegerField(default=15, verbose_name="Tanaffus davomiyligi")
    second_half_duration = models.PositiveIntegerField(default=45, verbose_name="2-yarim davomiyligi")
    second_half_extra    = models.PositiveIntegerField(default=0,  verbose_name="2-yarim qo'shimcha")

    phase_started_at     = models.DateTimeField(null=True, blank=True, verbose_name="Faza boshlangan vaqt")
    half_time_started_at = models.DateTimeField(null=True, blank=True, verbose_name="Tanaffus boshlangan vaqt")

    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-match_date', '-match_time']
        indexes = [
            models.Index(fields=['season', 'status']),
            models.Index(fields=['season', 'match_date']),
            models.Index(fields=['status']),
            models.Index(fields=['week', 'season']),
        ]
        verbose_name = "O'yin"
        verbose_name_plural = "O'yinlar"

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} ({self.match_date})"

    def get_display_minute(self):
        from django.utils import timezone
        if self.phase == 'not_started':
            return 0, 0
        if self.phase == 'finished':
            base = self.first_half_duration + self.second_half_duration
            return base + self.second_half_extra, 0
        if not self.phase_started_at:
            return self.minute, self.extra_minute
        now = timezone.now()
        elapsed = int((now - self.phase_started_at).total_seconds() / 60)
        if self.phase == 'first_half':
            cap = self.first_half_duration
            if elapsed <= cap:
                return min(elapsed, cap), 0
            else:
                return cap, min(elapsed - cap, self.first_half_extra if self.first_half_extra else 5)
        if self.phase == 'half_time':
            return self.first_half_duration + (self.first_half_extra or 0), 0
        if self.phase == 'second_half':
            base = self.first_half_duration + (self.first_half_extra or 0)
            cap2 = self.second_half_duration
            cur = base + min(elapsed, cap2)
            if elapsed <= cap2:
                return cur, 0
            else:
                return base + cap2, min(elapsed - cap2, self.second_half_extra if self.second_half_extra else 5)
        if self.phase == 'extra_time':
            base = self.first_half_duration + (self.first_half_extra or 0) + self.second_half_duration
            return base + self.second_half_extra, 0
        return self.minute, self.extra_minute


class MatchEvent(models.Model):
    EVENT_CHOICES = [
        ('goal',     'Gol'),
        ('assist',   'Assist'),
        ('yellow',   'Sariq karta'),
        ('red',      'Qizil karta'),
        ('sub',      'Almashtirish'),
        ('own_goal', "O'z goli"),
        ('penalty',  'Penalti'),
    ]

    match         = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='events', verbose_name="O'yin")
    minute        = models.PositiveIntegerField(verbose_name="Daqiqa")
    extra_minute  = models.PositiveIntegerField(default=0, verbose_name="Qo'shimcha daqiqa")
    event_type    = models.CharField(max_length=15, choices=EVENT_CHOICES, verbose_name="Hodisa turi")
    player_name   = models.CharField(max_length=100, verbose_name="Futbolchi")
    player_out    = models.CharField(max_length=100, blank=True, verbose_name="Chiquvchi futbolchi")
    assist_player = models.CharField(max_length=100, blank=True, verbose_name="Assist bergan futbolchi")
    team          = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='events', verbose_name="Jamoa")
    description   = models.CharField(max_length=200, blank=True, verbose_name="Izoh")

    class Meta:
        ordering = ['minute', 'extra_minute']
        indexes = [
            models.Index(fields=['match', 'minute', 'extra_minute']),
            models.Index(fields=['match', 'event_type']),
            models.Index(fields=['team', 'event_type']),
        ]
        verbose_name = "O'yin hodisasi"
        verbose_name_plural = "O'yin hodisalari"

    def __str__(self):
        extra = f"+{self.extra_minute}" if self.extra_minute else ""
        return f"{self.minute}'{extra} {self.event_type} - {self.player_name}"


class LeagueTable(models.Model):
    season        = models.ForeignKey(Season, on_delete=models.CASCADE, related_name='table')
    team          = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='standings')
    played        = models.IntegerField(default=0)
    won           = models.IntegerField(default=0)
    drawn         = models.IntegerField(default=0)
    lost          = models.IntegerField(default=0)
    goals_for     = models.IntegerField(default=0)
    goals_against = models.IntegerField(default=0)
    goal_diff     = models.IntegerField(default=0)
    points        = models.IntegerField(default=0)
    form          = models.CharField(max_length=10, default='')

    class Meta:
        ordering = ['-points', '-goal_diff', '-goals_for']
        unique_together = ['season', 'team']
        verbose_name = "Liga jadvali"
        verbose_name_plural = "Liga jadvali"

    def __str__(self):
        return f"{self.team.name}: {self.points} ball"

    @classmethod
    def recalculate(cls, season):
        teams = Team.objects.filter(season=season)
        for team in teams:
            entry, _ = cls.objects.get_or_create(season=season, team=team)
            finished = Match.objects.filter(
                season=season, status='finished'
            ).filter(Q(home_team=team) | Q(away_team=team))
            played = won = drawn = lost = gf = ga = 0
            form_list = []
            for m in finished.order_by('match_date', 'match_time'):
                played += 1
                if m.home_team == team:
                    gf += m.home_score; ga += m.away_score
                    if m.home_score > m.away_score:    won += 1;   form_list.append('W')
                    elif m.home_score == m.away_score: drawn += 1; form_list.append('D')
                    else:                              lost += 1;  form_list.append('L')
                else:
                    gf += m.away_score; ga += m.home_score
                    if m.away_score > m.home_score:    won += 1;   form_list.append('W')
                    elif m.away_score == m.home_score: drawn += 1; form_list.append('D')
                    else:                              lost += 1;  form_list.append('L')
            entry.played = played; entry.won = won; entry.drawn = drawn; entry.lost = lost
            entry.goals_for = gf; entry.goals_against = ga
            entry.goal_diff = gf - ga
            entry.points = won * 3 + drawn
            entry.form = ''.join(form_list[-5:])
            entry.save()


class Post(models.Model):
    CATEGORY_CHOICES = [
        ('news',      'Yangilik'),
        ('report',    "O'yin hisoboti"),
        ('highlight', 'Taqdimot'),
        ('transfer',  'Transfer'),
        ('award',     'Mukofot'),
    ]

    title        = models.CharField(max_length=200, verbose_name="Sarlavha")
    slug         = models.SlugField(unique=True)
    category     = models.CharField(max_length=15, choices=CATEGORY_CHOICES, default='news', verbose_name="Kategoriya")
    content      = models.TextField(verbose_name="Matn")
    excerpt      = models.TextField(max_length=300, blank=True, verbose_name="Qisqacha")
    cover_image  = models.ImageField(upload_to='posts/', blank=True, null=True, validators=[validate_image_file], verbose_name="Muqova rasmi")
    video_file   = models.FileField(upload_to='posts/videos/', blank=True, null=True, validators=[validate_video_file], verbose_name="Video fayl")
    video_url    = models.URLField(blank=True, null=True, verbose_name="YouTube video URL")
    is_published = models.BooleanField(default=True, verbose_name="Chop etilgan")
    is_featured  = models.BooleanField(default=False, verbose_name="Tanlangan")
    # Mavsum va o'yin bilan bog'liq
    season       = models.ForeignKey(Season, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='posts', verbose_name="Mavsum")
    match        = models.ForeignKey(Match, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='posts', verbose_name="Bog'liq o'yin")
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_published', 'season']),
            models.Index(fields=['category', 'is_published']),
            models.Index(fields=['-created_at']),
        ]
        verbose_name = "Yangilik"
        verbose_name_plural = "Yangiliklar"

    def __str__(self):
        return self.title


class PostImage(models.Model):
    post       = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='images', verbose_name="Post")
    image      = models.ImageField(upload_to='posts/images/', validators=[validate_image_file], verbose_name="Rasm")
    order      = models.PositiveIntegerField(default=0, verbose_name="Tartib")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = "Post rasmi"
        verbose_name_plural = "Post rasmlari"

    def __str__(self):
        return f"{self.post_id}#{self.order}"


class HomeSlide(models.Model):
    tag   = models.CharField(max_length=60, verbose_name="Tag (kichik sarlavha)")
    h1a   = models.CharField(max_length=60, blank=True, null=True, verbose_name="Katta matn (1-qism)")
    h1b   = models.CharField(max_length=60, verbose_name="Katta matn (2-qism)")
    h1c   = models.CharField(max_length=60, verbose_name="Katta matn (3-qism)")
    desc  = models.TextField(blank=True, verbose_name="Kichik matn (tagida)")
    image = models.ImageField(
        upload_to='home_slides/',
        validators=[validate_image_file],
        blank=True,
        null=True,
        verbose_name="Slayd rasmi",
    )

    order     = models.PositiveIntegerField(default=0, verbose_name="Tartib")
    is_active = models.BooleanField(default=True, verbose_name="Faol")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = "Bosh sahifa slaydi"
        verbose_name_plural = "Bosh sahifa slaydlari"

    def __str__(self):
        return f"{self.order}. {self.tag}"

    @property
    def image_url(self):
        return self.image.url if self.image else None


# ─── Match Center: Taktik Doskasi ─────────────────────────────────────────────

class MatchPlayer(models.Model):
    STATUS_CHOICES = [
        ('active',  'Faol'),
        ('yellow',  'Sariq karta'),
        ('red',     'Qizil karta (chiqarilgan)'),
        ('sub_out', 'Almashtirilgan'),
        ('injured', 'Jarohat'),
    ]

    player     = models.ForeignKey(Player, on_delete=models.CASCADE,
                                   related_name='match_appearances', verbose_name="Futbolchi")
    match      = models.ForeignKey(Match,  on_delete=models.CASCADE,
                                   related_name='match_players', verbose_name="O'yin")
    team       = models.ForeignKey(Team,   on_delete=models.CASCADE,
                                   related_name='match_lineup', verbose_name="Jamoa")
    is_starter = models.BooleanField(default=True,  verbose_name="Asosiy tarkib")
    position_x = models.FloatField(default=50.0,    verbose_name="X pozitsiya (%)")
    position_y = models.FloatField(default=50.0,    verbose_name="Y pozitsiya (%)")
    status     = models.CharField(max_length=10, choices=STATUS_CHOICES,
                                  default='active', verbose_name="Holat")
    shirt_number = models.PositiveIntegerField(default=0, verbose_name="Forma raqami")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('player', 'match')
        ordering = ['team', 'is_starter', 'shirt_number']
        indexes = [
            models.Index(fields=['match', 'team', 'is_starter']),
        ]
        verbose_name = "O'yin tarkibi"
        verbose_name_plural = "O'yin tarkiblari"

    def __str__(self):
        return f"{self.player.name} — {self.match}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.is_starter and self.pk is None:
            starters = MatchPlayer.objects.filter(
                match=self.match, team=self.team, is_starter=True
            ).count()
            if starters >= 11:
                raise ValidationError(
                    f"Bir jamoa uchun maksimum 11 ta asosiy o'yinchi bo'lishi mumkin."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
