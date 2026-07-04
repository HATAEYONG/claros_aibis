# -*- coding: utf-8 -*-
"""
Visualization Models
데이터 시각화 모델
"""
from django.db import models
from django.utils import timezone
import json
import uuid


class Dashboard(models.Model):
    """대시보드 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField('대시보드명', max_length=200)
    code = models.CharField('대시보드 코드', max_length=100, unique=True)
    description = models.TextField('설명', blank=True)
    layout = models.JSONField('레이아웃', default=dict)
    theme = models.CharField('테마', max_length=50, choices=[
        ('default', '기본'),
        ('dark', '다크'),
        ('light', '라이트'),
        ('colorful', '컬러풀'),
    ], default='default')
    is_public = models.BooleanField('공개 여부', default=False)
    is_active = models.BooleanField('활성화 여부', default=True)
    refresh_interval = models.IntegerField('새로고침 간격(초)', default=300)
    created_by = models.CharField('생성자', max_length=100, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)
    last_viewed_at = models.DateTimeField('마지막 조회', null=True, blank=True)

    class Meta:
        db_table = 'dashboard'
        verbose_name = '대시보드'
        verbose_name_plural = '대시보드'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class DashboardWidget(models.Model):
    """대시보드 위젯 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE,
                                 related_name='widgets', verbose_name='대시보드')
    widget_type = models.CharField('위젯 유형', max_length=50, choices=[
        ('line', '선 그래프'),
        ('bar', '막대 그래프'),
        ('pie', '원 그래프'),
        ('area', '영역 그래프'),
        ('scatter', '산점도'),
        ('heatmap', '히트맵'),
        ('treemap', '트리맵'),
        ('gauge', '게이지'),
        ('table', '테이블'),
        ('kpi', 'KPI 카드'),
        ('funnel', '깔때기 차트'),
        ('sankey', '산키 다이어그램'),
        ('radar', '레이더 차트'),
    ])
    title = models.CharField('위젯 제목', max_length=200)
    description = models.TextField('설명', blank=True)
    position = models.JSONField('위치 정보', default=dict)
    size = models.JSONField('크기 정보', default=dict)
    data_config = models.JSONField('데이터 설정', default=dict)
    chart_config = models.JSONField('차트 설정', default=dict)
    refresh_interval = models.IntegerField('새로고침 간격(초)', null=True, blank=True)
    data_source = models.CharField('데이터 소스', max_length=200, blank=True)
    query = models.TextField('쿼리', blank=True)
    is_active = models.BooleanField('활성화 여부', default=True)
    order = models.IntegerField('순서', default=0)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'dashboard_widget'
        verbose_name = '대시보드 위젯'
        verbose_name_plural = '대시보드 위젯'
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.dashboard.name} - {self.title}"


class ChartTemplate(models.Model):
    """차트 템플릿 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField('템플릿명', max_length=200)
    code = models.CharField('템플릿 코드', max_length=100, unique=True)
    chart_type = models.CharField('차트 유형', max_length=50)
    category = models.CharField('카테고리', max_length=100, blank=True)
    description = models.TextField('설명', blank=True)
    config_schema = models.JSONField('설정 스키마', default=dict)
    default_config = models.JSONField('기본 설정', default=dict)
    preview_image = models.CharField('미리보기 이미지', max_length=500, blank=True)
    is_public = models.BooleanField('공개 여부', default=True)
    is_active = models.BooleanField('활성화 여부', default=True)
    created_by = models.CharField('생성자', max_length=100, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'chart_template'
        verbose_name = '차트 템플릿'
        verbose_name_plural = '차트 템플릿'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class DataStream(models.Model):
    """데이터 스트림 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField('스트림명', max_length=200)
    code = models.CharField('스트림 코드', max_length=100, unique=True)
    topic = models.CharField('토픽', max_length=200)
    data_type = models.CharField('데이터 유형', max_length=50, choices=[
        ('kpi', 'KPI'),
        ('metric', '메트릭'),
        ('log', '로그'),
        ('event', '이벤트'),
        ('alert', '알림'),
    ])
    source = models.CharField('데이터 소스', max_length=200)
    query = models.TextField('쿼리', blank=True)
    update_frequency = models.IntegerField('업데이트 주기(ms)', default=1000)
    buffer_size = models.IntegerField('버퍼 크기', default=100)
    is_active = models.BooleanField('활성화 여부', default=True)
    subscriber_count = models.IntegerField('구독자 수', default=0)
    last_update_at = models.DateTimeField('마지막 업데이트', null=True, blank=True)
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    description = models.TextField('설명', blank=True)

    class Meta:
        db_table = 'data_stream'
        verbose_name = '데이터 스트림'
        verbose_name_plural = '데이터 스트림'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.topic})"


class VisualizationSettings(models.Model):
    """시각화 설정 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.CharField('사용자 ID', max_length=100, unique=True)
    default_theme = models.CharField('기본 테마', max_length=50, default='default')
    chart_preferences = models.JSONField('차트 설정', default=dict)
    color_palette = models.JSONField('색상 팔레트', default=list)
    language = models.CharField('언어', max_length=10, default='ko')
    timezone = models.CharField('시간대', max_length=50, default='Asia/Seoul')
    created_at = models.DateTimeField('생성일', auto_now_add=True)
    updated_at = models.DateTimeField('수정일', auto_now=True)

    class Meta:
        db_table = 'visualization_settings'
        verbose_name = '시각화 설정'
        verbose_name_plural = '시각화 설정'

    def __str__(self):
        return f"Settings for {self.user_id}"
