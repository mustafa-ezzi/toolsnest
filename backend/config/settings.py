"""
Django settings for ToolsNest.
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-dev-only")
DEBUG = os.getenv("DEBUG", "True").lower() in ("1", "true", "yes")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]
# Railway private/public hostnames
if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_STATIC_URL"):
    for host in (
        ".up.railway.app",
        ".railway.app",
        "healthcheck.railway.app",
    ):
        if host not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(host)
# Allow all when explicitly set (useful while debugging deploy)
if os.getenv("ALLOW_ALL_HOSTS", "").lower() in ("1", "true", "yes"):
    ALLOWED_HOSTS = ["*"]


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "corsheaders",
    "django_filters",
    "rest_framework",
    "rest_framework_simplejwt",
    # Local
    "catalog",
    "accounts",
    "media_upload",
    "orders",
    "promotions",
]

MIDDLEWARE = [
    # Must be first so OPTIONS preflight gets CORS headers even on errors/redirects
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
# Railway Postgres needs SSL (public proxy and most managed links)
_db_ssl_default = "True" if "railway" in DATABASE_URL.lower() else "False"
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            ssl_require=os.getenv("DB_SSL_REQUIRE", _db_ssl_default).lower()
            in ("1", "true", "yes"),
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ---------- CORS / CSRF (SPA frontend on another Railway domain) ----------
from corsheaders.defaults import default_headers, default_methods

_default_cors = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173,"
    "https://toolsnest.up.railway.app"
)
CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGINS", _default_cors).split(",")
    if origin.strip()
]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://[\w-]+\.up\.railway\.app$",
    r"^https://[\w.-]+\.railway\.app$",
]
for _rx in os.getenv("CORS_ORIGIN_REGEXES", "").split(","):
    _rx = _rx.strip()
    if _rx:
        CORS_ALLOWED_ORIGIN_REGEXES.append(_rx)

CORS_ALLOW_CREDENTIALS = False
CORS_ALLOW_METHODS = list(default_methods)
CORS_ALLOW_HEADERS = list(default_headers) + [
    "authorization",
    "content-type",
    "x-csrftoken",
    "x-requested-with",
]
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_URLS_REGEX = r"^/api/.*$"

# On Railway, allow all origins by default so POST preflight never blocks deploy.
# Set CORS_ALLOW_ALL=False once CORS_ORIGINS is confirmed correct.
_on_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_STATIC_URL"))
_cors_all_env = os.getenv("CORS_ALLOW_ALL", "True" if _on_railway else "False")
CORS_ALLOW_ALL_ORIGINS = _cors_all_env.lower() in ("1", "true", "yes")

CSRF_TRUSTED_ORIGINS = list(CORS_ALLOWED_ORIGINS)
for _origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(","):
    _origin = _origin.strip().rstrip("/")
    if _origin and _origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(_origin)
CSRF_TRUSTED_ORIGINS.append("https://*.up.railway.app")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.FlexiblePagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Cloudflare R2
def _env(name: str, default: str = "") -> str:
    return (os.getenv(name, default) or "").strip()


R2_ACCOUNT_ID = _env("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = _env("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = _env("R2_SECRET_ACCESS_KEY")
R2_BUCKET = _env("R2_BUCKET", "toolsnest-media")
R2_PUBLIC_BASE_URL = _env("R2_PUBLIC_BASE_URL").rstrip("/")
R2_ENDPOINT_URL = _env("R2_ENDPOINT_URL").rstrip("/")
if not R2_ENDPOINT_URL and R2_ACCOUNT_ID:
    R2_ENDPOINT_URL = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
