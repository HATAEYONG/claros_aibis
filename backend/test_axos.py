#!/usr/bin/env python
"""AXOS ERP API 테스트 스크립트"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import reverse
from axos_erp.models import EventHub, RiskScore, AlertRecord
from axos_erp.views import axos_health_check

print("=" * 50)
print("AXOS ERP V10.4 Integration Test")
print("=" * 50)

# 모델 테스트
print("\n1. Models Test:")
print(f"   EventHub table: {EventHub._meta.db_table}")
print(f"   RiskScore table: {RiskScore._meta.db_table}")
print(f"   AlertRecord table: {AlertRecord._meta.db_table}")

# URL 테스트
print("\n2. URL Test:")
try:
    health_url = reverse('axos_erp:health-check')
    print(f"   Health check URL: {health_url}")
except Exception as e:
    print(f"   URL reverse error: {e}")

# 뷰 함수 테스트
print("\n3. View Function Test:")
try:
    from django.test import RequestFactory
    factory = RequestFactory()
    request = factory.get('/api/axos-erp/health/')
    response = axos_health_check(request)
    print(f"   Health check response: {response.status_code}")
    print(f"   Response data: {response.data}")
except Exception as e:
    print(f"   View function error: {e}")

print("\n" + "=" * 50)
print("Test Complete!")
print("=" * 50)
