import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  Plus, Search, Trash2, Loader2, X, Palette, Calendar, CheckSquare
} from 'lucide-react';

const PROJECT_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#84cc16', '#15803d', '#65a30d', '#166534', '#86efac'];

function Avatar({ name, size = 28 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-mono font-bold text-white flex-shrink-0 bg-orbit-500"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

export default function Projects() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: PROJECT_COLORS[0], dueDate: '', status: 'Active' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      if (data.success) setProjects(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/projects', form);
      if (data.success) {
        setProjects(prev => [data.data, ...prev]);
        setShowModal(false);
        setForm({ name: '', description: '', color: PROJECT_COLORS[0], dueDate: '', status: 'Active' });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-orbit-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-dark-text tracking-tight">Projects</h1>
          <p className="text-dark-muted text-sm mt-1">{filtered.length} project{filtered.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          className="input w-full pl-10"
        />
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(project => {
          const tasks = project.tasks || [];
          const done = tasks.filter(t => t.status === 'Done').length;
          const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
          const members = project.members?.map(m => m.user) || [];

          return (
            <div
              key={project.id}
              className="card hover:border-orbit-500/30 transition-all cursor-pointer group"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div
                className="h-1 -mx-5 -mt-5 mb-4 rounded-t-xl"
                style={{ background: project.color }}
              />
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-dark-text text-base">{project.name}</h3>
                {(isAdmin || project.ownerId === user?.id) && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteProject(project.id); }}
                    className="p-1.5 rounded-md text-dark-muted hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-dark-muted text-sm mb-4 line-clamp-2">{project.description}</p>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-dark-muted">{done}/{tasks.length} tasks</span>
                <span className="text-xs font-bold font-mono" style={{ color: project.color }}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-dark-border rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: project.color }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((m, i) => (
                    <div key={m.id} className="border-2 border-dark-surface rounded-full">
                      <Avatar name={m.name} size={26} />
                    </div>
                  ))}
                  {members.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-dark-border border-2 border-dark-surface flex items-center justify-center text-[10px] font-bold text-dark-accent">
                      +{members.length - 4}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  project.status === 'Active' ? 'bg-orbit-500/10 text-orbit-400' :
                  project.status === 'Completed' ? 'bg-orbit-500/10 text-orbit-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          );
        })}

        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="card border-dashed border-2 border-dark-border hover:border-orbit-500/40 flex flex-col items-center justify-center gap-3 min-h-[200px] text-dark-muted hover:text-orbit-400 transition-all"
          >
            <Plus className="w-8 h-8" />
            <span className="font-semibold text-sm">New Project</span>
          </button>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-dark-text">Create Project</h3>
              <button onClick={() => setShowModal(false)} className="btn-ghost p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Project Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Website Redesign"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What is this project about?"
                  rows={3}
                  className="input w-full resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-surface' : ''}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-dark-accent uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="input w-full"
                  >
                    <option>Active</option>
                    <option>OnHold</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={createProject} disabled={creating || !form.name.trim()} className="btn-primary">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
