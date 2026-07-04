#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from django.conf import settings
import json

# Add 'testserver' to ALLOWED_HOSTS for testing
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

def test_phase4_apis():
    client = Client()

    print("=" * 80)
    print("PHASE 4 API TEST RESULTS")
    print("=" * 80)

    # Test 1: Integrations configs endpoint
    print("\n1. Testing Integrations Configs API:")
    try:
        response = client.get('/api/integrations/configs/')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Count: {data.get('count', 'N/A')}")
        else:
            print(f"   Response: {response.content[:200]}")
    except Exception as e:
        print(f"   Error: {e}")

    # Test 2: Visualization chart types endpoint
    print("\n2. Testing Visualization Chart Types API:")
    try:
        response = client.get('/api/visualization/visualization/chart_types/')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Chart Types: {len(data.get('chart_types', []))} found")
        else:
            print(f"   Response: {response.content[:200]}")
    except Exception as e:
        print(f"   Error: {e}")

    # Test 3: Visualization dashboards endpoint
    print("\n3. Testing Visualization Dashboards API:")
    try:
        response = client.get('/api/visualization/dashboards/')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Dashboards: {data.get('count', 'N/A')}")
        else:
            print(f"   Response: {response.content[:200]}")
    except Exception as e:
        print(f"   Error: {e}")

    # Test 4: Integration logs endpoint
    print("\n4. Testing Integrations Logs API:")
    try:
        response = client.get('/api/integrations/logs/')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Logs: {data.get('count', 'N/A')}")
        else:
            print(f"   Response: {response.content[:200]}")
    except Exception as e:
        print(f"   Error: {e}")

    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    test_phase4_apis()
