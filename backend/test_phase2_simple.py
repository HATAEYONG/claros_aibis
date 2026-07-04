# -*- coding: utf-8 -*-
"""
Phase 2 API Simple Test
Tests with HTTP_HOST parameter to bypass ALLOWED_HOSTS
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
import json


def main():
    """Run simple Phase 2 API tests"""
    print("\n=== Phase 2 API Tests (HTTP_HOST=localhost) ===\n")

    client = Client()

    # Create test user
    user, created = User.objects.get_or_create(
        username='testuser2',
        defaults={'email': 'test2@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print("Created test user: testuser2\n")

    # Login
    client.login(username='testuser2', password='testpass123')
    print("Logged in as testuser2\n")

    # Test 1: KPI Dashboard
    print("1. GET /api/control-tower/kpi/dashboard/")
    response = client.get('/api/control-tower/kpi/dashboard/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Period: {data.get('period', {}).get('type')}")
        print(f"   KPI Count: {data.get('summary', {}).get('total_kpis')}")
        print(f"   Critical: {data.get('summary', {}).get('critical_count')}")
        print(f"   Warning: {data.get('summary', {}).get('warning_count')}")

    # Test 2: KPI Definitions
    print("\n2. GET /api/control-tower/kpi/definitions/")
    response = client.get('/api/control-tower/kpi/definitions/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        defs = data.get('definitions', {})
        print(f"   Domains: {list(defs.keys())}")

    # Test 3: Create RAG Document
    print("\n3. POST /api/rag/documents/")
    response = client.post('/api/rag/documents/',
        data=json.dumps({
            'doc_type': 'report',
            'title': 'Phase 2 Test Document',
            'category': 'test',
        }),
        content_type='application/json',
        HTTP_HOST='localhost'
    )
    print(f"   Status: {response.status_code}")
    doc_id = None
    if response.status_code == 201:
        data = response.json()
        doc_id = data.get('id')
        print(f"   Document ID: {doc_id}")
        print(f"   Title: {data.get('title')}")

    # Test 4: List Documents
    print("\n4. GET /api/rag/documents/")
    response = client.get('/api/rag/documents/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Count: {data.get('count', len(data.get('results', data)))}")

    # Test 5: Process Document
    if doc_id:
        print(f"\n5. POST /api/rag/documents/{doc_id}/process/")
        content = "Phase 2 RAG test content for semantic chunking. " * 20
        response = client.post(f'/api/rag/documents/{doc_id}/process/',
            data=json.dumps({
                'content': content,
                'chunk_type': 'semantic',
                'chunk_size': 200,
                'chunk_overlap': 50
            }),
            content_type='application/json',
            HTTP_HOST='localhost'
        )
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Chunks: {data.get('chunk_count')}")
            print(f"   Success: {data.get('success')}")

    # Test 6: Vector Store Stats
    print("\n6. GET /api/rag/vector-store/stats/")
    response = client.get('/api/rag/vector-store/stats/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Total Chunks: {data.get('total_chunks')}")
        print(f"   Embedded: {data.get('embedded_chunks')}")

    # Test 7: RAG Search
    print("\n7. POST /api/rag/retrieval/search/")
    response = client.post('/api/rag/retrieval/search/',
        data=json.dumps({
            'query': 'semantic chunking test',
            'top_k': 5,
            'threshold': 0.5
        }),
        content_type='application/json',
        HTTP_HOST='localhost'
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Results: {data.get('result_count')}")
        print(f"   Time: {data.get('search_time_ms')}ms")

    # Test 8: Drill-down Available
    print("\n8. GET /api/control-tower/drilldown/available/")
    response = client.get('/api/control-tower/drilldown/available/?domain=production', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Drill-downs: {len(data.get('drilldowns', []))}")
        for dd in data.get('drilldowns', [])[:3]:
            print(f"      - {dd.get('kpi_id')}: {dd.get('name')}")

    # Test 9: KPI Drill-down
    print("\n9. POST /api/control-tower/drilldown/kpi/")
    response = client.post('/api/control-tower/drilldown/kpi/',
        data=json.dumps({
            'domain': 'production',
            'kpi_id': 'defect_rate',
            'filters': {}
        }),
        content_type='application/json',
        HTTP_HOST='localhost'
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        summary = data.get('summary', {})
        print(f"   Current: {summary.get('current_value')}")
        print(f"   Status: {summary.get('status')}")

    print("\n=== Phase 2 API Tests Completed ===\n")


if __name__ == '__main__':
    main()
