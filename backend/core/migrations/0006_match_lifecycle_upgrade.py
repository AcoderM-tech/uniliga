from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_season_weeks_total'),
    ]

    operations = [
        # Match new fields
        migrations.AddField(
            model_name='match',
            name='phase',
            field=models.CharField(
                choices=[
                    ('not_started', 'Boshlanmagan'),
                    ('first_half', 'Birinchi yarim'),
                    ('half_time', 'Dam olish'),
                    ('second_half', 'Ikkinchi yarim'),
                    ('extra_time', "Qo'shimcha vaqt"),
                    ('finished', 'Tugagan'),
                ],
                default='not_started', max_length=15, verbose_name='Faza'
            ),
        ),
        migrations.AddField(
            model_name='match',
            name='extra_minute',
            field=models.PositiveIntegerField(default=0, verbose_name="Qo'shimcha daqiqa"),
        ),
        migrations.AddField(
            model_name='match',
            name='first_half_duration',
            field=models.PositiveIntegerField(default=45, verbose_name='1-yarim davomiyligi'),
        ),
        migrations.AddField(
            model_name='match',
            name='first_half_extra',
            field=models.PositiveIntegerField(default=0, verbose_name="1-yarim qo'shimcha"),
        ),
        migrations.AddField(
            model_name='match',
            name='half_time_duration',
            field=models.PositiveIntegerField(default=15, verbose_name='Dam olish davomiyligi'),
        ),
        migrations.AddField(
            model_name='match',
            name='second_half_duration',
            field=models.PositiveIntegerField(default=45, verbose_name='2-yarim davomiyligi'),
        ),
        migrations.AddField(
            model_name='match',
            name='second_half_extra',
            field=models.PositiveIntegerField(default=0, verbose_name="2-yarim qo'shimcha"),
        ),
        migrations.AddField(
            model_name='match',
            name='phase_started_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Faza boshlangan vaqt'),
        ),
        migrations.AddField(
            model_name='match',
            name='half_time_started_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Dam olish boshlangan vaqt'),
        ),
        migrations.AlterField(
            model_name='match',
            name='status',
            field=models.CharField(
                choices=[
                    ('upcoming', 'Kutilmoqda'),
                    ('live', 'Jonli'),
                    ('half_time', 'Dam olish'),
                    ('second_half', 'Ikkinchi yarim'),
                    ('extra_time', "Qo'shimcha vaqt"),
                    ('finished', 'Tugagan'),
                ],
                default='upcoming', max_length=15, verbose_name='Holat'
            ),
        ),
        # Remove stream fields
        migrations.RemoveField(model_name='match', name='stream_url'),
        migrations.RemoveField(model_name='match', name='stream_key'),

        # MatchEvent new fields
        migrations.AddField(
            model_name='matchevent',
            name='extra_minute',
            field=models.PositiveIntegerField(default=0, verbose_name="Qo'shimcha daqiqa"),
        ),
        migrations.AddField(
            model_name='matchevent',
            name='player_out',
            field=models.CharField(blank=True, max_length=100, verbose_name='Chiquvchi futbolchi'),
        ),
        migrations.AddField(
            model_name='matchevent',
            name='assist_player',
            field=models.CharField(blank=True, max_length=100, verbose_name='Assist bergan futbolchi'),
        ),
        migrations.AlterField(
            model_name='matchevent',
            name='event_type',
            field=models.CharField(
                choices=[
                    ('goal', 'Gol'),
                    ('assist', 'Assist'),
                    ('yellow', 'Sariq karta'),
                    ('red', 'Qizil karta'),
                    ('sub', 'Almashtirish'),
                    ('own_goal', "O'z goli"),
                    ('penalty', 'Penalti'),
                ],
                max_length=15, verbose_name='Hodisa turi'
            ),
        ),

        # Post match linking
        migrations.AddField(
            model_name='post',
            name='match',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='posts',
                to='core.match',
                verbose_name="Bog'liq o'yin"
            ),
        ),
    ]
