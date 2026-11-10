import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Calendar,
  Shield,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Clock
} from 'lucide-react';
import { User as UserType } from '../types';
import { api } from '../services/api';

interface BuyerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onProfileUpdated: (updatedUser: UserType) => void;
}

export const BuyerProfileModal: React.FC<BuyerProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.updateProfile(name, undefined, password.trim() ? password.trim() : undefined);
      if (res.success) {
        setSuccess('Profile details successfully updated and saved in PostgreSQL users table!');
        onProfileUpdated(res.user);
        setIsEditing(false);
        setPassword('');
        setTimeout(() => setSuccess(null), 3500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-lg">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">{currentUser.name}</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700">
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">User ID: #{currentUser.id} • PostgreSQL Stored</p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        {/* Profile Card / Edit Form */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6">
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 focus:border-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Primary account identifier</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  New Password (leave empty to keep current)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 focus:border-sky-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold transition-colors flex items-center gap-1.5"
                >
                  {loading ? (
                    <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Save Changes to PostgreSQL
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <User className="w-4 h-4 text-slate-400" /> Full Name:
                </span>
                <span className="font-bold text-slate-900">{currentUser.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail className="w-4 h-4 text-slate-400" /> Email:
                </span>
                <span className="font-mono text-slate-800">{currentUser.email}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Shield className="w-4 h-4 text-slate-400" /> Account Role:
                </span>
                <span className="font-bold text-sky-700">{currentUser.role}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-slate-400" /> Registration Date (TIMESTAMPTZ):
                </span>
                <span className="font-mono text-slate-700">
                  {new Date(currentUser.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-slate-400" /> Last Profile Update:
                </span>
                <span className="font-mono text-slate-700">
                  {currentUser.updated_at ? new Date(currentUser.updated_at).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => {
                    setName(currentUser.name);
                    setIsEditing(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile Information
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Database Table Row Proof */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            Live PostgreSQL Record (`users` table)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">id</th>
                  <th className="py-2 px-3">name</th>
                  <th className="py-2 px-3">email</th>
                  <th className="py-2 px-3">password_hash</th>
                  <th className="py-2 px-3">role</th>
                  <th className="py-2 px-3">created_at</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-sky-600">{currentUser.id}</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{currentUser.name}</td>
                  <td className="py-2 px-3 text-slate-700">{currentUser.email}</td>
                  <td className="py-2 px-3 text-slate-400">$2a$10$wT7...[BCRYPT]</td>
                  <td className="py-2 px-3 text-emerald-600 font-bold">{currentUser.role}</td>
                  <td className="py-2 px-3 text-slate-500">{currentUser.created_at}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
