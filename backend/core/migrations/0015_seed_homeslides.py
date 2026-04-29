from django.db import migrations
def seed_home_slides(apps, schema_editor):
    HomeSlide = apps.get_model('core', 'HomeSlide')
    if HomeSlide.objects.exists():
        return

    slides = [
        {
            'tag': 'Rasmiy Liga',
            'h1a': 'UniLiga',
            'h1b': 'Universitet',
            'h1c': 'Futbol Ligasi',
            'desc': "TATU fakultetlari o'rtasidagi rasmiy futbol chempionati. Jonli hisoblar, jadval va yangiliklar bir joyda.",
            'order': 1,
        },
        {
            'tag': 'Mavsum 2025',
            'h1a': 'Kurash',
            'h1b': 'Chempionlik',
            'h1c': 'Uchun',
            'desc': "Eng kuchli jamoalar birinchilik uchun kurashmoqda. Kim chempion bo'lishga loyiq?",
            'order': 2,
        },
        {
            'tag': 'Jamoalar',
            'h1a': None,
            'h1b': 'Jamoa',
            'h1c': 'Raqobatda',
            'desc': "Har bir fakultet sharaf uchun maydonga tushadi. Qaysi jamoa eng kuchli?",
            'order': 3,
        },
        {
            'tag': 'Statistika',
            'h1a': 'Top',
            'h1b': 'Futbolchilar',
            'h1c': 'Reytingi',
            'desc': "Gollar, assistlar va ball bo'yicha eng yaxshi o'yinchilar. Har hafta yangilanadi.",
            'order': 4,
        },
        {
            'tag': 'Jadval',
            'h1a': 'Haftalik',
            'h1b': "O'yinlar",
            'h1c': 'Jadvali',
            'desc': "Barcha o'yinlar sanasi, vaqti va natijalari bir joyda. Birorta o'yinni o'tkazib yubormang.",
            'order': 5,
        },
        {
            'tag': 'Yangiliklar',
            'h1a': "So'nggi",
            'h1b': 'Xabarlar',
            'h1c': 'Va Tahlillar',
            'desc': "O'yin hisobotlari, transferlar va chempionat yangiliklari. Hammasidan xabardor bo'ling.",
            'order': 6,
        },
    ]

    for s in slides:
        HomeSlide.objects.create(
            tag=s['tag'],
            h1a=s['h1a'],
            h1b=s['h1b'],
            h1c=s['h1c'],
            desc=s['desc'],
            order=s['order'],
            is_active=True,
        )


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_homeslide'),
    ]

    operations = [
        migrations.RunPython(seed_home_slides, reverse_code=migrations.RunPython.noop),
    ]
