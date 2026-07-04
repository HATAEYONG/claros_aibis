# Phase 2: 지능 계층 확장 상세 설계

## 1. 개요

Phase 2에서는 지능 계층을 확장하여 참조 플랫폼의 지식 그래프와 RAG 시스템을 구현합니다.

**예상 기간**: 2-3주
**주요 목표**:
1. Ontology 확장
2. RAG 시스템 구축
3. Control Tower 강화

---

## 2. Ontology 확장

### 2.1 설계 개요

참조 플랫폼의 `apps/ontology/` 구조를 참조하여 기업 온톨로지를 정의하고 그래프 쿼리를 지원합니다.

### 2.2 파일 구조

```
ontology/
├── __init__.py
├── apps.py
├── models.py                    # 온톨로지 모델 (확장)
├── services/
│   ├── __init__.py
│   ├── ontology_service.py     # 온톨로지 관리 서비스
│   ├── graph_query_service.py   # 그래프 쿼리 서비스
│   └── entity_extraction_service.py  # 엔티티 추출 서비스
├── queries/
│   ├── __init__.py
│   ├── base.py                  # 쿼리 기반 클래스
│   ├── kpi_queries.py           # KPI 관련 쿼리
│   ├── causal_queries.py        # 인과관계 쿼리
│   └── impact_queries.py        # 영향분석 쿼리
└── graph/
    ├── __init__.py
    ├── models.py                # 그래프 모델 (Node, Edge)
    └── repository.py            # 그래프 저장소
```

### 2.3 데이터 모델 확장

```python
# ontology/models.py (확장)
from django.db import models
import uuid

class OntologyClass(models.Model):
    """온톨로지 클래스"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent_class = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    is_abstract = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ontology_class'
        verbose_name = '온톨로지 클래스'

class OntologyProperty(models.Model):
    """온톨로지 속성"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    domain_class = models.ForeignKey(OntologyClass, on_delete=models.CASCADE, related_name='properties')
    property_type = models.CharField(max_length=50)  # string, integer, float, date, boolean
    is_required = models.BooleanField(default=False)
    is_unique = models.BooleanField(default=False)
    default_value = models.TextField(blank=True)

    class Meta:
        db_table = 'ontology_property'
        verbose_name = '온톨로지 속성'

class OntologyRelationType(models.Model):
    """온톨로지 관계 유형"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100, unique=True)
    label = models.CharField(max_length=100)
    inverse_label = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    domain_class = models.ForeignKey(OntologyClass, on_delete=models.CASCADE, related_name='outgoing_relations')
    range_class = models.ForeignKey(OntologyClass, on_delete=models.CASCADE, related_name='incoming_relations')
    is_symmetric = models.BooleanField(default=False)
    is_transitive = models.BooleanField(default=False)

    class Meta:
        db_table = 'ontology_relation_type'
        verbose_name = '온톨로지 관계 유형'
```

### 2.4 그래프 모델

```python
# ontology/graph/models.py
from django.db import models
import uuid

class GraphNode(models.Model):
    """그래프 노드 (엔티티)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    ontology_class = models.ForeignKey(OntologyClass, on_delete=models.CASCADE)
    entity_id = models.CharField(max_length=255)  # 외부 시스템의 엔티티 ID
    name = models.CharField(max_length=255)
    properties = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'graph_node'
        verbose_name = '그래프 노드'
        indexes = [
            models.Index(fields=['entity_id']),
            models.Index(fields=['ontology_class']),
        ]

class GraphEdge(models.Model):
    """그래프 엣지 (관계)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    relation_type = models.ForeignKey(OntologyRelationType, on_delete=models.CASCADE)
    source_node = models.ForeignKey(GraphNode, on_delete=models.CASCADE, related_name='outgoing_edges')
    target_node = models.ForeignKey(GraphNode, on_delete=models.CASCADE, related_name='incoming_edges')
    weight = models.FloatField(default=1.0)
    properties = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'graph_edge'
        verbose_name = '그래프 엣지'
        indexes = [
            models.Index(fields=['source_node', 'target_node']),
            models.Index(fields=['relation_type']),
        ]
```

### 2.5 온톨로지 서비스

```python
# ontology/services/ontology_service.py
from typing import Dict, List, Any
from ontology.models import OntologyClass, OntologyProperty, OntologyRelationType
from ontology.graph.models import GraphNode, GraphEdge

class OntologyService:
    """온톨로지 관리 서비스"""

    def create_entity(self, class_name: str, entity_id: str, name: str, properties: dict) -> GraphNode:
        """엔티티 생성"""
        ontology_class = OntologyClass.objects.get(name=class_name)

        # 속성 검증
        self._validate_properties(ontology_class, properties)

        node = GraphNode.objects.create(
            ontology_class=ontology_class,
            entity_id=entity_id,
            name=name,
            properties=properties
        )

        return node

    def create_relation(self, source_id: str, target_id: str, relation_type: str, properties: dict = None):
        """관계 생성"""
        source = GraphNode.objects.get(id=source_id)
        target = GraphNode.objects.get(id=target_id)
        relation = OntologyRelationType.objects.get(name=relation_type)

        edge = GraphEdge.objects.create(
            relation_type=relation,
            source_node=source,
            target_node=target,
            properties=properties or {}
        )

        return edge

    def query_graph(self, query: str) -> List[Dict[str, Any]]:
        """그래프 쿼리 실행"""
        # TODO: Gremlin 또는 Cypher 구문 파싱 및 실행
        pass

    def _validate_properties(self, ontology_class: OntologyClass, properties: dict):
        """속성 검증"""
        for prop in ontology_class.properties.all():
            if prop.is_required and prop.name not in properties:
                raise ValueError(f"Required property {prop.name} is missing")
```

### 2.6 쿼리 템플릿

```python
# ontology/queries/kpi_queries.py
from ontology.queries.base import GraphQuery

class KPIImpactQuery(GraphQuery):
    """KPI 영향분석 쿼리"""

    def build_query(self, kpi_id: str) -> str:
        """
        KPI에 영향을 미치는 요인들을 찾는 쿼리

        MATCH path = (kpi:KPI)<-[:AFFECTS]-(factor)
        RETURN factor, path
        ORDER BY path.weight DESC
        LIMIT 10
        """
        return f"""
        MATCH (kpi:KPI {{entity_id: '{kpi_id}'}})<-[:AFFECTS]-(factor)
        RETURN factor, kpi
        ORDER BY factor.weight DESC
        LIMIT 10
        """

class RootCauseQuery(GraphQuery):
    """근본 원인 분석 쿼리"""

    def build_query(self, event_id: str) -> str:
        """
        이벤트의 근본 원인을 찾는 쿼리

        MATCH path = (event)<-[:CAUSED_BY]*-(root)
        RETURN root, path
        ORDER BY path.length ASC
        LIMIT 5
        """
        return f"""
        MATCH (event:Event {{entity_id: '{event_id}'}})<-[:CAUSED_BY]*-(root)
        RETURN root, event
        ORDER BY length([rel in relationships(event) | rel]) ASC
        LIMIT 5
        """
```

---

## 3. RAG 시스템 구축

### 3.1 설계 개요

참조 플랫폼의 `apps/rag/` 구조를 참조하여 문서 검색 시스템을 구현합니다.

### 3.2 파일 구조

```
ai/rag/
├── __init__.py
├── models.py                    # 문서, 청크, 임베딩 모델
├── services/
│   ├── __init__.py
│   ├── document_processor.py   # 문서 처리 서비스
│   ├── chunking_service.py     # 문서 청킹 서비스
│   ├── embedding_service.py    # 임베딩 서비스
│   ├── vector_store.py         # 벡터 저장소 (확장)
│   └── retrieval_service.py    # 검색 서비스
├── chunkers/
│   ├── __init__.py
│   ├── base.py                 # 청커 기반 클래스
│   ├── semantic_chunker.py     # 시맨틱 청커
│   └── fixed_size_chunker.py    # 고정 크기 청커
└── embeddings/
    ├── __init__.py
    ├── base.py                 # 임베딩 기반 클래스
    └── openai_embedding.py     # OpenAI 임베딩
```

### 3.3 데이터 모델

```python
# ai/rag/models.py
from django.db import models
import uuid

class Document(models.Model):
    """문서 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    title = models.CharField(max_length=255)
    content = models.TextField()
    source_type = models.CharField(max_length=50)  # policy, sop, report, etc.
    source_uri = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    indexed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'rag_document'
        verbose_name = 'RAG 문서'

class DocumentChunk(models.Model):
    """문서 청크 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    sequence_number = models.IntegerField()
    content = models.TextField()
    metadata = models.JSONField(default=dict)
    token_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rag_document_chunk'
        verbose_name = '문서 청크'
        ordering = ['document', 'sequence_number']

class Embedding(models.Model):
    """임베딩 모델"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    chunk = models.ForeignKey(DocumentChunk, on_delete=models.CASCADE, related_name='embeddings')
    model = models.CharField(max_length=50)  # text-embedding-3-small
    vector = models.JSONField()  # 벡터 값
    dimension = models.IntegerField(default=1536)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rag_embedding'
        verbose_name = '임베딩'
        indexes = [
            models.Index(fields=['chunk', 'model']),
        ]
```

### 3.4 문서 처리 파이프라인

```python
# ai/rag/services/document_processor.py
from typing import Dict, List, Any
from ai.rag.models import Document, DocumentChunk, Embedding
from ai.rag.services.chunking_service import ChunkingService
from ai.rag.services.embedding_service import EmbeddingService

class DocumentProcessor:
    """문서 처리 파이프라인"""

    def __init__(self):
        self.chunking_service = ChunkingService()
        self.embedding_service = EmbeddingService()

    def process_document(
        self,
        title: str,
        content: str,
        source_type: str,
        source_uri: str = None,
        metadata: dict = None
    ) -> Document:
        """
        문서 처리 및 인덱싱

        Args:
            title: 문서 제목
            content: 문서 내용
            source_type: 소스 유형
            source_uri: 소스 URI
            metadata: 메타데이터

        Returns:
            Document: 처리된 문서
        """
        # 1. 문서 생성
        document = Document.objects.create(
            title=title,
            content=content,
            source_type=source_type,
            source_uri=source_uri,
            metadata=metadata or {}
        )

        # 2. 문서 청킹
        chunks = self.chunking_service.chunk_document(document)

        # 3. 임베딩 생성
        for chunk in chunks:
            embedding = self.embedding_service.create_embedding(chunk)
            Embedding.objects.create(
                chunk=chunk,
                model=self.embedding_service.model,
                vector=embedding,
                dimension=len(embedding)
            )

        # 4. 인덱싱 완료 시간 업데이트
        from django.utils import timezone
        document.indexed_at = timezone.now()
        document.save()

        return document
```

### 3.5 시맨틱 청커

```python
# ai/rag/chunkers/semantic_chunker.py
from typing import List
from ai.rag.chunkers.base import BaseChunker
from ai.rag.models import Document, DocumentChunk

class SemanticChunker(BaseChunker):
    """시맨틱 청커 - 문맥 유지 청킹"""

    def __init__(self, max_chunk_size: int = 500, overlap: int = 50):
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap

    def chunk_document(self, document: Document) -> List[DocumentChunk]:
        """
        시맨틱 청킹 수행

        - 문장 단위로 분리
        - 문맥 유지를 위해 오버랩 추가
        - 청크 크기 제한 준수
        """
        import re

        # 문장 분리
        sentences = re.split(r'(?<=[.!?])\s+', document.content)

        chunks = []
        current_chunk = []
        current_size = 0

        for i, sentence in enumerate(sentences):
            sentence_size = len(sentence.split())

            # 청크 크기 제한 확인
            if current_size + sentence_size > self.max_chunk_size and current_chunk:
                # 청크 저장
                chunk = DocumentChunk.objects.create(
                    document=document,
                    sequence_number=len(chunks),
                    content=' '.join(current_chunk),
                    token_count=current_size,
                    metadata={
                        'sentence_count': len(current_chunk),
                        'start_index': i - len(current_chunk),
                        'end_index': i
                    }
                )
                chunks.append(chunk)

                # 오버랩 유지
                overlap_sentences = current_chunk[-self.overlap:] if self.overlap > 0 else []
                current_chunk = overlap_sentences
                current_size = sum(len(s.split()) for s in current_chunk)

            current_chunk.append(sentence)
            current_size += sentence_size

        # 마지막 청크 저장
        if current_chunk:
            chunk = DocumentChunk.objects.create(
                document=document,
                sequence_number=len(chunks),
                content=' '.join(current_chunk),
                token_count=current_size,
                metadata={
                    'sentence_count': len(current_chunk),
                    'start_index': len(sentences) - len(current_chunk),
                    'end_index': len(sentences)
                }
            )
            chunks.append(chunk)

        return chunks
```

### 3.6 검색 서비스

```python
# ai/rag/services/retrieval_service.py
from typing import List, Dict, Any
from ai.rag.models import Document, DocumentChunk, Embedding
from ai.rag.services.embedding_service import EmbeddingService

class RetrievalService:
    """검색 서비스"""

    def __init__(self):
        self.embedding_service = EmbeddingService()

    def search(
        self,
        query: str,
        top_k: int = 5,
        source_type: str = None
    ) -> List[Dict[str, Any]]:
        """
        의미적 검색

        Args:
            query: 검색 쿼리
            top_k: 반환할 결과 수
            source_type: 필터링할 소스 유형

        Returns:
            List[Dict]: 검색 결과
        """
        # 1. 쿼리 임베딩
        query_embedding = self.embedding_service.create_embedding_text(query)

        # 2. 유사도 계산
        from django.db.models import Q
        import numpy as np

        embeddings = Embedding.objects.select_related('chunk__document').all()

        if source_type:
            embeddings = embeddings.filter(chunk__document__source_type=source_type)

        results = []
        for emb in embeddings[:100]:  # 테스트용 제한
            # 코사인 유사도 계산
            similarity = self._cosine_similarity(query_embedding, emb.vector)

            results.append({
                'document_id': str(emb.chunk.document.id),
                'chunk_id': str(emb.chunk.id),
                'document_title': emb.chunk.document.title,
                'content': emb.chunk.content,
                'similarity': similarity,
                'metadata': emb.chunk.metadata
            })

        # 3. 상위 k개 반환
        results.sort(key=lambda x: x['similarity'], reverse=True)
        return results[:top_k]

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """코사인 유사도 계산"""
        import numpy as np
        a = np.array(vec1)
        b = np.array(vec2)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)
```

---

## 4. Control Tower 강화

### 4.1 설계 개요

참조 플랫폼의 `apps/control_tower/` 구조를 참조하여 경영관점 대시보드를 강화합니다.

### 4.2 파일 구조

```
control_tower/
├── __init__.py
├── apps.py
├── models.py                    # 확장
├── services/
│   ├── __init__.py
│   ├── kpi_aggregation_service.py  # KPI 집계 서비스
│   ├── alert_management_service.py  # 알림 관리 서비스
│   └── dashboard_service.py       # 대시보드 서비스
└── serializers.py
```

### 4.3 경영관점 대시보드 모델

```python
# control_tower/models.py (확장)
from django.db import models
import uuid

class ExecutiveDashboard(models.Model):
    """경영관점 대시보드"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    layout = models.JSONField(default=dict)  # 위젯 정보
    refresh_interval = models.IntegerField(default=300)  # 5분
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'executive_dashboard'
        verbose_name = '경영관점 대시보드'

class DashboardWidget(models.Model):
    """대시보드 위젯"""
    WIDGET_TYPES = [
        ('kpi_card', 'KPI 카드'),
        ('trend_chart', '트렌드 차트'),
        ('alert_list', '알림 목록'),
        ('metric_summary', '메트릭 요약'),
        ('recommendation_panel', '권고사항 패널'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    dashboard = models.ForeignKey(ExecutiveDashboard, on_delete=models.CASCADE, related_name='widgets')
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPES)
    title = models.CharField(max_length=100)
    position = models.JSONField()  # {x, y, width, height}
    config = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'dashboard_widget'
        verbose_name = '대시보드 위젯'
```

### 4.4 KPI 집계 서비스

```python
# control_tower/services/kpi_aggregation_service.py
from typing import Dict, List, Any
from datetime import datetime, timedelta
from django.db.models import Avg, Max, Min, Sum

from ai.models import KPIDefinition, KPIActual

class KPIAggregationService:
    """KPI 집계 서비스"""

    def get_executive_summary(self) -> Dict[str, Any]:
        """
        경영관점 KPI 요약

        Returns:
            Dict: KPI 요약 데이터
        """
        # 핵심 KPI 목록
        core_kpis = ['revenue', 'operating_profit', 'production_volume', 'quality_rate', 'inventory_turnover']

        summary = {}
        for kpi_code in core_kpis:
            try:
                kpi_def = KPIDefinition.objects.get(code=kpi_code)
                latest = KPIActual.objects.filter(kpi=kpi_def).order_by('-period').first()

                summary[kpi_code] = {
                    'name': kpi_def.name,
                    'current_value': latest.actual_value if latest else None,
                    'target_value': kpi_def.target_value,
                    'achievement_rate': (latest.actual_value / kpi_def.target_value * 100) if latest and kpi_def.target_value else None,
                    'trend': self._calculate_trend(kpi_def),
                }
            except KPIDefinition.DoesNotExist:
                continue

        return summary

    def get_department_performance(self, department: str) -> Dict[str, Any]:
        """부서별 성과"""
        # TODO: 부서별 KPI 집계
        pass

    def _calculate_trend(self, kpi_def: KPIDefinition, periods: int = 7) -> str:
        """KPI 추이 계산"""
        recent = KPIActual.objects.filter(
            kpi=kpi_def
        ).order_by('-period')[:periods]

        if len(recent) < 2:
            return 'stable'

        values = [k.actual_value for k in recent if k.actual_value is not None]
        if len(values) < 2:
            return 'stable'

        # 단순 추세 계산
        if values[0] > values[-1]:
            return 'down'
        elif values[0] < values[-1]:
            return 'up'
        else:
            return 'stable'
```

### 4.5 알림 관리 서비스

```python
# control_tower/services/alert_management_service.py
from typing import List, Dict, Any
from events.models import Event
from events.taxonomy import EventSeverity, EventTaxonomy

class AlertManagementService:
    """알림 관리 서비스"""

    SEVERITY_PRIORITY = {
        EventSeverity.CRITICAL: 1,
        EventSeverity.HIGH: 2,
        EventSeverity.MEDIUM: 3,
        EventSeverity.LOW: 4,
    }

    def get_active_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        활성 알림 목록

        Args:
            limit: 반환할 알림 수

        Returns:
            List[Dict]: 알림 목록
        """
        events = Event.objects.filter(
            status='open'
        ).order_by('-created_at')[:limit]

        alerts = []
        for event in events:
            event_type = EventTaxonomy.get_event_type(event.event_type)
            severity = EventTaxonomy.get_default_severity(event_type)

            alerts.append({
                'id': str(event.id),
                'event_type': event.event_type,
                'severity': severity.value,
                'priority': self.SEVERITY_PRIORITY.get(severity, 99),
                'scope_type': event.scope_type,
                'scope_id': event.scope_id,
                'observed_value': event.observed_value,
                'threshold_value': event.threshold_value,
                'created_at': event.created_at.isoformat(),
                'description': EventTaxonomy.get_event_metadata(event_type).get('description', ''),
            })

        # 우선순위 정렬
        alerts.sort(key=lambda x: x['priority'])
        return alerts

    def get_alert_summary(self) -> Dict[str, int]:
        """알림 요약"""
        from django.db.models import Count

        events = Event.objects.filter(status='open')

        return {
            'total': events.count(),
            'critical': events.filter(severity='critical').count(),
            'high': events.filter(severity='high').count(),
            'medium': events.filter(severity='medium').count(),
            'low': events.filter(severity='low').count(),
        }
```

---

## 5. API 설계

### 5.1 Ontology API

```python
# ontology/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class OntologyViewSet(viewsets.ViewSet):
    """온톨로지 API"""

    @action(detail=False, methods=['post'])
    def create_entity(self, request):
        """엔티티 생성"""
        pass

    @action(detail=False, methods=['post'])
    def query_graph(self, request):
        """그래프 쿼리"""
        pass

    @action(detail=False, methods=['get'])
    def get_classes(self, request):
        """온톨로지 클래스 목록"""
        pass
```

### 5.2 RAG API

```python
# ai/rag/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class DocumentViewSet(viewsets.ModelViewSet):
    """문서 관리 API"""

    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """문서 처리 및 인덱싱"""
        pass

class SearchViewSet(viewsets.ViewSet):
    """검색 API"""

    @action(detail=False, methods=['post'])
    def search(self, request):
        """의미적 검색"""
        query = request.data.get('query')
        top_k = request.data.get('top_k', 5)
        source_type = request.data.get('source_type')

        from ai.rag.services.retrieval_service import RetrievalService
        service = RetrievalService()

        results = service.search(query, top_k, source_type)

        return Response({'results': results})
```

### 5.3 Control Tower API

```python
# control_tower/views.py (확장)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class ControlTowerViewSet(viewsets.ViewSet):
    """컨트롤 타워 API"""

    @action(detail=False, methods=['get'])
    def executive_summary(self, request):
        """경영관점 요약"""
        from control_tower.services.kpi_aggregation_service import KPIAggregationService
        service = KPIAggregationService()

        summary = service.get_executive_summary()

        return Response(summary)

    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """활성 알림 목록"""
        from control_tower.services.alert_management_service import AlertManagementService
        service = AlertManagementService()

        alerts = service.get_active_alerts()
        summary = service.get_alert_summary()

        return Response({
            'summary': summary,
            'alerts': alerts
        })
```

---

## 6. 구현 일정

### Week 1

**Day 1-2: Ontology 모델**
- [ ] 데이터 모델 생성
- [ ] 마이그레이션

**Day 3-4: GraphQuery 서비스**
- [ ] 그래프 쿼리 서비스
- [ ] KPIImpactQuery
- [ ] RootCauseQuery

**Day 5: Ontology API**
- [ ] REST API 구현

### Week 2

**Day 1-3: RAG 시스템**
- [ ] 문서 처리 파이프라인
- [ ] 시맨틱 청커
- [ ] 임베딩 서비스

**Day 4-5: 검색 서비스**
- [ ] RetrievalService
- [ ] RAG API

### Week 3

**Day 1-2: Control Tower 강화**
- [ ] ExecutiveDashboard 모델
- [ ] KPI 집계 서비스

**Day 3-4: 알림 관리**
- [ ] AlertManagementService
- [ ] Control Tower API

**Day 5: 통합 테스트**
- [ ] API 테스트
- [ ] 성능 최적화

---

## 7. 의존성

### 7.1 외부 라이브러리

```
# 임베딩
openai>=1.0.0  # OpenAI API
sentence-transformers>=2.2.0  # 로컬 임베딩

# 그래프 데이터베이스 (선택)
neo4j>=5.0.0  # Neo4j
```

### 7.2 내부 모듈

- events: EventTaxonomy
- ai: KPIAgent 등
- control_tower: 기존 구현

---

**작성자**: Claude Code
**승인자**: [승인 필요]
**버전**: 1.0
