import { useEffect, useState } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../hooks/useAuth.js';
import {
  Users, Loader2, Crown, Trash2, Edit2, X, Check, Loader
} from 'lucide-react';

function Avatar({ name, size = 40 }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center justify-center rounded-full font-mono font-bold text-white flex-shrink-0 bg-orbit-500"
      style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'Member' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (id) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${id}`, editForm);
      if (data.success) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data.data } : u));
        setEditingId(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Remove this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

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
        <h1 className="text-2xl font-extrabold text-dark-text tracking-tight">Team</h1>
        <p className="text-dark-muted text-sm mt-1">{users.length} members in workspace</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const isEditing = editingId === u.id;
          const isMe = u.id === user?.id;

          return (
            <div key={u.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size={44} />
                  <div className="min-w-0">
                    {isEditing ? (
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="input w-full text-sm py-1"
                      />
                    ) : (
                      <div className="font-bold text-dark-text text-sm">{u.name}</div>
                    )}
                    <div className="text-xs text-dark-muted">{u.email}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveUser(u.id)} disabled={saving} className="p-1.5 rounded-md text-orbit-400 hover:bg-orbit-500/10">
                        {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-md text-dark-muted hover:bg-dark-border">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingId(u.id); setEditForm({ name: u.name, role: u.role }); }}
                        className="p-1.5 rounded-md text-dark-muted hover:text-dark-accent hover:bg-dark-border transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isMe && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-1.5 rounded-md text-dark-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {isEditing ? (
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                    className="input text-xs py-1"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                ) : (
                  <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${
                    u.role === 'Admin' ? 'bg-orbit-500/10 text-orbit-400' : 'bg-dark-border text-dark-muted'
                  }`}>
                    {u.role === 'Admin' && <Crown className="w-3 h-3" />}
                    {u.role}
                  </span>
                )}
                {isMe && (
                  <span className="text-xs font-bold px-2 py-1 rounded bg-orbit-500/10 text-orbit-400">
                    You
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Projects', value: u._count?.projectMembers || 0 },
                  { label: 'Tasks', value: u._count?.tasksAssigned || 0 },
                  { label: 'Owned', value: u._count?.ownedProjects || 0 },
                ].map(stat => (
                  <div key={stat.label} className="bg-[#0d1a10] rounded-lg p-2 text-center">
                    <div className="text-lg font-extrabold text-dark-text font-mono">{stat.value}</div>
                    <div className="text-[10px] text-dark-muted uppercase tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
