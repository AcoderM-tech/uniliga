"""
Demo ma'lumotlar — python manage.py seed
Barcha funksiyalarni ko'rsatadi:
  - Mavsum, jamoalar, futbolchilar
  - Tugagan, jonli, kelgusi o'yinlar
  - Gol, assist, karta hodisalar
  - Liga jadvali
  - Yangiliklar (rasm, video, report, transfer)
  - Match Center lineup (taktik dosqa)
  - Superuser yaratish (agar yo'q bo'lsa)
"""
import datetime, random
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from core.models import (
    Season, Team, Player, Match, MatchEvent,
    LeagueTable, Post, MatchPlayer
)

User = get_user_model()

# ── Jamoalar ──────────────────────────────────────────────
JAMOALAR = [
    {"name": "TATU Titans",     "short": "TTT", "rang": "#cc1a2e", "fak": "Axborot xavfsizligi"},
    {"name": "Makon FC",        "short": "MFC", "rang": "#1a56db", "fak": "Kompyuter muhandisligi"},
    {"name": "Tech Yulduzlari", "short": "TY",  "rang": "#1a8a4a", "fak": "Dasturiy injiniring"},
    {"name": "Digital FC",      "short": "DFC", "rang": "#c9a227", "fak": "Sun'iy intellekt"},
    {"name": "Kod Jangchilari", "short": "KJ",  "rang": "#7c3aed", "fak": "Kiberxavfsizlik"},
    {"name": "Silicon SC",      "short": "SSC", "rang": "#0891b2", "fak": "Telekommunikatsiya"},
    {"name": "Bayt United",     "short": "BUT", "rang": "#db2777", "fak": "Elektrotexnika"},
    {"name": "Neuro FC",        "short": "NFC", "rang": "#dc2626", "fak": "Robototexnika"},
]

# ── Futbolchilar har jamoa uchun ─────────────────────────
SQUAD = [
    # (ism, raqam, mavqe)
    ("Amir Karimov",      9,  "Hujumchi"),
    ("Jasur Rahimov",     7,  "Hujumchi"),
    ("Kamol Umarov",      10, "Yarim himoyachi"),
    ("Mansur Tursunov",   8,  "Yarim himoyachi"),
    ("Firdavs Fattoyev",  6,  "Yarim himoyachi"),
    ("Bobur Toshmatov",   5,  "Himoyachi"),
    ("Dilshod Yusupov",   4,  "Himoyachi"),
    ("Nodir Kalandarov",  3,  "Himoyachi"),
    ("Sardor Xolmatov",   2,  "Himoyachi"),
    ("Jamshid Nazarov",   11, "Hujumchi"),
    ("Ulugbek Mirzayev",  1,  "Darvozabon"),
    # Zaxira
    ("Sherzod Qodirov",   12, "Hujumchi"),
    ("Otabek Xasanov",    13, "Yarim himoyachi"),
    ("Laziz Yusupov",     14, "Himoyachi"),
    ("Ravshan Normatov",  15, "Darvozabon"),
]

# ── Taktik pozitsiyalar: 4-3-3 ───────────────────────────
# Home: bottom half (y: 60-92), Away: top half (y: 8-40)
FORMATION_HOME = [
    (50, 91),                                    # GK
    (12, 74), (33, 72), (67, 72), (88, 74),      # DEF
    (22, 55), (50, 52), (78, 55),                # MID
    (18, 34), (50, 30), (82, 34),                # FWD
]
FORMATION_AWAY = [
    (50, 9),                                     # GK
    (12, 26), (33, 28), (67, 28), (88, 26),      # DEF
    (22, 45), (50, 48), (78, 45),                # MID
    (18, 66), (50, 70), (82, 66),                # FWD
]

# ── Yangiliklar ──────────────────────────────────────────
YANGILIKLAR = [
    {
        "title":    "TATU Titans g'alaba qozondi — 3:1",
        "category": "report",
        "featured": True,
        "content":  """Hafta eng yaxshi o'yinida TATU Titans jamoasi raqibidan ustun keldi.
Birinchi yarimda ikki gol urgan jamoa, ikkinchi yarimda ham ustunligini saqlab qoldi.
Amir Karimov hat-trick qildi — bu mavsumning eng ajoyib individual ko'rsatkichi.
Jamoa endi jadvalda yetakchi o'rinda — 24 ball bilan.""",
        "excerpt":  "Amir Karimov hat-trick bilan TATU Titans g'alabasini ta'minladi.",
    },
    {
        "title":    "Makon FC yangi transfer: ikki yulduz qo'shildi",
        "category": "transfer",
        "featured": False,
        "content":  """Makon FC jamoasi yangi transferlar haqida rasmiy bayonot berdi.
Ikki tajribali o'yinchi jamoaga qo'shildi va darhol asosiy tarkibga kiritildi.
Jamoa menedjeri: 'Bu transferlar bizning chempionlik rejalarimiz uchun muhim qadamdir' dedi.""",
        "excerpt":  "Makon FC ikkita tajribali o'yinchini jamoaga qo'shdi.",
    },
    {
        "title":    "Mavsumning eng yaxshi futbolchisi: Statistika sharhi",
        "category": "highlight",
        "featured": False,
        "content":  """12-hafta yakunlari bo'yicha statistika yangilandi.
Top o'rinlarda keskin o'zgarishlar bo'ldi — Amir Karimov 11 gol bilan yetakchi.
Jasur Rahimov 8 assist bilan eng ko'p pas beruvchi futbolchi unvonini egalladi.
Makon FC dan Kamol Umarov ham 7 gol bilan ikkinchi o'rinda.""",
        "excerpt":  "12-hafta yakunlari: top golchilar va assistchilar reytingi.",
    },
    {
        "title":    "Chempionlik poygarasi: Kim g'alaba qiladi?",
        "category": "news",
        "featured": False,
        "content":  """Mavsum yakuniga 4 hafta qolganda chempionlik uchun kurash qizib bormoqda.
TATU Titans va Makon FC faqat 2 ball farq bilan jadvalda ketma-ket turadi.
Keyingi haftadagi to'g'ridan-to'g'ri uchrashuv chempionni aniqlab berishi mumkin.
Ekspertlar fikricha, bu mavsumning eng muhim o'yini bo'ladi.""",
        "excerpt":  "Mavsum yakuniga 4 hafta qolganda chempionlik kurashi avjiga chiqdi.",
    },
    {
        "title":    "Yangi stadion: TATU Sport Majmuasi tayyor",
        "category": "news",
        "featured": False,
        "content":  """Universitetning yangi sport majmuasi rasmiy ravishda ochildi.
Zamonaviy sun'iy o'tlar va yoritish tizimi bilan jihozlangan stadion
futbol ligasining barcha o'yinlarini qabul qilishga tayyor.
Qabul salohiyati 500 tomoshabin.""",
        "excerpt":  "TATU yangi zamonaviy sport majmuasini rasmiy ochdi.",
    },
    {
        "title":    "Mukofot: Oyning eng yaxshi o'yini tanlandi",
        "category": "award",
        "featured": False,
        "content":  """Mart oyining eng yaxshi o'yini sifatida TATU Titans — Digital FC
uchrashuvi tanlandi. O'yin 4 gol va bir nechta ajoyib epizodlar bilan esda qoldi.
Ovoz berish paytida 1200 nafar fan ishtirok etdi.""",
        "excerpt":  "Mart oyining eng yaxshi o'yini: TATU Titans — Digital FC.",
    },
]


class Command(BaseCommand):
    help = "Barcha funksiyalarni namoyish qiluvchi demo ma'lumotlar"

    def handle(self, *args, **options):

        # ── 0. Superuser ─────────────────────────────────
        self.stdout.write("👤  Superuser tekshirilmoqda...")
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                password="admin123",
                email="admin@tatu.uz",
                first_name="Admin",
            )
            self.stdout.write("   ✅ Superuser yaratildi: admin / admin123")
        else:
            self.stdout.write("   ℹ️  Superuser mavjud: admin")

        # ── 1. Eski ma'lumotlarni tozalash ───────────────
        self.stdout.write("🗑   Eski ma'lumotlar o'chirilmoqda...")
        MatchPlayer.objects.all().delete()
        Post.objects.all().delete()
        MatchEvent.objects.all().delete()
        LeagueTable.objects.all().delete()
        Match.objects.all().delete()
        Player.objects.all().delete()
        Team.objects.all().delete()
        Season.objects.all().delete()

        # ── 2. Faol mavsum ───────────────────────────────
        self.stdout.write("📅  Mavsum yaratilmoqda...")
        mavsum = Season.objects.create(
            name="2024/25",
            is_active=True,
            is_archived=False,
            start_date=datetime.date(2024, 9, 1),
            end_date=datetime.date(2025, 6, 30),
            weeks_total=16,
        )

        # ── 3. Jamoalar ──────────────────────────────────
        self.stdout.write("🛡   Jamoalar yaratilmoqda...")
        jamoalar = []
        for j in JAMOALAR:
            t = Team.objects.create(
                name=j["name"],
                short_name=j["short"],
                faculty=j["fak"],
                primary_color=j["rang"],
                secondary_color="#060810",
                season=mavsum,
            )
            jamoalar.append(t)
        self.stdout.write(f"   ✅ {len(jamoalar)} ta jamoa")

        # ── 4. Futbolchilar ──────────────────────────────
        self.stdout.write("👟  Futbolchilar yaratilmoqda...")
        all_players = []
        for jamoa in jamoalar:
            for (ism, raqam, mavqe) in SQUAD:
                # Har jamoa uchun unikal suffix
                sfx = ["", " Jr", " II", " Pro", " X", " Plus", " Max", " Neo"][
                    jamoalar.index(jamoa) % 8
                ] if jamoalar.index(jamoa) > 0 else ""
                p = Player.objects.create(
                    name=ism + (sfx if sfx else ""),
                    team=jamoa,
                    number=raqam,
                    position=mavqe,
                    is_active=True,
                )
                all_players.append(p)
        self.stdout.write(f"   ✅ {len(all_players)} ta futbolchi")

        # ── 5. O'yinlar: tugagan, jonli, kelgusi ─────────
        self.stdout.write("🏟   O'yinlar yaratilmoqda...")
        oyinlar = []
        today = datetime.date.today()

        # 12 ta tugagan o'yin
        juftlar_tugagan = [
            (0,1),(2,3),(4,5),(6,7),
            (0,2),(1,3),(4,6),(5,7),
            (0,3),(1,4),(2,5),(6,7),
        ]
        for hafta, (i, k) in enumerate(juftlar_tugagan, 1):
            uy_g  = random.randint(0, 4)
            m_g   = random.randint(0, 3)
            oyin  = Match.objects.create(
                season=mavsum,
                home_team=jamoalar[i],
                away_team=jamoalar[k],
                match_date=today - datetime.timedelta(weeks=(12 - hafta + 1)),
                match_time=datetime.time(18, 0),
                stadium="TATU Sport maydon",
                week=hafta,
                status="finished",
                phase="finished",
                home_score=uy_g,
                away_score=m_g,
            )
            oyinlar.append(("finished", oyin))

        # 1 ta JONLI o'yin
        jonli_oyin = Match.objects.create(
            season=mavsum,
            home_team=jamoalar[0],   # TATU Titans
            away_team=jamoalar[1],   # Makon FC
            match_date=today,
            match_time=datetime.time(18, 0),
            stadium="TATU Sport maydon",
            week=13,
            status="live",
            phase="second_half",
            home_score=2,
            away_score=1,
            minute=67,
            first_half_duration=45,
            second_half_duration=45,
        )
        oyinlar.append(("live", jonli_oyin))

        # 4 ta kelgusi o'yin
        kelgusi_juftlar = [(1,2),(3,4),(5,6),(0,7)]
        for hafta_k, (i, k) in enumerate(kelgusi_juftlar, 14):
            oyin = Match.objects.create(
                season=mavsum,
                home_team=jamoalar[i],
                away_team=jamoalar[k],
                match_date=today + datetime.timedelta(weeks=(hafta_k - 13)),
                match_time=datetime.time(18, 0),
                stadium="TATU Sport maydon",
                week=hafta_k,
                status="upcoming",
                phase="not_started",
                home_score=0,
                away_score=0,
            )
            oyinlar.append(("upcoming", oyin))

        self.stdout.write(f"   ✅ {len(oyinlar)} ta o'yin (12 tugagan, 1 jonli, 4 kelgusi)")

        # ── 6. Hodisalar ─────────────────────────────────
        self.stdout.write("⚽  Hodisalar yaratilmoqda...")
        hodisa_count = 0

        def jamoa_futbolchilari(jamoa):
            return [p for p in all_players if p.team == jamoa]

        for status, oyin in oyinlar:
            if status not in ("finished", "live"):
                continue

            uy_f  = jamoa_futbolchilari(oyin.home_team)
            m_f   = jamoa_futbolchilari(oyin.away_team)

            # Gollar — uy jamoasi
            for _ in range(oyin.home_score):
                scorer = random.choice(uy_f[:4])   # hujumchi/yarimmud
                minute = random.randint(5, 44 if _ < 2 else 90)
                MatchEvent.objects.create(
                    match=oyin, minute=minute,
                    event_type="goal",
                    player_name=scorer.name,
                    team=oyin.home_team,
                )
                # Assist
                assist_p = random.choice([p for p in uy_f if p != scorer])
                MatchEvent.objects.create(
                    match=oyin, minute=minute,
                    event_type="assist",
                    player_name=assist_p.name,
                    team=oyin.home_team,
                )
                hodisa_count += 2

            # Gollar — mehmon jamoa
            for _ in range(oyin.away_score):
                scorer = random.choice(m_f[:4])
                minute = random.randint(5, 44 if _ < 2 else 90)
                MatchEvent.objects.create(
                    match=oyin, minute=minute,
                    event_type="goal",
                    player_name=scorer.name,
                    team=oyin.away_team,
                )
                hodisa_count += 1

            # Sariq kartalar (1-3 ta)
            for _ in range(random.randint(1, 3)):
                f = random.choice(uy_f + m_f)
                MatchEvent.objects.create(
                    match=oyin, minute=random.randint(20, 85),
                    event_type="yellow",
                    player_name=f.name,
                    team=f.team,
                )
                hodisa_count += 1

            # Ba'zan qizil karta
            if random.random() < 0.15:
                f = random.choice(uy_f + m_f)
                MatchEvent.objects.create(
                    match=oyin, minute=random.randint(50, 90),
                    event_type="red",
                    player_name=f.name,
                    team=f.team,
                )
                hodisa_count += 1

            # Penalti (ba'zan)
            if random.random() < 0.2:
                f = random.choice(uy_f[:3])
                MatchEvent.objects.create(
                    match=oyin, minute=random.randint(60, 90),
                    event_type="penalty",
                    player_name=f.name,
                    team=oyin.home_team,
                )
                hodisa_count += 1

        self.stdout.write(f"   ✅ {hodisa_count} ta hodisa")

        # ── 7. Liga jadvali ──────────────────────────────
        self.stdout.write("📊  Liga jadvali hisoblanmoqda...")
        LeagueTable.recalculate(mavsum)
        self.stdout.write(f"   ✅ {LeagueTable.objects.count()} ta qator")

        # ── 8. Match Center lineup ───────────────────────
        self.stdout.write("🎯  Match Center lineup yaratilmoqda...")
        lineup_count = 0

        def qo_sh_lineup(oyin, jamoa, pozitsiyalar, is_home):
            futbolchilar = jamoa_futbolchilari(jamoa)[:15]
            starters  = futbolchilar[:11]
            bench     = futbolchilar[11:15]

            for i, player in enumerate(starters):
                if i < len(pozitsiyalar):
                    px, py = pozitsiyalar[i]
                else:
                    px, py = 50.0, 50.0
                try:
                    MatchPlayer.objects.get_or_create(
                        player=player,
                        match=oyin,
                        defaults=dict(
                            team=jamoa,
                            is_starter=True,
                            position_x=float(px),
                            position_y=float(py),
                            shirt_number=player.number or i + 1,
                            status="active",
                        )
                    )
                except Exception:
                    pass

            for player in bench:
                try:
                    MatchPlayer.objects.get_or_create(
                        player=player,
                        match=oyin,
                        defaults=dict(
                            team=jamoa,
                            is_starter=False,
                            position_x=50.0,
                            position_y=50.0,
                            shirt_number=player.number or 12,
                            status="active",
                        )
                    )
                except Exception:
                    pass

        # Jonli o'yin uchun to'liq lineup
        qo_sh_lineup(jonli_oyin, jamoalar[0], FORMATION_HOME, True)
        qo_sh_lineup(jonli_oyin, jamoalar[1], FORMATION_AWAY, False)

        # Jonli o'yin hodisalari — ba'zi o'yinchilar status o'zgartiradi
        lineup_home = MatchPlayer.objects.filter(
            match=jonli_oyin, team=jamoalar[0], is_starter=True
        ).order_by('shirt_number')
        if lineup_home.exists():
            # Bitta sariq karta
            mp = lineup_home.first()
            mp.status = "yellow"
            mp.save(update_fields=["status"])

        # Oxirgi 3 tugagan o'yin uchun ham lineup
        finished_matches = Match.objects.filter(
            season=mavsum, status="finished"
        ).order_by("-match_date")[:3]
        for oyin in finished_matches:
            qo_sh_lineup(oyin, oyin.home_team, FORMATION_HOME, True)
            qo_sh_lineup(oyin, oyin.away_team, FORMATION_AWAY, False)

        lineup_count = MatchPlayer.objects.count()
        self.stdout.write(f"   ✅ {lineup_count} ta o'yinchi lineup qo'shildi")

        # ── 9. Yangiliklar ───────────────────────────────
        self.stdout.write("📰  Yangiliklar yaratilmoqda...")
        finished_list = [o for s, o in oyinlar if s == "finished"]
        for idx, y in enumerate(YANGILIKLAR):
         match_ref = finished_list[idx % len(finished_list)] if finished_list else None
    
    # Sarlavhadan qisqa slug yasash (masalan, 40 ta belgi + random)
         safe_slug = slugify(y["title"])[:40] + f"-{random.randint(1000,9999)}"
    
         Post.objects.create(
         title=y["title"][:50],          # 50 belgidan oshmaydi
         slug=safe_slug,                 # 50 belgidan oshmaydi
         category=y["category"][:50],    # Agar kategoriya ham 50 bo'lsa
         content=y["content"],
         excerpt=y["excerpt"],
         is_published=True,
         is_featured=y["featured"],
         season=mavsum,
         match=match_ref if idx < 2 else None,
    )

        self.stdout.write(f"   ✅ {len(YANGILIKLAR)} ta yangilik")

        # ── Yakuniy hisobot ──────────────────────────────
        self.stdout.write(self.style.SUCCESS(f"""
╔══════════════════════════════════════════╗
║        ✅  SEED MUVAFFAQIYATLI!          ║
╠══════════════════════════════════════════╣
║  🔑 Login:   admin / admin123           ║
║  📅 Mavsum:  {mavsum.name:<28} ║
║  🛡  Jamoalar: {Team.objects.count():<26} ║
║  👟 Futbolchilar: {Player.objects.count():<22} ║
║  🏟  O'yinlar: {Match.objects.count():<26} ║
║     └ Tugagan:  {Match.objects.filter(status='finished').count():<24} ║
║     └ Jonli:    {Match.objects.filter(status='live').count():<24} ║
║     └ Kelgusi:  {Match.objects.filter(status='upcoming').count():<24} ║
║  ⚽ Hodisalar: {MatchEvent.objects.count():<26} ║
║  🎯 Lineup:  {MatchPlayer.objects.count():<27} ║
║  📰 Yangiliklar: {Post.objects.count():<23} ║
╚══════════════════════════════════════════╝

  🌐 Sayt:   http://localhost:5173
  🔧 Admin:  http://localhost:8000/admin
  📡 API:    http://localhost:8000/api/
        """))