from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_match_stream_url_post_video_url'),
    ]

    operations = [
        migrations.CreateModel(
            name='Player',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Ism Familiya')),
                ('photo', models.ImageField(blank=True, null=True, upload_to='players/', verbose_name='Rasm')),
                ('number', models.PositiveIntegerField(default=0, verbose_name='Raqam')),
                ('position', models.CharField(blank=True, max_length=30, verbose_name='Mavqe')),
                ('is_active', models.BooleanField(default=True, verbose_name='Faol')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='players', to='core.team', verbose_name='Jamoa')),
            ],
            options={'verbose_name': 'Futbolchi', 'verbose_name_plural': 'Futbolchilar', 'ordering': ['name']},
        ),
        migrations.AddField(
            model_name='match',
            name='stream_key',
            field=models.CharField(blank=True, default='', help_text='Jonli efir kaliti', max_length=64, verbose_name='Jonli efir kaliti'),
        ),
    ]
