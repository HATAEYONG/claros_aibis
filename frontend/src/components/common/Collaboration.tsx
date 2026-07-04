import React, { useState } from 'react';
import { UserIcon, ClockIcon, LinkIcon, MailIcon, UsersIcon, PlusIcon } from '@/components/icons/Icons';

export interface Comment {
  id: string;
  author: string;
  authorEmail: string;
  content: string;
  timestamp: string;
  replies?: Comment[];
}

export interface DashboardShare {
  id: string;
  name: string;
  description: string;
  sharedBy: string;
  sharedAt: string;
  access: 'view' | 'edit' | 'admin';
  users: string[];
  isPublic: boolean;
  shareLink: string;
}

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  onReply: (commentId: string, content: string) => void;
  currentUser?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onAddComment,
  onReply,
  currentUser = 'Current User'
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment);
      setNewComment('');
    }
  };

  const handleReply = (commentId: string) => {
    if (replyContent.trim()) {
      onReply(commentId, replyContent);
      setReplyContent('');
      setReplyTo(null);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <span>💬</span> Comments ({comments.length})
      </h3>

      {/* New Comment Input */}
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
          {currentUser.charAt(0)}
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-4 py-3 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold flex-shrink-0">
              {comment.author.charAt(0)}
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{comment.author}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(comment.timestamp)}</span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3">{comment.content}</p>

              {/* Reply Button */}
              {replyTo !== comment.id && (
                <button
                  onClick={() => setReplyTo(comment.id)}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Reply
                </button>
              )}

              {/* Reply Input */}
              {replyTo === comment.id && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none text-sm"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReply(comment.id)}
                      disabled={!replyContent.trim()}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent('');
                      }}
                      className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                  {comment.replies.map(reply => (
                    <div key={reply.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold flex-shrink-0">
                        {reply.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{reply.author}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(reply.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface ShareDashboardProps {
  dashboards: DashboardShare[];
  onShare: (name: string, description: string, users: string[], access: 'view' | 'edit' | 'admin', isPublic: boolean) => void;
  onUnshare: (id: string) => void;
  onCopyLink: (link: string) => void;
}

export const ShareDashboard: React.FC<ShareDashboardProps> = ({
  dashboards,
  onShare,
  onUnshare,
  onCopyLink
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    users: '',
    access: 'view' as 'view' | 'edit' | 'admin',
    isPublic: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = formData.users.split(',').map(u => u.trim()).filter(u => u);
    onShare(formData.name, formData.description, users, formData.access, formData.isPublic);
    setShowShareModal(false);
    setFormData({ name: '', description: '', users: '', access: 'view', isPublic: false });
  };

  const getAccessColor = (access: DashboardShare['access']) => {
    switch (access) {
      case 'view': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'edit': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <span>🔗</span> Shared Dashboards
        </h3>
        <button
          onClick={() => setShowShareModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UsersIcon size={16} />
          Share Dashboard
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Share Dashboard</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dashboard Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Share with (emails, comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.users}
                  onChange={(e) => setFormData({ ...formData, users: e.target.value })}
                  placeholder="user1@example.com, user2@example.com"
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Access Level
                </label>
                <select
                  value={formData.access}
                  onChange={(e) => setFormData({ ...formData, access: e.target.value as any })}
                  className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  <option value="view">View Only</option>
                  <option value="edit">Edit</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="rounded border-gray-300 text-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  Make publicly accessible
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Dashboards List */}
      <div className="space-y-3">
        {dashboards.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No dashboards shared yet
          </div>
        ) : (
          dashboards.map(dashboard => (
            <div key={dashboard.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{dashboard.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAccessColor(dashboard.access)}`}>
                      {dashboard.access}
                    </span>
                    {dashboard.isPublic && (
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                        Public
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{dashboard.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <UserIcon size={14} />
                      Shared by {dashboard.sharedBy}
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersIcon size={14} />
                      {dashboard.users.length} users
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon size={14} />
                      {new Date(dashboard.sharedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(dashboard.shareLink);
                      onCopyLink(dashboard.shareLink);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    title="Copy link"
                  >
                    <LinkIcon size={18} />
                  </button>
                  <button
                    onClick={() => onUnshare(dashboard.id)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    title="Unshare"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default { CommentSection, ShareDashboard };
