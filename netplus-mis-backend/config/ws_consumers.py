# -*- coding: utf-8 -*-
"""
WebSocket Consumers for NetPlus MIS

Real-time data streaming consumers
"""
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from datetime import datetime


class DashboardConsumer(AsyncWebsocketConsumer):
    """
    대시보드 실시간 데이터 스트리밍
    """

    async def connect(self):
        """WebSocket 연결 수락"""
        await self.accept()
        self.room_group_name = 'dashboard'

        # 대시보드 그룹에 참여
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # 초기 데이터 전송
        await self.send_dashboard_data()

    async def disconnect(self, close_code):
        """WebSocket 연결 해제"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """클라이언트로부터 메시지 수신"""
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'update')

        if message_type == 'refresh':
            await self.send_dashboard_data()

    async def send_dashboard_data(self):
        """대시보드 데이터 전송"""
        from utils.dashboard_aggregator import dashboard_overview

        # 비동기로 데이터 가져오기
        data = await database_sync_to_async(self._get_dashboard_data)()

        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': data,
            'timestamp': datetime.now().isoformat()
        }))

    def _get_dashboard_data(self):
        """대시보드 데이터 조회 (동기)"""
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request

        factory = APIRequestFactory()
        request = factory.get('/api/dashboard/overview/')
        request = Request(request)

        from utils.dashboard_aggregator import dashboard_overview
        from rest_framework.response import Response

        response = dashboard_overview(request)
        return response.data


class KPIConsumer(AsyncWebsocketConsumer):
    """
    KPI 실시간 업데이트
    """

    async def connect(self):
        await self.accept()
        self.module = self.scope['url_route']['kwargs'].get('module', 'all')
        self.room_group_name = f'kpi_{self.module}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.send_kpi_data()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type', 'update')

        if message_type == 'refresh':
            await self.send_kpi_data()

    async def send_kpi_data(self):
        """KPI 데이터 전송"""
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request

        factory = APIRequestFactory()
        request = factory.get(f'/api/dashboard/kpis/?module={self.module}')
        request = Request(request)

        from utils.dashboard_aggregator import dashboard_kpis

        response = dashboard_kpis(request)

        await self.send(text_data=json.dumps({
            'type': 'kpi_update',
            'module': self.module,
            'data': response.data,
            'timestamp': datetime.now().isoformat()
        }))


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    알림 실시간 전송
    """

    async def connect(self):
        await self.accept()
        self.user_id = self.scope.get('user', {}).get('id', 'anonymous')
        self.room_group_name = f'notifications_{self.user_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        pass

    async def notification(self, event):
        """알림 수신"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data']
        }))
