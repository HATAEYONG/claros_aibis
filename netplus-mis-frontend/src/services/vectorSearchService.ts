/**
 * Vector Search Service using FAISS for RAG (Retrieval Augmented Generation)
 * 벡터 데이터베이스를 사용한 시맨틱 서비스
 *
 * Features:
 * - Table/column semantic search
 * - Query history indexing
 * - Sample query retrieval
 * - Similar question finding
 */

import { DATABASE_SCHEMA, TableInfo, ColumnInfo } from './textToSqlService';

// =====================================================
// 1. Type Definitions
// =====================================================

export interface VectorDocument {
  id: string;
  content: string;
  metadata: {
    type: 'table' | 'column' | 'sample_query' | 'query_history' | 'ontology';
    tableName?: string;
    columnName?: string;
    module?: string;
    category?: string;
    timestamp?: number;
  };
  embedding?: number[];
}

export interface SearchResult {
  document: VectorDocument;
  score: number;
  reason: string;
}

export interface SearchOptions {
  limit?: number;
  minScore?: number;
  types?: VectorDocument['metadata']['type'][];
  modules?: string[];
}

export interface QueryHistory {
  id: string;
  question: string;
  sql: string;
  result: any;
  timestamp: number;
  rating?: number;
}

// =====================================================
// 2. Simple Embedding Service (Client-side)
// =====================================================

/**
 * 간단한 TF-IDF 기반 임베딩 생성
 * 실제 환경에서는 서버사이드에서 Sentence Transformer 등 사용 권장
 */
class SimpleEmbedding {
  private vocabulary: Map<string, number> = new Map();
  private documentFrequency: Map<string, number> = new Map();
  private totalDocs = 0;

  /**
   * 텍스트 전처리 (한글/영어 토큰화)
   */
  private tokenize(text: string): string[] {
    // 한글 명사 추출 (간단한 방식)
    const koreanWords = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    // 영어 단어 추출
    const englishWords = text.toLowerCase().match(/[a-z]{2,}/g) || [];
    // 숫자/단위 추출
    const numbers = text.match(/\d+[년월일개명건%원]*/g) || [];

    return [...koreanWords, ...englishWords, ...numbers];
  }

  /**
   * 어휘집 구축
   */
  buildVocabulary(documents: VectorDocument[]): void {
    this.vocabulary.clear();
    this.documentFrequency.clear();
    this.totalDocs = documents.length;

    let index = 0;
    for (const doc of documents) {
      const tokens = new Set(this.tokenize(doc.content));
      for (const token of tokens) {
        if (!this.vocabulary.has(token)) {
          this.vocabulary.set(token, index++);
        }
        this.documentFrequency.set(token, (this.documentFrequency.get(token) || 0) + 1);
      }
    }
  }

  /**
   * TF-IDF 벡터 생성
   */
  embed(text: string): number[] {
    const tokens = this.tokenize(text);
    const vector = new Array(this.vocabulary.size).fill(0);

    // Term Frequency
    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) || 0) + 1);
    }

    // TF-IDF 계산
    for (const [token, freq] of tf) {
      const idx = this.vocabulary.get(token);
      if (idx !== undefined) {
        const df = this.documentFrequency.get(token) || 1;
        const idf = Math.log(this.totalDocs / df);
        vector[idx] = (freq / tokens.length) * idf;
      }
    }

    return vector;
  }

  /**
   * 코사인 유사도 계산
   */
  cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < Math.max(vec1.length, vec2.length); i++) {
      const v1 = vec1[i] || 0;
      const v2 = vec2[i] || 0;
      dotProduct += v1 * v2;
      norm1 += v1 * v1;
      norm2 += v2 * v2;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2) || 1);
  }
}

// =====================================================
// 3. FAISS-like Vector Index
// =====================================================

class VectorIndex {
  private documents: Map<string, VectorDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private embeddingService: SimpleEmbedding = new SimpleEmbedding();

  /**
   * 인덱스에 문서 추가
   */
  addDocument(document: VectorDocument): void {
    this.documents.set(document.id, document);
    if (!document.embedding) {
      document.embedding = this.embeddingService.embed(document.content);
    }
    this.embeddings.set(document.id, document.embedding);
  }

  /**
   * 인덱스에 문서들 일괄 추가
   */
  addDocuments(documents: VectorDocument[]): void {
    // 어휘집 재구축
    this.embeddingService.buildVocabulary(documents);

    for (const doc of documents) {
      this.addDocument(doc);
    }
  }

  /**
   * 문서 삭제
   */
  removeDocument(id: string): void {
    this.documents.delete(id);
    this.embeddings.delete(id);
  }

  /**
   * 검색
   */
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const { limit = 10, minScore = 0.1, types, modules } = options;

    const queryEmbedding = this.embeddingService.embed(query);
    const results: SearchResult[] = [];

    for (const [id, document] of this.documents) {
      // 타입 필터링
      if (types && !types.includes(document.metadata.type)) continue;
      // 모듈 필터링
      if (modules && document.metadata.module && !modules.includes(document.metadata.module)) continue;

      const embedding = this.embeddings.get(id);
      if (!embedding) continue;

      const score = this.embeddingService.cosineSimilarity(queryEmbedding, embedding);

      if (score >= minScore) {
        results.push({
          document,
          score,
          reason: this.getMatchReason(query, document)
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 유사한 문서 찾기
   */
  findSimilar(documentId: string, limit: number = 5): SearchResult[] {
    const doc = this.documents.get(documentId);
    if (!doc || !doc.embedding) return [];

    const results: SearchResult[] = [];
    const embedding = doc.embedding;

    for (const [id, otherDoc] of this.documents) {
      if (id === documentId) continue;

      const otherEmbedding = this.embeddings.get(id);
      if (!otherEmbedding) continue;

      const score = this.embeddingService.cosineSimilarity(embedding, otherEmbedding);
      results.push({
        document: otherDoc,
        score,
        reason: 'Similar document'
      });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 일치 이유 분석
   */
  private getMatchReason(query: string, document: VectorDocument): string {
    const queryLower = query.toLowerCase();
    const contentLower = document.content.toLowerCase();

    const matches: string[] = [];

    // 키워드 매칭 확인
    const queryWords = new Set(this.embeddingService['tokenize'](query));
    const contentWords = new Set(this.embeddingService['tokenize'](document.content));

    for (const word of queryWords) {
      if (contentWords.has(word)) {
        matches.push(word);
      }
    }

    if (matches.length > 0) {
      return `매칭 키워드: ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`;
    }

    return '시맨틱 유사도';
  }

  /**
   * 인덱스 통계
   */
  getStats() {
    const typeCount = new Map<string, number>();
    const moduleCount = new Map<string, number>();

    for (const doc of this.documents.values()) {
      typeCount.set(doc.metadata.type, (typeCount.get(doc.metadata.type) || 0) + 1);
      if (doc.metadata.module) {
        moduleCount.set(doc.metadata.module, (moduleCount.get(doc.metadata.module) || 0) + 1);
      }
    }

    return {
      totalDocuments: this.documents.size,
      typeCount: Object.fromEntries(typeCount),
      moduleCount: Object.fromEntries(moduleCount),
      vocabularySize: this.embeddingService['vocabulary'].size
    };
  }

  /**
   * 인덱스 초기화
   */
  clear(): void {
    this.documents.clear();
    this.embeddings.clear();
  }
}

// =====================================================
// 4. Vector Search Service (Singleton)
// =====================================================

class VectorSearchService {
  private index: VectorIndex = new VectorIndex();
  private queryHistory: QueryHistory[] = [];
  private initialized = false;

  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 데이터베이스 스키마로부터 문서 생성
    const documents = this.createDocumentsFromSchema();

    // 샘플 쿼리 문서 추가
    documents.push(...this.createSampleQueryDocuments());

    // 인덱스에 문서 추가
    this.index.addDocuments(documents);

    // 로컬 스토리지에서 쿼리 히스토리 로드
    this.loadQueryHistory();

    this.initialized = true;
    console.log('[VectorSearch] Service initialized', this.index.getStats());
  }

  /**
   * 데이터베이스 스키마로부터 문서 생성
   */
  private createDocumentsFromSchema(): VectorDocument[] {
    const documents: VectorDocument[] = [];

    for (const table of DATABASE_SCHEMA) {
      // 테이블 문서
      documents.push({
        id: `table:${table.name}`,
        content: `${table.koreanName} ${table.name} ${table.description} ${table.keywords.join(' ')}`,
        metadata: {
          type: 'table',
          tableName: table.name,
          module: table.module
        }
      });

      // 컬럼 문서
      for (const column of table.columns) {
        documents.push({
          id: `column:${table.name}.${column.name}`,
          content: `${column.description} ${column.name} ${column.type}`,
          metadata: {
            type: 'column',
            tableName: table.name,
            columnName: column.name,
            module: table.module
          }
        });
      }
    }

    return documents;
  }

  /**
   * 샘플 쿼리 문서 생성
   */
  private createSampleQueryDocuments(): VectorDocument[] {
    const samples: Array<{
      question: string;
      table: string;
      module: string;
    }> = [
      { question: '사원 목록 조회', table: 'HR_EMPLOYEE', module: '인사' },
      { question: '부서별 사원 수', table: 'HR_EMPLOYEE', module: '인사' },
      { question: '월별 급여 현황', table: 'PAY_SALARY', module: '급여' },
      { question: '현재 재고 현황', table: 'MM_INVENTORY', module: '자재' },
      { question: '자재별 재고 부족 현황', table: 'MM_INVENTORY', module: '자재' },
      { question: '발주 현황', table: 'MM_PURCHASE_ORDER', module: '자재' },
      { question: '일별 생산 실적', table: 'PP_PRODUCTION', module: '생산' },
      { question: '불량률 추이', table: 'QM_INSPECTION', module: '품질' },
      { question: '불량 유형별 현황', table: 'QM_DEFECT', module: '품질' },
      { question: '월별 매출', table: 'SD_SALES', module: '영업' },
      { question: '고객별 매출 분석', table: 'SD_SALES', module: '영업' },
      { question: '제품별 원가', table: 'CO_PRODUCT_COST', module: '원가' },
      { question: '설비별 가동 현황', table: 'PM_EQUIPMENT', module: '설비' },
      { question: '보전 이력 조회', table: 'PM_MAINTENANCE', module: '설비' },
      { question: '연간 예산 현황', table: 'FI_BUDGET', module: '회계' },
      { question: '부서별 예산실적', table: 'FI_BUDGET', module: '회계' },
    ];

    return samples.map((s, idx) => ({
      id: `sample:${idx}`,
      content: s.question,
      metadata: {
        type: 'sample_query',
        tableName: s.table,
        module: s.module
      }
    }));
  }

  /**
   * 관련 테이블 검색
   */
  searchTables(query: string, options: SearchOptions = {}): Array<{ table: TableInfo; score: number }> {
    const results = this.index.search(query, {
      ...options,
      types: ['table']
    });

    return results
      .filter(r => r.document.metadata.tableName)
      .map(r => ({
        table: DATABASE_SCHEMA.find(t => t.name === r.document.metadata.tableName)!,
        score: r.score
      }))
      .filter(r => r.table);
  }

  /**
   * 관련 컬럼 검색
   */
  searchColumns(query: string, options: SearchOptions = {}): Array<{ table: TableInfo; column: ColumnInfo; score: number }> {
    const results = this.index.search(query, {
      ...options,
      types: ['column']
    });

    return results
      .filter(r => r.document.metadata.tableName && r.document.metadata.columnName)
      .map(r => {
        const table = DATABASE_SCHEMA.find(t => t.name === r.document.metadata.tableName)!;
        const column = table?.columns.find(c => c.name === r.document.metadata.columnName);
        return { table, column: column!, score: r.score };
      })
      .filter(r => r.column);
  }

  /**
   * 유사한 질문 찾기
   */
  findSimilarQuestions(query: string, limit: number = 5): Array<{ question: string; score: number; sql?: string }> {
    // 샘플 쿼리 검색
    const sampleResults = this.index.search(query, {
      limit,
      types: ['sample_query'],
      minScore: 0.2
    });

    const results: Array<{ question: string; score: number; sql?: string }> = sampleResults.map(r => ({
      question: r.document.content,
      score: r.score
    }));

    // 쿼리 히스토리 검색
    for (const history of this.queryHistory) {
      const historyEmbedding = this.index['embeddingService'].embed(history.question);
      const queryEmbedding = this.index['embeddingService'].embed(query);
      const score = this.index['embeddingService'].cosineSimilarity(historyEmbedding, queryEmbedding);

      if (score >= 0.3) {
        results.push({
          question: history.question,
          score,
          sql: history.sql
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 쿼리 히스토리 저장
   */
  saveQuery(history: QueryHistory): void {
    this.queryHistory.push(history);

    // 쿼리 히스토리 문서 추가
    this.index.addDocument({
      id: `history:${history.id}`,
      content: history.question,
      metadata: {
        type: 'query_history',
        timestamp: history.timestamp
      }
    });

    // 로컬 스토리지에 저장
    this.persistQueryHistory();
  }

  /**
   * 쿼리 히스토리 로드
   */
  private loadQueryHistory(): void {
    try {
      const stored = localStorage.getItem('vectorSearch:queryHistory');
      if (stored) {
        this.queryHistory = JSON.parse(stored);

        // 인덱스에 추가
        for (const history of this.queryHistory) {
          this.index.addDocument({
            id: `history:${history.id}`,
            content: history.question,
            metadata: {
              type: 'query_history',
              timestamp: history.timestamp
            }
          });
        }
      }
    } catch (e) {
      console.error('[VectorSearch] Failed to load query history:', e);
    }
  }

  /**
   * 쿼리 히스토리 저장
   */
  private persistQueryHistory(): void {
    try {
      localStorage.setItem('vectorSearch:queryHistory', JSON.stringify(this.queryHistory.slice(-100)));
    } catch (e) {
      console.error('[VectorSearch] Failed to save query history:', e);
    }
  }

  /**
   * 쿼리 히스토리 가져오기
   */
  getQueryHistory(): QueryHistory[] {
    return [...this.queryHistory].reverse();
  }

  /**
   * 서비스 통계
   */
  getStats() {
    return {
      index: this.index.getStats(),
      queryHistorySize: this.queryHistory.length
    };
  }

  /**
   * 서비스 초기화
   */
  reset(): void {
    this.index.clear();
    this.queryHistory = [];
    this.initialized = false;
    localStorage.removeItem('vectorSearch:queryHistory');
  }
}

// 싱글톤 인스턴스
const vectorSearchService = new VectorSearchService();

export default vectorSearchService;

// 편의 함수들
export async function initializeVectorSearch(): Promise<void> {
  return vectorSearchService.initialize();
}

export function searchRelevantTables(query: string, options?: SearchOptions) {
  return vectorSearchService.searchTables(query, options);
}

export function searchRelevantColumns(query: string, options?: SearchOptions) {
  return vectorSearchService.searchColumns(query, options);
}

export function findSimilarQuestions(query: string, limit?: number) {
  return vectorSearchService.findSimilarQuestions(query, limit);
}

export function saveQueryHistory(history: QueryHistory): void {
  vectorSearchService.saveQuery(history);
}

export function getQueryHistory(): QueryHistory[] {
  return vectorSearchService.getQueryHistory();
}

export function getVectorSearchStats() {
  return vectorSearchService.getStats();
}
