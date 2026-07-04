// DocumentManagement.tsx - 문서 관리 컴포넌트
import { useState } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  Download,
  Tag,
  Calendar,
  User,
  FileCode,
  FileImage,
  Film,
  Music,
  Archive,
  RefreshCw,
  Plus
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'txt' | 'xlsx' | 'pptx' | 'image' | 'video' | 'audio' | 'other';
  category: string;
  tags: string[];
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  status: 'processed' | 'processing' | 'error';
  chunkCount: number;
}

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: '품질 매뉴얼 2026.pdf',
      type: 'pdf',
      category: '품질',
      tags: ['품질', '매뉴얼', 'ISO'],
      size: 2458000,
      uploadedAt: '2026-03-25',
      uploadedBy: '김관리',
      status: 'processed',
      chunkCount: 45
    },
    {
      id: '2',
      title: '설비 운영 가이드.docx',
      type: 'docx',
      category: '설비',
      tags: ['설비', '운영', '가이드'],
      size: 1234000,
      uploadedAt: '2026-03-26',
      uploadedBy: '이설비',
      status: 'processed',
      chunkCount: 28
    },
    {
      id: '3',
      title: '원가 분석 보고서.xlsx',
      type: 'xlsx',
      category: '원가',
      tags: ['원가', '분석', '보고서'],
      size: 890000,
      uploadedAt: '2026-03-27',
      uploadedBy: '박원가',
      status: 'processed',
      chunkCount: 15
    },
    {
      id: '4',
      title: '생산 공정 표준.txt',
      type: 'txt',
      category: '생산',
      tags: ['생산', '공정', '표준'],
      size: 156000,
      uploadedAt: '2026-03-28',
      uploadedBy: '최생산',
      status: 'processed',
      chunkCount: 8
    },
    {
      id: '5',
      title: '안전 교육 자료.pptx',
      type: 'pptx',
      category: '안전',
      tags: ['안전', '교육', '교재'],
      size: 5670000,
      uploadedAt: '2026-03-29',
      uploadedBy: '정안전',
      status: 'processing',
      chunkCount: 0
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['all', '품질', '설비', '원가', '생산', '안전', '구매', '영업'];

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'xlsx':
        return <FileCode className="w-5 h-5 text-green-500" />;
      case 'pptx':
        return <FileText className="w-5 h-5 text-orange-500" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-purple-500" />;
      case 'video':
        return <Film className="w-5 h-5 text-pink-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-yellow-500" />;
      default:
        return <Archive className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">처리 완료</span>;
      case 'processing':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">처리 중</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">에러</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">문서 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            RAG 시스템을 위한 문서 업로드 및 관리
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            문서 업로드
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`p-2 rounded-lg ${
              isLoading ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
            } transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 문서 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 문서 수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{documents.length}</p>
            </div>
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">처리 완료</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {documents.filter(d => d.status === 'processed').length}
              </p>
            </div>
            <Eye className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 청크 수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {documents.reduce((sum, d) => sum + d.chunkCount, 0)}
              </p>
            </div>
            <FileCode className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">총 크기</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatFileSize(documents.reduce((sum, d) => sum + d.size, 0))}
              </p>
            </div>
            <Archive className="w-10 h-10 text-orange-500" />
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="문서 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '전체 카테고리' : cat}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">전체 상태</option>
              <option value="processed">처리 완료</option>
              <option value="processing">처리 중</option>
              <option value="error">에러</option>
            </select>
          </div>
        </div>
      </div>

      {/* 문서 목록 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">문서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">태그</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">크기</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">청크 수</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">업로더</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">업로드일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{doc.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{doc.type.toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{doc.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{formatFileSize(doc.size)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{doc.chunkCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900 dark:text-white">{doc.uploadedBy}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{doc.uploadedAt}</td>
                  <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="미리보기">
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="편집">
                        <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="다운로드">
                        <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="삭제">
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;
