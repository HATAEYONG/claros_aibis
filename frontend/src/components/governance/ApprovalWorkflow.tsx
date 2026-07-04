/**
 * 승인 워크플로우 컴포넌트
 * 승인 요청 목록 및 승인 처리 UI
 */
import React, { useState, useEffect } from 'react';
import {
  getApprovalRequests,
  approveRequest,
  rejectRequest,
  createRecommendationApproval,
  ApprovalRequest,
  ApprovalStatus
} from '../../services/governanceService';

interface ApprovalWorkflowProps {
  userId?: string;
  userRole?: string;
  onApprovalComplete?: (request: ApprovalRequest) => void;
}

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  userId,
  userRole = 'user',
  onApprovalComplete
}) => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [filter, setFilter] = useState<ApprovalStatus | 'all'>('all');

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const result = await getApprovalRequests(params);
      setRequests(result);
    } catch (error) {
      console.error('Failed to load approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, comment: string) => {
    try {
      const result = await approveRequest(requestId, userId || 'system', comment);
      setRequests(prev => prev.map(req =>
        req.request_id === requestId ? { ...req, ...result } : req
      ));
      onApprovalComplete?.(result);
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      const result = await rejectRequest(requestId, userId || 'system', reason);
      setRequests(prev => prev.map(req =>
        req.request_id === requestId ? { ...req, ...result } : req
      ));
      onApprovalComplete?.(result);
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const getStatusBadgeClass = (status: ApprovalStatus): string => {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return classes[status];
  };

  const getPriorityBadgeClass = (priority: string): string => {
    const classes = {
      L6: 'bg-red-100 text-red-800',
      L5: 'bg-orange-100 text-orange-800',
      L4: 'bg-purple-100 text-purple-800',
      L3: 'bg-blue-100 text-blue-800',
      L2: 'bg-cyan-100 text-cyan-800',
      L1: 'bg-gray-100 text-gray-800',
    };
    return classes[priority as keyof typeof classes] || classes.L1;
  };

  const getImpactBadgeClass = (impact: string): string => {
    const classes = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return classes[impact as keyof typeof classes] || classes.medium;
  };

  return (
    <div className="approval-workflow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">승인 워크플로우</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            승인 요청 관리 및 처리
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ApprovalStatus | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">전체</option>
            <option value="pending">대기</option>
            <option value="approved">승인</option>
            <option value="rejected">거부</option>
            <option value="cancelled">취소</option>
          </select>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'pending' || filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          대기 {filter === 'all' || filter === 'pending' ? `(${requests.filter(r => r.status === 'pending').length})` : ''}
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          승인됨 {filter === 'approved' ? `(${requests.filter(r => r.status === 'approved').length})` : ''}
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          거부됨 {filter === 'rejected' ? `(${requests.filter(r => r.status === 'rejected').length})` : ''}
        </button>
      </div>

      {/* 승인 요청 목록 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          표시할 승인 요청이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <ApprovalRequestCard
              key={request.request_id}
              request={request}
              onApprove={handleApprove}
              onReject={handleReject}
              getStatusBadgeClass={getStatusBadgeClass}
              getPriorityBadgeClass={getPriorityBadgeClass}
              getImpactBadgeClass={getImpactBadgeClass}
              canApprove={canApproveRequest(request, userRole)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 승인 요청 카드 컴포넌트
interface ApprovalRequestCardProps {
  request: ApprovalRequest;
  onApprove: (requestId: string, comment: string) => void;
  onReject: (requestId: string, reason: string) => void;
  getStatusBadgeClass: (status: ApprovalStatus) => string;
  getPriorityBadgeClass: (priority: string) => string;
  getImpactBadgeClass: (impact: string) => string;
  canApprove: boolean;
}

const ApprovalRequestCard: React.FC<ApprovalRequestCardProps> = ({
  request,
  onApprove,
  onReject,
  getStatusBadgeClass,
  getPriorityBadgeClass,
  getImpactBadgeClass,
  canApprove,
}) => {
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (actionType === 'approve') {
      onApprove(request.request_id, comment);
    } else {
      onReject(request.request_id, comment);
    }
    setShowActionPanel(false);
    setComment('');
  };

  const renderApprovalHistory = () => {
    return (
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">승인 이력</div>
        <div className="space-y-2">
          {request.approval_history.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                {entry.action === 'approved' && '승인'}
                {entry.action === 'rejected' && '거부'}
                {entry.action === 'created' && '생성'}
              </span>
              <span className="text-gray-600 dark:text-gray-400">{entry.approver || entry.user}</span>
              <span className="text-gray-500 dark:text-gray-500">
                {new Date(entry.timestamp).toLocaleString()}
              </span>
              {(entry.comment || entry.reason) && (
                <span className="text-gray-700 dark:text-gray-300">
                  "{entry.comment || entry.reason}"
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {/* 헤더: 제목, 승인 레벨, 상태, 업무 영향도 */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityBadgeClass(`L${request.approval_level}`)}`}>
              L{request.approval_level}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(request.status)}`}>
              {request.status === 'pending' && '대기'}
              {request.status === 'approved' && '승인'}
              {request.status === 'rejected' && '거부'}
              {request.status === 'cancelled' && '취소'}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getImpactBadgeClass(request.business_impact)}`}>
              {request.business_impact === 'critical' && '긴급'}
              {request.business_impact === 'high' && '높음'}
              {request.business_impact === 'medium' && '보통'}
              {request.business_impact === 'low' && '낮음'}
            </span>
          </div>

          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{request.title}</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{request.description}</p>

          {/* 요청자 정보 */}
          <div className="text-xs text-gray-500 mt-2">
            요청자: {request.requested_by} | 요청일: {new Date(request.created_at).toLocaleString()}
          </div>
        </div>

        {/* 액션 버튼 */}
        {request.status === 'pending' && canApprove && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActionType('approve');
                setShowActionPanel(true);
              }}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              승인
            </button>
            <button
              onClick={() => {
                setActionType('reject');
                setShowActionPanel(true);
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              거부
            </button>
          </div>
        )}
      </div>

      {/* 액션 패널 */}
      {showActionPanel && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {actionType === 'approve' ? '승인' : '거부'} 사유
          </h5>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={actionType === 'approve' ? '승인 사유를 입력하세요' : '거부 사유를 입력하세요'}
            className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSubmit}
              disabled={!comment.trim()}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              확인
            </button>
            <button
              onClick={() => {
                setShowActionPanel(false);
                setComment('');
              }}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 거부 사유 */}
      {request.status === 'rejected' && request.rejection_reason && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded">
          <div className="text-sm font-medium text-red-800 dark:text-red-300">거부 사유:</div>
          <div className="text-sm text-red-700 dark:text-red-400 mt-1">{request.rejection_reason}</div>
        </div>
      )}

      {/* 승인 이력 */}
      {request.approval_history && request.approval_history.length > 0 && renderApprovalHistory()}
    </div>
  );
};

// 헬퍼 함수
function canApproveRequest(request: ApprovalRequest, userRole: string): boolean {
  // 사용자 역할에 따른 승인 권한 체크
  if (request.status !== 'pending') {
    return false;
  }

  // 시스템 관리자는 모든 승인 가능
  if (userRole === 'admin') {
    return true;
  }

  // 승인 레벨별 권한 체크
  const roleLevelMap: Record<string, number> = {
    L1: 1,
    L2: 2,
    L3: 3,
    L4: 4,
    L5: 5,
    L6: 6,
  };

  const userLevelMap: Record<string, number> = {
    user: 1,
    manager: 2,
    senior_manager: 3,
    director: 4,
    vp: 5,
    executive: 6,
    admin: 6,
  };

  const userLevel = userLevelMap[userRole] || 1;
  const requiredLevel = request.approval_level;

  return userLevel >= requiredLevel;
}

export default ApprovalWorkflow;
