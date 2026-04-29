from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='match',
            name='stream_url',
            field=models.URLField(blank=True, help_text='YouTube or other live stream embed URL', null=True),
        ),
        migrations.AddField(
            model_name='post',
            name='video_url',
            field=models.URLField(blank=True, help_text='YouTube embed URL for video highlights', null=True),
        ),
    ]
