import os
from django.apps import AppConfig
from django.db.models.signals import post_migrate


def _create_auto_superuser(**kwargs):
    username = os.environ.get('AUTO_SUPERUSER_USERNAME')
    password = os.environ.get('AUTO_SUPERUSER_PASSWORD')
    if not username or not password:
        return

    email = os.environ.get('AUTO_SUPERUSER_EMAIL') or ''

    from django.contrib.auth import get_user_model

    User = get_user_model()
    if User.objects.filter(username=username).exists():
        return
    User.objects.create_superuser(username=username, email=email, password=password)


class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        # Create initial superuser after migrations if env vars are set.
        post_migrate.connect(_create_auto_superuser, sender=self)
