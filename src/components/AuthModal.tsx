import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, Store, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const res = await api.login(email, password);
        if (res.success) {
          api.setToken(res.token);
          onLoginSuccess(res.user);
          onClose();
        }
      } else {
        const res = await api.register(name, email, password, role);
        if (res.success) {
          api.setToken(res.token);
          onLoginSuccess(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleChoice: 'BUYER' | 'SELLER' | 'ADMIN') => {
    setIsLogin(true);
    if (roleChoice === 'BUYER') {
      setEmail('buyer.alice@nilamart.com');
      setPassword('buyer123');
    } else if (roleChoice === 'SELLER') {
      setEmail('seller.tech@nilamart.com');
      setPassword('seller123');
    } else {
      setEmail('admin@nilamart.com');
      setPassword('admin123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {isLogin ? 'Sign In to NilaMart' : 'Create Your Account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isLogin
              ? 'Access orders, wishlist, seller studio, or admin dashboard'
              : 'Register as a verified Buyer or merchant Seller'}
          </p>
        </div>

        {/* 1-Click Fast Fill Test Accounts */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1.5">
            Quick Fill Demo Accounts:
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <button
              type="button"
              onClick={() => handleQuickFill('BUYER')}
              className="px-2 py-1 bg-white hover:bg-sky-50 hover:text-sky-700 border border-slate-200 rounded-lg font-semibold transition-colors"
            >
              Buyer (Alice)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('SELLER')}
              className="px-2 py-1 bg-white hover:bg-amber-50 hover:text-amber-700 border border-slate-200 rounded-lg font-semibold transition-colors"
            >
              Seller (Tech)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('ADMIN')}
              className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg font-semibold transition-colors"
            >
              Admin Controller
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {!isLogin && (
            <>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('BUYER')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      role === 'BUYER'
                        ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Buyer Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('SELLER')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      role === 'SELLER'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Seller Account
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-sky-500 outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <span>{isLogin ? 'Sign In to Account' : 'Register New Account'}</span>
            )}
          </button>
        </form>

        {/* Toggle Login/Register */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-sky-600 font-bold hover:underline"
              >
                Register Here
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-sky-600 font-bold hover:underline"
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
