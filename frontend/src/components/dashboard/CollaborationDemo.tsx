import React, { useState } from 'react';
import { CommentSection, ShareDashboard, Comment, DashboardShare } from '@/components/common/Collaboration';
import { UsersIcon } from '@/components/icons/Icons';

const CollaborationDemo: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 'comment-001',
      author: 'John Smith',
      authorEmail: 'john@company.com',
      content: 'The sales trend for Q4 looks very promising. We should consider increasing inventory for Product A.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      replies: [
        {
          id: 'reply-001',
          author: 'Sarah Johnson',
          authorEmail: 'sarah@company.com',
          content: 'Agreed! I\'ve already contacted the supplier to secure additional stock.',
          timestamp: new Date(Date.now() - 1800000).toISOString()
        }
      ]
    },
    {
      id: 'comment-002',
      author: 'Mike Chen',
      authorEmail: 'mike@company.com',
      content: 'Can we add a breakdown by region? The team needs more detailed analysis for the upcoming planning meeting.',
      timestamp: new Date(Date.now() - 7200000).toISOString()
    }
  ]);

  const [dashboards, setDashboards] = useState<DashboardShare[]>([
    {
      id: 'dash-001',
      name: 'Executive Sales Dashboard',
      description: 'Monthly sales overview for executive team',
      sharedBy: 'Admin',
      sharedAt: new Date(Date.now() - 86400000).toISOString(),
      access: 'view',
      users: ['ceo@company.com', 'cfo@company.com'],
      isPublic: false,
      shareLink: 'https://dashboard.company.com/share/exec-sales'
    },
    {
      id: 'dash-002',
      name: 'Production Analytics',
      description: 'Real-time production metrics shared with operations team',
      sharedBy: 'Admin',
      sharedAt: new Date(Date.now() - 172800000).toISOString(),
      access: 'edit',
      users: ['ops1@company.com', 'ops2@company.com', 'manager@company.com'],
      isPublic: true,
      shareLink: 'https://dashboard.company.com/share/production'
    }
  ]);

  const handleAddComment = (content: string) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      author: 'Current User',
      authorEmail: 'current@company.com',
      content,
      timestamp: new Date().toISOString()
    };
    setComments([...comments, newComment]);
  };

  const handleReply = (commentId: string, content: string) => {
    const newReply: Comment = {
      id: `reply-${Date.now()}`,
      author: 'Current User',
      authorEmail: 'current@company.com',
      content,
      timestamp: new Date().toISOString()
    };
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          replies: [...(c.replies || []), newReply]
        };
      }
      return c;
    }));
  };

  const handleShare = (name: string, description: string, users: string[], access: 'view' | 'edit' | 'admin', isPublic: boolean) => {
    const newDashboard: DashboardShare = {
      id: `dash-${Date.now()}`,
      name,
      description,
      sharedBy: 'Current User',
      sharedAt: new Date().toISOString(),
      access,
      users,
      isPublic,
      shareLink: `https://dashboard.company.com/share/${Date.now()}`
    };
    setDashboards([...dashboards, newDashboard]);
  };

  const handleUnshare = (id: string) => {
    setDashboards(dashboards.filter(d => d.id !== id));
  };

  const handleCopyLink = (link: string) => {
    alert(`Link copied: ${link}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <UsersIcon size={32} />
          <h1 className="text-3xl font-bold">Collaboration Features</h1>
        </div>
        <p className="text-orange-100">Comments, annotations, and dashboard sharing for team collaboration</p>
      </div>

      {/* Comments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <CommentSection
          comments={comments}
          onAddComment={handleAddComment}
          onReply={handleReply}
        />
      </div>

      {/* Shared Dashboards */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <ShareDashboard
          dashboards={dashboards}
          onShare={handleShare}
          onUnshare={handleUnshare}
          onCopyLink={handleCopyLink}
        />
      </div>

      {/* Feature Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">💬</span>
            Comments & Discussions
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add contextual comments to charts and data points. Tag team members and start discussions directly within dashboards.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-6">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            Dashboard Sharing
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Share dashboards with team members using secure links. Control access levels - view, edit, or admin permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollaborationDemo;
