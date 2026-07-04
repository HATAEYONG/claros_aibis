# -*- coding: utf-8 -*-
"""
Phase 2 API Test Script (No Auth)
Tests the new Phase 2 endpoints with authentication bypass
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework.test import APIClient
import json


def test_with_auth():
    """Test APIs with proper authentication"""
    print("\n=== Phase 2 API Tests (With Authentication) ===\n")

    # Create API client
    client = APIClient()

    # Create or get a test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print("Created test user: testuser")

    # Authenticate the client
    client.force_authenticate(user=user)
    print("Authenticated as testuser\n")

    # Test 1: KPI Dashboard
    print("1. Testing KPI Dashboard...")
    response = client.get('/api/control-tower/kpi/dashboard/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Period Type: {data.get('period', {}).get('type')}")
        print(f"   Critical Alerts: {data.get('summary', {}).get('critical_count')}")
        print(f"   Warning Alerts: {data.get('summary', {}).get('warning_count')}")

    # Test 2: KPI Definitions
    print("\n2. Testing KPI Definitions...")
    response = client.get('/api/control-tower/kpi/definitions/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        domains = list(data.get('definitions', {}).keys())
        print(f"   Available Domains: {domains}")

    # Test 3: Available Drill-downs
    print("\n3. Testing Available Drill-downs...")
    response = client.get('/api/control-tower/drilldown/available/?domain=production')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        drilldowns = data.get('drilldowns', [])
        print(f"   Available Drill-downs: {len(drilldowns)}")
        for dd in drilldowns:
            print(f"      - {dd.get('kpi_id')}: {dd.get('name')}")

    # Test 4: Create RAG Document
    print("\n4. Creating RAG Document...")
    response = client.post('/api/rag/documents/', data={
        'doc_type': 'report',
        'title': 'Phase 2 Test Document',
        'category': 'test',
        'tags': ['phase2', 'test'],
        'author': 'Test User'
    }, format='json')
    print(f"   Status: {response.status_code}")
    doc_id = None
    if response.status_code == 201:
        data = response.json()
        doc_id = data.get('id')
        print(f"   Document Created: {doc_id}")
        print(f"   Title: {data.get('title')}")
    else:
        print(f"   Error: {response.data}")

    # Test 5: List RAG Documents
    print("\n5. Listing RAG Documents...")
    response = client.get('/api/rag/documents/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Total Documents: {data.get('count', len(data))}")
        for doc in data.get('results', data)[:3]:
            print(f"      - {doc.get('title')} ({doc.get('doc_type')})")

    # Test 6: Process Document (if doc_id exists)
    if doc_id:
        print("\n6. Processing Document (Semantic Chunking)...")
        test_content = """
        Phase 2 RAG System Test Document

        This document contains multiple paragraphs to test the semantic
        chunking functionality of the RAG system. The system should split
        this content into meaningful chunks that preserve context.

        Each chunk will be embedded and stored in the vector database for
        semantic search and retrieval. This enables the system to find
        relevant content based on meaning rather than keywords.

        The RAG system supports multiple chunking strategies:
        - Semantic chunking for natural language boundaries
        - Fixed-size chunking for consistent processing
        - Recursive chunking for hierarchical content
        """

        response = client.post(f'/api/rag/documents/{doc_id}/process/', data={
            'content': test_content,
            'chunk_type': 'semantic',
            'chunk_size': 100,
            'chunk_overlap': 20
        }, format='json')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Chunks Created: {data.get('chunk_count')}")
            print(f"   Success: {data.get('success')}")
        else:
            print(f"   Error: {response.data}")

    # Test 7: RAG Search
    print("\n7. Testing RAG Semantic Search...")
    response = client.post('/api/rag/retrieval/search/', data={
        'query': 'RAG system semantic chunking',
        'top_k': 5,
        'threshold': 0.5
    }, format='json')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Results Found: {data.get('result_count')}")
        print(f"   Search Time: {data.get('search_time_ms')}ms")
        if data.get('results'):
            print(f"   Top Result Similarity: {data.get('results')[0].get('similarity', 0):.4f}")

    # Test 8: Vector Store Stats
    print("\n8. Getting Vector Store Statistics...")
    response = client.get('/api/rag/vector-store/stats/')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Total Chunks: {data.get('total_chunks')}")
        print(f"   Embedded Chunks: {data.get('embedded_chunks')}")
        print(f"   Completion Rate: {data.get('completion_rate')}%")

    # Test 9: RAG Context Generation
    print("\n9. Testing RAG Context Generation...")
    response = client.post('/api/rag/retrieval/generate_context/', data={
        'query': 'semantic chunking and vector embeddings',
        'max_tokens': 500,
        'top_k': 3
    }, format='json')
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Context Length: {len(data.get('context', ''))} chars")
        print(f"   Source Count: {data.get('source_count')}")
        print(f"   Token Count: {data.get('token_count')}")

    # Test 10: KPI Drill-down
    print("\n10. Testing KPI Drill-down (Production/Defect Rate)...")
    response = client.post('/api/control-tower/drilldown/kpi/', data={
        'domain': 'production',
        'kpi_id': 'defect_rate',
        'filters': {}
    }, format='json')
    print(f"    Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        summary = data.get('summary', {})
        print(f"    Current Value: {summary.get('current_value')}")
        print(f"    Status: {summary.get('status')}")
        print(f"    Target Value: {summary.get('target_value')}")

    # Test 11: RAG Retrieval History
    print("\n11. Testing RAG Retrieval History...")
    response = client.get('/api/rag/retrieval/history/?limit=10')
    print(f"    Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        logs = data.get('logs', [])
        print(f"    Recent Searches: {len(logs)}")

    print("\n=== Phase 2 API Tests Completed ===\n")


def test_endpoints_summary():
    """Show a summary of all Phase 2 endpoints"""
    print("\n=== Phase 2 API Endpoints Summary ===\n")

    endpoints = {
        "KPI Monitoring": [
            "GET  /api/control-tower/kpi/dashboard/ - KPI dashboard overview",
            "GET  /api/control-tower/kpi/kpis/ - Domain-specific KPIs",
            "GET  /api/control-tower/kpi/history/ - KPI historical data",
            "POST /api/control-tower/kpi/alert/ - Create KPI alert",
            "GET  /api/control-tower/kpi/definitions/ - KPI definitions",
        ],
        "Drill-down": [
            "POST /api/control-tower/drilldown/kpi/ - KPI drill-down analysis",
            "GET  /api/control-tower/drilldown/event/ - Event drill-down",
            "GET  /api/control-tower/drilldown/available/ - Available drill-downs",
        ],
        "RAG System": [
            "GET  /api/rag/documents/ - List documents",
            "POST /api/rag/documents/ - Create document",
            "POST /api/rag/documents/{id}/process/ - Process & chunk document",
            "POST /api/rag/documents/{id}/rechunk/ - Re-chunk document",
            "GET  /api/rag/chunks/ - List chunks",
            "POST /api/rag/retrieval/search/ - Semantic search",
            "POST /api/rag/retrieval/search_with_rerank/ - Search with reranking",
            "POST /api/rag/retrieval/generate_context/ - Generate RAG context",
            "GET  /api/rag/retrieval/history/ - Retrieval history",
            "GET  /api/rag/vector-store/stats/ - Vector store statistics",
            "POST /api/rag/vector-store/search/ - Vector similarity search",
        ],
        "Ontology (Graph Query)": [
            "GraphQueryService.query_affects() - AFFECTS relationship traversal",
            "GraphQueryService.query_caused_by() - CAUSED_BY relationship traversal",
            "GraphQueryService.query_connected_to() - CONNECTED_TO relationship",
            "GraphQueryService.find_shortest_path() - Shortest path finding",
            "EntityExtractionService.extract_entities() - Entity extraction from text",
        ]
    }

    for category, api_list in endpoints.items():
        print(f"\n{category}:")
        for api in api_list:
            print(f"  {api}")

    print("\n" + "="*60 + "\n")


if __name__ == '__main__':
    test_endpoints_summary()
    test_with_auth()
