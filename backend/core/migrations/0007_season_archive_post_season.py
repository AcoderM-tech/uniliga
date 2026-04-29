from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_match_lifecycle_upgrade'),
    ]

    operations = [
        # Season — arxiv maydoni
        migrations.AddField(
            model_name='season',
            name='is_archived',
            field=models.BooleanField(default=False, verbose_name='Arxivlangan'),
        ),
        # Post — mavsum bog'lash
        migrations.AddField(
            model_name='post',
            name='season',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='posts',
                to='core.season',
                verbose_name='Mavsum',
            ),
        ),
        # Match half_time verbose_name = "Tanaffus"
        migrations.AlterField(
            model_name='match',
            name='half_time_duration',
            field=models.PositiveIntegerField(default=15, verbose_name='Tanaffus davomiyligi'),
        ),
        migrations.AlterField(
            model_name='match',
            name='half_time_started_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Tanaffus boshlangan vaqt'),
        ),
    ]
