import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  ArrowLeft, Plus, Trash2, X, Loader2, Calendar, UserPlus, UserMinus,
  Flag, Tag, ChevronRight
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

function Avatar({ name, size = 28 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center justify-center rounded-full font-mono font-bold text-white flex-shrink-0 bg-orbit-500"
      style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assigneeId: '', priority: 'Medium', dueDate: '', status: 'Todo', tags: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      if (data.success) setProject(data.data);
    } catch (err) {
      if (err.response?.status === 404) navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const openCreateTask = () => {
    setEditTask(null);
    setTaskForm({
      title: '', description: '', assigneeId: '', priority: 'Medium', dueDate: '', status: 'Todo', tags: ''
    });
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      assigneeId: task.assigneeId || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status,
      tags: (task.tags || []).join(', ')
    });
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...taskForm,
        projectId,
        tags: taskForm.tags.split(',').map(s => s.trim()).filter(Boolean)
      };
      if (editTask) {
        await api.put(`/tasks/${editTask.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      await fetchProject();
      setShowTaskModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      await fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const moveTask = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      await fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to move task');
    }
  };

  const addMember = async (userId) => {
    try {
      await api.post(`/projects/${projectId}/members`, { userId });
      await fetchProject();
      setShowMemberModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      await fetchProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orbit-500 animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const tasks = project.tasks || [];
  const done = tasks.filter(t => t.status === 'Done').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const members = project.members?.map(m => m.user) || [];
  const canManage = isAdmin || project.ownerId === user?.id;

  return (
    <div>
      {/* Header */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-dark-muted hover:text-dark-accent text-sm mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-3 h-3 rounded mt-2 flex-shrink-0" style={{ background: project.color }} />
          <div>
            <h1 className="text-2xl font-extrabold text-dark-text tracking-tight">{project.name}</h1>
            <p className="text-dark-muted text-sm mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <button onClick={() => setShowMemberModal(true)} className="btn-secondary text-sm">
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
          )}
          <button onClick={openCreateTask} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Progress & Members */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="flex-1 w-full sm:max-w-sm">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-dark-muted">{done}/{tasks.length} tasks completed</span>
            <span className="font-bold font-mono" style={{ color: project.color }}>{pct}%</span>
          </div>
          <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: project.color }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map(m => (
              <div key={m.id} title={m.name}
                className={`border-2 border-dark-bg rounded-full ${canManage && m.id !== project.ownerId ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={() => canManage && m.id !== project.ownerId && removeMember(m.id)}>
                <Avatar name={m.name} size={28} />
              </div>
            ))}
          </div>
          {project.dueDate && (
            <span className={`text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 ${
              isOverdue(project.dueDate, project.status) ? 'bg-red-500/10 text-red-400' : 'bg-dark-surface text-dark-muted'
            }`}>
              <Calendar className="w-3 h-3" /> {project.dueDate.split('T')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {STATUSES.map(status => {
          const columnTasks = tasks.filter(t => t.status === status);
          return (
            <div key={status} className="bg-[#0d1a10] rounded-xl border border-dark-border p-3 min-w-[260px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
                  <span className="text-xs font-bold text-dark-accent uppercase tracking-wider">{status.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
                <span className="text-xs font-bold text-dark-muted bg-dark-surface px-2 py-0.5 rounded-full font-mono">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnTasks.map(task => {
                  const assignee = task.assignee;
                  const overdue = isOverdue(task.dueDate, task.status);
                  const canEdit = canManage || task.assigneeId === user?.id || task.createdBy === user?.id;

                  return (
                    <div
                      key={task.id}
                      className={`bg-dark-surface rounded-lg p-3 border cursor-pointer hover:border-orbit-500/20 transition-all ${
                        overdue ? 'border-red-500/20' : 'border-dark-border'
                      }`}
                      onClick={() => canEdit && openEditTask(task)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-dark-text leading-snug">{task.title}</span>
                        {(canManage || task.createdBy === user?.id) && (
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                            className="text-dark-muted hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-dark-muted mb-2 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {(task.tags || []).map(tag => (
                          <span key={tag} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-dark-border text-dark-muted">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        {task.dueDate && (
                          <span className={`text-[11px] flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-dark-muted'}`}>
                            <Calendar className="w-3 h-3" /> {task.dueDate.split('T')[0]}
                          </span>
                        )}
                        {assignee && <Avatar name={assignee.name} size={22} />}
                      </div>

                      {/* Move buttons */}
                      {canEdit && (
                        <div className="flex gap-1 mt-2 pt-2 border-t border-dark-border/50" onClick={e => e.stopPropagation()}>
                          {STATUSES.filter(s => s !== status).map(s => (
                            <button
                              key={s}
                              onClick={() => moveTask(task.id, s)}
                              className="flex-1 text-[10px] bg-dark-border hover:bg-orbit-500/20 text-dark-muted hover:text-orbit-400 rounded py-1 transition-colors"
                            >
                              {s.replace(/([A-Z])/g, ' $1').trim()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowTaskModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-dark-text">{editTask ? 'Edit Task' : 'Create Task'}</h3>
              <button onClick={() => setShowTaskModal(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Title</label>
                <input value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" className="input w-full" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details..." rows={3} className="input w-full resize-y" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Assignee</label>
                  <select value={taskForm.assigneeId} onChange={e => setTaskForm(f => ({ ...f, assigneeId: e.target.value }))} className="input w-full">
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} className="input w-full">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Status</label>
                  <select value={taskForm.status} onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))} className="input w-full">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Due Date</label>
                  <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} className="input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
                <input value={taskForm.tags} onChange={e => setTaskForm(f => ({ ...f, tags: e.target.value }))} placeholder="Design, Frontend, Backend" className="input w-full" />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowTaskModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={saveTask} disabled={saving || !taskForm.title.trim()} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowMemberModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-dark-text">Add Team Member</h3>
              <button onClick={() => setShowMemberModal(false)} className="btn-ghost p-1"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {(() => {
                const memberIds = new Set(members.map(m => m.id));
                // We'd need all users here - for now show placeholder
                return (
                  <p className="text-dark-muted text-sm text-center py-4">
                    Member management available in API. Fetch all users to populate this list.
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
