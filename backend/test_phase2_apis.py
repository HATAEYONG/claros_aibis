# -*- coding: utf-8 -*-
"""
Phase 2 API Test Script
Tests the new Phase 2 endpoints:
- KPI Monitoring
- RAG System
- Ontology Graph Query
- Drill-down
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.utils import timezone
from rag.models import Document
import json

def test_kpi_monitoring_apis():
    """Test KPI Monitoring APIs"""
    print("\n=== Testing KPI Monitoring APIs ===\n")

    client = Client()

    # 1. KPI Dashboard
    print("1. Testing KPI Dashboard...")
    response = client.get('/api/control-tower/kpi/dashboard/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Period: {data.get('period', {}).get('type')}")
        print(f"   Summary - Critical: {data.get('summary', {}).get('critical_count')}, Warning: {data.get('summary', {}).get('warning_count')}")

    # 2. KPI Definitions
    print("\n2. Testing KPI Definitions...")
    response = client.get('/api/control-tower/kpi/definitions/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Available domains: {list(data.get('definitions', {}).keys())}")

    # 3. KPI History
    print("\n3. Testing KPI History...")
    response = client.get('/api/control-tower/kpi/history/?domain=financial&kpi_id=revenue&days=30', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   KPI Name: {data.get('kpi_name')}")
        print(f"   Data Points: {len(data.get('data_points', []))}")


def test_rag_apis():
    """Test RAG System APIs"""
    print("\n=== Testing RAG System APIs ===\n")

    client = Client()

    # 1. Create Document
    print("1. Creating Document...")
    response = client.post('/api/rag/documents/', data=json.dumps({
        'doc_type': 'report',
        'title': 'Test Document for Phase 2',
        'category': 'test',
        'tags': ['phase2', 'test']
    }), content_type='application/json', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    doc_id = None
    if response.status_code == 201:
        data = response.json()
        doc_id = data.get('id')
        print(f"   Document ID: {doc_id}")

    # 2. Process Document (Chunking)
    if doc_id:
        print("\n2. Processing Document (Chunking)...")
        test_content = """
        This is a test document for Phase 2 RAG system implementation.
        It contains multiple paragraphs to test the semantic chunking functionality.
        The RAG system should be able to split this into meaningful chunks.
        Each chunk will be embedded and stored in the vector database.
        This enables semantic search and retrieval of relevant content.
        """
        response = client.post(f'/api/rag/documents/{doc_id}/process/', data=json.dumps({
            'content': test_content,
            'chunk_type': 'semantic',
            'chunk_size': 100,
            'chunk_overlap': 20
        }), content_type='application/json', HTTP_HOST='localhost')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Chunks Created: {data.get('chunk_count')}")
            print(f"   Chunk Type: {data.get('chunk_type')}")

    # 3. List Documents
    print("\n3. Listing Documents...")
    response = client.get('/api/rag/documents/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Total Documents: {len(data)}")

    # 4. RAG Search
    print("\n4. Testing RAG Search...")
    response = client.post('/api/rag/retrieval/search/', data=json.dumps({
        'query': 'semantic chunking RAG system',
        'top_k': 3,
        'threshold': 0.5
    }), content_type='application/json', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Results Found: {data.get('result_count')}")
        print(f"   Search Time: {data.get('search_time_ms')}ms")

    # 5. Vector Store Stats
    print("\n5. Getting Vector Store Stats...")
    response = client.get('/api/rag/vector-store/stats/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Total Chunks: {data.get('total_chunks')}")
        print(f"   Embedded Chunks: {data.get('embedded_chunks')}")
        print(f"   Completion Rate: {data.get('completion_rate')}%")


def test_ontology_apis():
    """Test Ontology Graph Query APIs"""
    print("\n=== Testing Ontology Graph Query APIs ===\n")

    client = Client()

    # 1. Get Relations Graph
    print("1. Testing Relations Graph...")
    response = client.get('/api/ontology/graph/relations/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Nodes: {data.get('node_count')}")
        print(f"   Edges: {data.get('edge_count')}")

    # 2. 4M2E Impact Analysis
    print("\n2. Testing 4M2E Impact Analysis...")
    response = client.get('/api/ontology/analysis/4m2e-impact/', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Categories Analyzed: {len(data.get('categories', []))}")


def test_drilldown_apis():
    """Test Drill-down APIs"""
    print("\n=== Testing Drill-down APIs ===\n")

    client = Client()

    # 1. Available Drill-downs
    print("1. Testing Available Drill-downs...")
    response = client.get('/api/control-tower/drilldown/available/?domain=production', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Available Drill-downs: {len(data.get('drilldowns', []))}")
        for dd in data.get('drilldowns', [])[:3]:
            print(f"      - {dd.get('kpi_id')}: {dd.get('name')}")

    # 2. KPI Drill-down
    print("\n2. Testing KPI Drill-down...")
    response = client.post('/api/control-tower/drilldown/kpi/', data=json.dumps({
        'domain': 'production',
        'kpi_id': 'defect_rate',
        'filters': {}
    }), content_type='application/json', HTTP_HOST='localhost')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        summary = data.get('summary', {})
        print(f"   Current Value: {summary.get('current_value')}")
        print(f"   Status: {summary.get('status')}")


def run_all_tests():
    """Run all Phase 2 API tests"""
    print("=" * 60)
    print("Phase 2 API Test Suite")
    print("=" * 60)

    try:
        test_kpi_monitoring_apis()
        test_rag_apis()
        test_ontology_apis()
        test_drilldown_apis()

        print("\n" + "=" * 60)
        print("Phase 2 API Tests Completed!")
        print("=" * 60)

    except Exception as e:
        print(f"\nTest Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    run_all_tests()
