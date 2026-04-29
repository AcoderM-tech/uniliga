import json
from channels.generic.websocket import AsyncWebsocketConsumer


class MatchConsumer(AsyncWebsocketConsumer):
    """WebSocket for a specific match — receives real-time updates."""
    async def connect(self):
        self.match_id   = self.scope['url_route']['kwargs']['match_id']
        self.group_name = f"match_{self.match_id}"
        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        except Exception:
            # Redis o'chib qolsa ham socket server yiqilmasin
            pass
        await self.accept()

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def match_update(self, event):
        await self.send(text_data=json.dumps({'type': 'match_update', 'data': event['data']}))


class LiveFeedConsumer(AsyncWebsocketConsumer):
    """WebSocket for all live matches feed — home page use."""
    async def connect(self):
        try:
            await self.channel_layer.group_add("live_feed", self.channel_name)
        except Exception:
            pass
        await self.accept()

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard("live_feed", self.channel_name)
        except Exception:
            pass

    async def live_update(self, event):
        await self.send(text_data=json.dumps({'type': 'live_update', 'data': event['data']}))


class TacticalBoardConsumer(AsyncWebsocketConsumer):
    """WebSocket for tactical board — real-time player positions & events."""
    async def connect(self):
        self.match_id   = self.scope['url_route']['kwargs']['match_id']
        self.group_name = f"match_{self.match_id}"

        # Faqat autentifikatsiya qilingan admin ulanishi mumkin
        user = self.scope.get('user')
        if not (user and user.is_authenticated and user.is_staff):
            await self.close(code=4003)
            return

        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        except Exception:
            pass
        await self.accept()

    async def disconnect(self, code):
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception:
            pass

    async def receive(self, text_data):
        """Receive message from WebSocket client (admin drag-drop etc)."""
        user = self.scope.get('user')
        if not (user and user.is_authenticated and user.is_staff):
            return
        try:
            data = json.loads(text_data)
            await self.channel_layer.group_send(
                self.group_name,
                {"type": "match_update", "data": data}
            )
        except Exception:
            pass

    async def match_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'match_update',
            'data': event['data']
        }))
