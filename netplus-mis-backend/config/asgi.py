# -*- coding: utf-8 -*-
"""
ASGI config for NetPlus MIS project.

Django 5.1 with WebSocket/Channels support
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application
django_asgi_app = get_asgi_application()

# WebSocket routing
from config.ws_urls import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
