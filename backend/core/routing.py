from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # ws/ prefiksi bilan yoki undan xola holda:
    # So'rov: "jonli/", "ws/jonli/", "ws/jonli", "jonli" hamma ishlaydi
    re_path(r'^(?:ws/)?jonli/?$', consumers.LiveFeedConsumer.as_asgi()),

    # So'rov: "oyin/123/", "ws/oyin/123/", "oyin/123", "ws/oyin/123" hamma ishlaydi
    re_path(r'^(?:ws/)?oyin/(?P<match_id>\d+)/?$', consumers.MatchConsumer.as_asgi()),

    # So'rov: "taktika/123/", "ws/taktika/123/", "taktika/123", "ws/taktika/123" hamma ishlaydi
    re_path(r'^(?:ws/)?taktika/(?P<match_id>\d+)/?$', consumers.TacticalBoardConsumer.as_asgi()),
]