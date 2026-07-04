import React, { useState } from 'react';
import { DescriptionIcon, SearchIcon, BookIcon, CodeIcon } from '@/components/icons/Icons';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  tags: string[];
  authentication: boolean;
}

const ApiDocumentation: React.FC = () => {
  const [endpoints] = useState<ApiEndpoint[]>([
    {
      method: 'GET',
      path: '/api/monitoring/health/',
      description: '시스템 헬스 체크',
      tags: ['Monitoring', 'Public'],
      authentication: false
    },
    {
      method: 'GET',
      path: '/api/monitoring/metrics/',
      description: '시스템 메트릭 조회',
      tags: ['Monitoring', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/monitoring/api-logs/',
      description: 'API 호출 로그 조회',
      tags: ['Monitoring', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/monitoring/errors/',
      description: '에러 로그 조회',
      tags: ['Monitoring', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/monitoring/performance/',
      description: '성능 메트릭 조회',
      tags: ['Monitoring', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/security/audit-logs/',
      description: '감사 로그 조회',
      tags: ['Security', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/security/events/',
      description: '보안 이벤트 조회',
      tags: ['Security', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/security/events/statistics/',
      description: '보안 통계 조회',
      tags: ['Security', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/security/login-attempts/',
      description: '로그인 시도 조회',
      tags: ['Security', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/security/login-attempts/suspicious_ips/',
      description: '의심 IP 목록 조회',
      tags: ['Security', 'Protected'],
      authentication: true
    },
    {
      method: 'GET',
      path: '/api/docs/schema/',
      description: 'OpenAPI 스키마',
      tags: ['Documentation', 'Public'],
      authentication: false
    },
    {
      method: 'GET',
      path: '/api/docs/swagger/',
      description: 'Swagger UI',
      tags: ['Documentation', 'Public'],
      authentication: false
    },
    {
      method: 'GET',
      path: '/api/docs/redoc/',
      description: 'ReDoc UI',
      tags: ['Documentation', 'Public'],
      authentication: false
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  const tags = ['all', ...Array.from(new Set(endpoints.flatMap(e => e.tags)))];
  const methods = ['all', 'GET', 'POST', 'PUT', 'DELETE'];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-700';
      case 'POST': return 'bg-blue-100 text-blue-700';
      case 'PUT': return 'bg-yellow-100 text-yellow-700';
      case 'DELETE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'Monitoring': 'bg-blue-100 text-blue-700',
      'Security': 'bg-red-100 text-red-700',
      'Documentation': 'bg-purple-100 text-purple-700',
      'Public': 'bg-green-100 text-green-700',
      'Protected': 'bg-yellow-100 text-yellow-700'
    };
    return colors[tag] || 'bg-gray-100 text-gray-700';
  };

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || endpoint.tags.includes(selectedTag);
    const matchesMethod = selectedMethod === 'all' || endpoint.method === selectedMethod;
    return matchesSearch && matchesTag && matchesMethod;
  });

  const publicEndpoints = endpoints.filter(e => e.tags.includes('Public')).length;
  const protectedEndpoints = endpoints.filter(e => e.tags.includes('Protected')).length;

  return (
    <div className="p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">API 문서</h2>
          <p className="text-gray-600 mt-1">API 엔드포인트 문서와 사용 가이드입니다</p>
        </div>
        <div className="flex gap-2">
          <a
            href="http://localhost:8000/api/docs/swagger/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <BookIcon size={18} />
            Swagger UI
          </a>
          <a
            href="http://localhost:8000/api/docs/redoc/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <DescriptionIcon size={18} />
            ReDoc
          </a>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-blue-600 text-sm font-medium">총 API</p>
          <p className="text-2xl font-bold text-blue-700">{endpoints.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-green-600 text-sm font-medium">공개 API</p>
          <p className="text-2xl font-bold text-green-700">{publicEndpoints}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-yellow-600 text-sm font-medium">인증 필요</p>
          <p className="text-2xl font-bold text-yellow-700">{protectedEndpoints}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-purple-600 text-sm font-medium">문서 페이지</p>
          <p className="text-2xl font-bold text-purple-700">3</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <a
          href="http://localhost:8000/api/docs/swagger/"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border border-green-200 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">📚</div>
            <div>
              <h3 className="font-semibold text-green-800">Swagger UI</h3>
              <p className="text-sm text-green-600">대화형 API 문서 (http://localhost:8000/api/docs/swagger/)</p>
            </div>
          </div>
        </a>

        <a
          href="http://localhost:8000/api/docs/redoc/"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">📖</div>
            <div>
              <h3 className="font-semibold text-purple-800">ReDoc</h3>
              <p className="text-sm text-purple-600">우아한 API 문서 (http://localhost:8000/api/docs/redoc/)</p>
            </div>
          </div>
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="엔드포인트 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {methods.map(method => (
            <option key={method} value={method}>
              {method === 'all' ? '전체 메서드' : method}
            </option>
          ))}
        </select>

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {tags.map(tag => (
            <option key={tag} value={tag}>
              {tag === 'all' ? '전체 태그' : tag}
            </option>
          ))}
        </select>
      </div>

      {/* API Endpoints Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">메서드</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">경로</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">설명</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">태그</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">인증</th>
            </tr>
          </thead>
          <tbody>
            {filteredEndpoints.map((endpoint, index) => (
              <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint.path}</code>
                </td>
                <td className="px-4 py-3 text-sm">{endpoint.description}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {endpoint.tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-2 py-1 rounded text-xs font-medium ${getTagColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {endpoint.authentication ? (
                    <span className="text-yellow-600">🔒 필요</span>
                  ) : (
                    <span className="text-green-600">공개</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEndpoints.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <DescriptionIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>검색 결과가 없습니다</p>
        </div>
      )}

      {/* Usage Guide */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <CodeIcon size={18} />
          API 사용 가이드
        </h4>
        <div className="text-sm text-blue-700 space-y-2">
          <div>
            <p className="font-medium">1. 인증 (로그인 필요 API)</p>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
              <code>Authorization: Bearer YOUR_ACCESS_TOKEN</code>
            </pre>
          </div>
          <div>
            <p className="font-medium">2. 헬스 체크 예제</p>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
              <code>curl http://localhost:8000/api/monitoring/health/</code>
            </pre>
          </div>
          <div>
            <p className="font-medium">3. 인증된 요청 예제</p>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
              <code>curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/security/audit-logs/</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentation;
