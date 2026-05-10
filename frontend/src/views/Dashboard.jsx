import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  FolderKanban, CheckSquare, CheckCircle2, AlertTriangle,
  ArrowRight, Loader2, Calendar
} from 'lucide-react';

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-dark-border rounded" />
        <div className="w-8 h-8 bg-dark-border rounded-lg" />
      </div>
      <div className="h-8 w-12 bg-dark-border rounded" />
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-dark-border" />
      <div className="flex-1">
        <div className="h-3 w-32 bg-dark-border rounded mb-1" />
        <div className="h-2 w-20 bg-dark-border rounded" />
      </div>
      <div className="h-5 w-16 bg-dark-border rounded" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        if (data.success) setStats(data.data);
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = stats ? [
    { label: 'My Projects', value: stats.myProjectsCount, icon: FolderKanban, color: 'text-orbit-400', bg: 'bg-orbit-500/10' },
    { label: 'Open Tasks', value: stats.openTasks, icon: CheckSquare, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Completed', value: stats.completedTasks, icon: CheckCircle2, color: 'text-orbit-400', bg: 'bg-orbit-500/10' },
    { label: 'Overdue', value: stats.overdueTasks, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ] : [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-7 w-48 bg-dark-border rounded mb-2 animate-pulse" />
          <div className="h-4 w-64 bg-dark-border rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <div className="h-4 w-32 bg-dark-border rounded mb-4 animate-pulse" />
            {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
          </div>
          <div className="card">
            <div className="h-4 w-24 bg-dark-border rounded mb-4 animate-pulse" />
            {[1,2,3].map(i => <SkeletonRow key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-dark-text font-semibold mb-2">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-dark-text tracking-tight">
          {greeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-dark-muted text-sm mt-1">Here's what's happening in your workspace.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-dark-muted uppercase tracking-wider">{s.label}</span>
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-dark-text font-mono">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-dark-text">Recent Activity</h3>
            <button onClick={() => navigate('/tasks')} className="btn-ghost text-xs">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1">
            {stats?.recentTasks?.length === 0 && (
              <p className="text-dark-muted text-sm text-center py-8">No recent activity</p>
            )}
            {stats?.recentTasks?.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-dark-surface/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/projects/${task.projectId}`)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.status === 'Done' ? 'bg-orbit-500' :
                  task.status === 'InProgress' ? 'bg-yellow-400' :
                  task.status === 'Review' ? 'bg-blue-400' : 'bg-dark-muted'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-dark-text truncate">{task.title}</div>
                  <div className="text-xs text-dark-muted">{task.project?.name}</div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  task.status === 'Done' ? 'bg-orbit-500/10 text-orbit-400' :
                  task.status === 'InProgress' ? 'bg-yellow-500/10 text-yellow-400' :
                  task.status === 'Review' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-dark-border text-dark-muted'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* My Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-dark-text">My Projects</h3>
            <button onClick={() => navigate('/projects')} className="btn-ghost text-xs">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {stats?.myProjects?.length === 0 && (
              <p className="text-dark-muted text-sm text-center py-8">No projects yet</p>
            )}
            {stats?.myProjects?.map(project => {
              const total = project.tasks?.length || 0;
              const done = project.tasks?.filter(t => t.status === 'Done').length || 0;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="p-3 rounded-lg bg-dark-surface/30 border border-dark-border hover:border-orbit-500/30 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: project.color }} />
                    <span className="text-sm font-semibold text-dark-text truncate flex-1">{project.name}</span>
                    <span className="text-xs text-dark-muted font-mono">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: project.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
