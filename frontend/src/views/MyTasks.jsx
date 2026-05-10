import { useEffect, useState } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  Search, Check, Loader2, Calendar, ArrowUpDown
} from 'lucide-react';

const STATUSES = ['Todo', 'InProgress', 'Review', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_COLORS = {
  Todo: 'bg-dark-muted',
  InProgress: 'bg-yellow-400',
  Review: 'bg-blue-400',
  Done: 'bg-orbit-500'
};
const PRIORITY_COLORS = {
  Low: 'text-blue-400 bg-blue-500/10',
  Medium: 'text-yellow-400 bg-yellow-500/10',
  High: 'text-orange-400 bg-orange-500/10',
  Critical: 'text-red-400 bg-red-500/10'
};

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'All', priority: 'All', search: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks/my-tasks');
      if (data.success) setTasks(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  };

  let filtered = tasks;
  if (filter.status !== 'All') filtered = filtered.filter(t => t.status === filter.status);
  if (filter.priority !== 'All') filtered = filtered.filter(t => t.priority === filter.priority);
  if (filter.search) filtered = filtered.filter(t => t.title.toLowerCase().includes(filter.search.toLowerCase()));

  filtered = filtered.sort((a, b) => {
    if (isOverdue(a.dueDate, a.status) && !isOverdue(b.dueDate, b.status)) return -1;
    if (!isOverdue(a.dueDate, a.status) && isOverdue(b.dueDate, b.status)) return 1;
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orbit-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-dark-text tracking-tight">My Tasks</h1>
        <p className="text-dark-muted text-sm mt-1">{filtered.length} task{filtered.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            placeholder="Search tasks..."
            className="input w-full pl-10"
          />
        </div>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="input"
        >
          <option>All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>)}
        </select>
        <select
          value={filter.priority}
          onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
          className="input"
        >
          <option>All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Task List */}
      <div className="card overflow-hidden p-0">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-muted text-sm">No tasks match your filters.</p>
          </div>
        )}
        {filtered.map((task, i) => {
          const project = task.project;
          const overdue = isOverdue(task.dueDate, task.status);

          return (
            <div
              key={task.id}
              className={`flex items-center gap-4 px-5 py-4 ${i < filtered.length - 1 ? 'border-b border-dark-border' : ''} ${overdue ? 'bg-red-500/5' : ''}`}
            >
              {/* Status toggle */}
              <button
                onClick={() => updateStatus(task.id, task.status === 'Done' ? 'Todo' : 'Done')}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  task.status === 'Done'
                    ? 'bg-orbit-500 border-orbit-500'
                    : 'border-dark-muted hover:border-orbit-500'
                }`}
              >
                {task.status === 'Done' && <Check className="w-3 h-3 text-white" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm font-semibold ${task.status === 'Done' ? 'text-dark-muted line-through' : 'text-dark-text'}`}>
                    {task.title}
                  </span>
                  {overdue && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
                      Overdue
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {project && (
                    <span className="text-[11px] text-dark-muted flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-sm" style={{ background: project.color }} />
                      {project.name}
                    </span>
                  )}
                  {task.dueDate && (
                    <span className={`text-[11px] flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-dark-muted'}`}>
                      <Calendar className="w-3 h-3" /> {task.dueDate.split('T')[0]}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
                <select
                  value={task.status}
                  onChange={e => updateStatus(task.id, e.target.value)}
                  className="bg-dark-border border-none rounded-md px-2 py-1 text-xs font-semibold font-mono outline-none cursor-pointer"
                  style={{ color: task.status === 'Done' ? '#22c55e' : task.status === 'InProgress' ? '#facc15' : task.status === 'Review' ? '#60a5fa' : '#5a8a6a' }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/([A-Z])/g, ' $1').trim()}</option>)}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
