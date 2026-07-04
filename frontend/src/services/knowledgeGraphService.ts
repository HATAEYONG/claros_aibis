/**
 * 지식 그래프 서비스 - 온톨로지 기반 지식 그래프 API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 지식 그래프 관련 타입
export type NodeType = 'entity' | 'concept' | 'relationship' | 'event' | 'process';
export type RelationType = 'causal' | 'temporal' | 'spatial' | 'hierarchical' | 'association' | 'dependency' | 'transformation';

export interface GraphNode {
  node_id: string;
  node_type: NodeType;
  name: string;
  code?: string;
  category?: string;
  labels: string[];
  properties: Record<string, any>;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  edge_id: string;
  source: string;
  target: string;
  relationship_type: RelationType;
  properties: Record<string, any>;
  weight: number;
  confidence: number;
}

export interface GraphStatistics {
  node_count: number;
  edge_count: number;
  is_directed: boolean;
  density: number;
  avg_degree: number;
}

export interface NeighborNode extends GraphNode {
  edge?: {
    source: string;
    target: string;
    relationship_type: RelationType;
    weight: number;
    confidence: number;
  };
}

/**
 * 지식 그래프 통계 조회
 */
export async function getGraphStatistics(): Promise<GraphStatistics> {
  const response = await fetch(`${API_BASE_URL}/knowledge-graph/statistics/`);
  if (!response.ok) {
    throw new Error('Failed to fetch graph statistics');
  }
  return response.json();
}

/**
 * 그래프 노드 조회
 */
export async function getGraphNode(nodeId: string): Promise<GraphNode | null> {
  const response = await fetch(`${API_BASE_URL}/knowledge-graph/nodes/${nodeId}/`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch graph node');
  }
  return response.json();
}

/**
 * 이웃 노드 조회
 */
export async function getGraphNeighbors(
  nodeId: string,
  depth: number = 1,
  direction: 'in' | 'out' | 'both' = 'both'
): Promise<NeighborNode[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('depth', depth.toString());
  queryParams.append('direction', direction);

  const response = await fetch(`${API_BASE_URL}/knowledge-graph/neighbors/${nodeId}/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch graph neighbors');
  }
  return response.json();
}

/**
 * 경로 찾기
 */
export async function findGraphPath(
  sourceId: string,
  targetId: string,
  method: 'shortest' | 'all' = 'shortest'
): Promise<Array<{
  nodes: string[];
  edges: Array<{
    source: string;
    target: string;
    relationship_type: RelationType;
    weight: number;
    confidence: number;
  }>;
  length: number;
}>> {
  const queryParams = new URLSearchParams();
  queryParams.append('method', method);

  const response = await fetch(`${API_BASE_URL}/knowledge-graph/path/${sourceId}/${targetId}/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to find graph path');
  }
  return response.json();
}

/**
 * 하위 그래프 추출
 */
export async function getSubgraph(
  nodeIds: string[],
  includeNeighbors: boolean = false,
  neighborDepth: number = 1
): Promise<{
  nodes: GraphNode[];
  edges: GraphEdge[];
  statistics: {
    node_count: number;
    edge_count: number;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/knowledge-graph/subgraph/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      node_ids: nodeIds,
      include_neighbors: includeNeighbors,
      neighbor_depth: neighborDepth,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get subgraph');
  }
  return response.json();
}

/**
 * 중심성 분석
 */
export async function getCentralityMeasures(
  nodeId?: string,
  limit: number = 10
): Promise<{
  node_id?: string;
  degree_centrality?: number;
  betweenness_centrality?: number;
  closeness_centrality?: number;
  pagerank?: number;
  top_degree_centrality?: Array<{
    node_id: string;
    value: number;
    name: string;
  }>;
  top_betweenness_centrality?: Array<{
    node_id: string;
    value: number;
    name: string;
  }>;
  top_pagerank?: Array<{
    node_id: string;
    value: number;
    name: string;
  }>;
}> {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());

  const url = nodeId
    ? `${API_BASE_URL}/knowledge-graph/centrality/${nodeId}/?${queryParams}`
    : `${API_BASE_URL}/knowledge-graph/centrality/?${queryParams}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to get centrality measures');
  }
  return response.json();
}

/**
 * 커뮤니티 탐지
 */
export async function findCommunities(method: 'louvain' | 'label_propagation' = 'louvain'): Promise<Array<{
  community_id: number;
  node_count: number;
  nodes: string[];
}>> {
  const queryParams = new URLSearchParams();
  queryParams.append('method', method);

  const response = await fetch(`${API_BASE_URL}/knowledge-graph/communities/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to find communities');
  }
  return response.json();
}

/**
 * 영향도 분석
 */
export async function getImpactAnalysis(
  nodeId: string,
  direction: 'downstream' | 'upstream' = 'downstream'
): Promise<Array<{
  node_id: string;
  name: string;
  node_type: NodeType;
  category?: string;
}>> {
  const queryParams = new URLSearchParams();
  queryParams.append('direction', direction);

  const response = await fetch(`${API_BASE_URL}/knowledge-graph/impact/${nodeId}/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to get impact analysis');
  }
  return response.json();
}

/**
 * 그래프 시각화 데이터 조회
 */
export async function getGraphVisualizationData(
  rootId: string,
  depth: number = 2
): Promise<{
  nodes: Array<{
    id: string;
    label: string;
    type: NodeType;
    category?: string;
    data: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: RelationType;
    data: Record<string, any>;
  }>;
}> {
  // 하위 그래프 조회
  const subgraph = await getSubgraph([rootId], true, depth);

  // 시각화용 형식 변환
  const nodes = subgraph.nodes.map(node => ({
    id: node.node_id,
    label: node.name,
    type: node.node_type,
    category: node.category,
    data: node,
  }));

  const edges = subgraph.edges.map(edge => ({
    id: edge.edge_id,
    source: edge.source,
    target: edge.target,
    label: edge.relationship_type,
    data: edge,
  }));

  return { nodes, edges };
}

/**
 * 온톨로지 검색
 */
export async function searchOntology(
  query: string,
  nodeType?: NodeType,
  category?: string
): Promise<GraphNode[]> {
  const queryParams = new URLSearchParams();
  queryParams.append('q', query);
  if (nodeType) queryParams.append('node_type', nodeType);
  if (category) queryParams.append('category', category);

  const response = await fetch(`${API_BASE_URL}/knowledge-graph/search/?${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to search ontology');
  }
  return response.json();
}

/**
 * 온톨로지 카테고리별 노드 조회
 */
export async function getNodesByCategory(category: string): Promise<GraphNode[]> {
  const response = await fetch(`${API_BASE_URL}/knowledge-graph/nodes/category/${category}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch nodes for category: ${category}`);
  }
  return response.json();
}

/**
 * 온톨로지 유형별 노드 조회
 */
export async function getNodesByType(nodeType: NodeType): Promise<GraphNode[]> {
  const response = await fetch(`${API_BASE_URL}/knowledge-graph/nodes/type/${nodeType}/`);
  if (!response.ok) {
    throw new Error(`Failed to fetch nodes for type: ${nodeType}`);
  }
  return response.json();
}

/**
 * 6M/4M2E 온톨로지 데이터 조회
 */
export async function get6MOntology(category?: string): Promise<{
  category: string;
  elements: Array<{
    code: string;
    name_ko: string;
    name_en: string;
    description: string;
  }>;
  relations: Array<{
    source: string;
    target: string;
    relation_type: string;
    weight: number;
  }>;
}> {
  const queryParams = category ? `?category=${category}` : '';
  const response = await fetch(`${API_BASE_URL}/ontology/6m/${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch 6M ontology');
  }
  return response.json();
}

/**
 * 4M2E 온톨로지 데이터 조회
 */
export async function get4M2EOntology(category?: string): Promise<{
  category: string;
  elements: Array<{
    code: string;
    name_ko: string;
    name_en: string;
    description: string;
  }>;
  relations: Array<{
    source: string;
    target: string;
    relation_type: string;
    weight: number;
  }>;
}> {
  const queryParams = category ? `?category=${category}` : '';
  const response = await fetch(`${API_BASE_URL}/ontology/4m2e/${queryParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch 4M2E ontology');
  }
  return response.json();
}
