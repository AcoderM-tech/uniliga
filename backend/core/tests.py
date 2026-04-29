from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

from django.test import SimpleTestCase


PROJECT_ROOT = Path(__file__).resolve().parent.parent


class FallbackSmokeTests(SimpleTestCase):
    def _run_python(self, code: str, extra_env: dict[str, str], timeout_s: int = 25) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        env.update(extra_env)

        cmd = [sys.executable, "-X", "utf8", "-c", code]
        return subprocess.run(
            cmd,
            cwd=str(PROJECT_ROOT),
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout_s,
        )

    def test_postgres_down_falls_back_to_sqlite_in_dev(self):
        """
        DB_ENGINE=postgres bo'lsa ham, DEBUG=True va USE_SQLITE_FALLBACK=True bo'lganda
        PostgreSQL ishlamasa SQLite ga tushib ketishi kerak.
        """
        res = self._run_python(
            code=(
                "from django.conf import settings\n"
                "print(settings.DATABASES['default']['ENGINE'])\n"
            ),
            extra_env={
                "DJANGO_SETTINGS_MODULE": "config.settings",
                "DJANGO_SECRET_KEY": "test-secret-key",
                "DJANGO_DEBUG": "True",
                "DB_ENGINE": "postgres",
                "USE_SQLITE_FALLBACK": "True",
                "DB_CONNECT_TIMEOUT_SECONDS": "1",
                "DATABASE_URL": "postgres://user:pass@127.0.0.1:1/testdb",
                "USE_REDIS": "False",
            },
        )
        self.assertEqual(res.returncode, 0, msg=f"stderr:\n{res.stderr}\nstdout:\n{res.stdout}")
        self.assertIn("sqlite3", res.stdout)

    def test_redis_down_uses_inmemory_and_locmem(self):
        """
        USE_REDIS=True bo'lsa ham Redis unreachable bo'lsa app yiqilmasligi,
        InMemoryChannelLayer + LocMemCache ishlashi kerak.
        """
        res = self._run_python(
            code=(
                "from django.conf import settings\n"
                "print(settings.CHANNEL_LAYERS['default']['BACKEND'])\n"
                "print(settings.CACHES['default']['BACKEND'])\n"
            ),
            extra_env={
                "DJANGO_SETTINGS_MODULE": "config.settings",
                "DJANGO_SECRET_KEY": "test-secret-key",
                "DJANGO_DEBUG": "True",
                "DB_ENGINE": "sqlite",
                "USE_REDIS": "True",
                "REDIS_URL": "redis://127.0.0.1:1/0",
                "REDIS_CONNECT_TIMEOUT_SECONDS": "1",
                "REDIS_SOCKET_TIMEOUT_SECONDS": "1",
            },
        )
        self.assertEqual(res.returncode, 0, msg=f"stderr:\n{res.stderr}\nstdout:\n{res.stdout}")
        self.assertIn("channels.layers.InMemoryChannelLayer", res.stdout)
        self.assertIn("django.core.cache.backends.locmem.LocMemCache", res.stdout)

    def test_sqlite_blocked_in_production(self):
        """SQLite productionda (DEBUG=False) ishlamasligi kerak."""
        res = self._run_python(
            code=(
                "from django.conf import settings\n"
                "print(settings.DATABASES['default']['ENGINE'])\n"
            ),
            extra_env={
                "DJANGO_SETTINGS_MODULE": "config.settings",
                "DJANGO_SECRET_KEY": "test-secret-key",
                "DJANGO_DEBUG": "False",
                "DB_ENGINE": "sqlite",
                "USE_REDIS": "False",
            },
        )
        self.assertNotEqual(res.returncode, 0)
        self.assertIn("sqlite", (res.stderr or "").lower())
