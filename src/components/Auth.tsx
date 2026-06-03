import React, { useState } from 'react';
import { ShieldCheck, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as api from '../utils/api';
import { User as UserType } from '../types';

interface AuthProps {
  onAuthSuccess: (user: UserType) => void;
  isRegisterMode: boolean; // if true, mean userCount is 0, so show Register First Admin. Otherwise Login.
  onCheckStatus: () => void;
}

export default function Auth({ onAuthSuccess, isRegisterMode, onCheckStatus }: AuthProps) {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegisterMode) {
      if (!fullname.trim() || !username.trim() || !password.trim()) {
        setError('Semua kolom pendaftaran wajib diisi');
        return;
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setError('Username dan Password wajib diisi');
        return;
      }
    }

    try {
      setLoading(true);
      if (isRegisterMode) {
        // Register first admin
        const res = await api.registerFirstUser({
          fullname: fullname.trim(),
          username: username.trim(),
          password: password.trim()
        });
        if (res.success && res.user) {
          onAuthSuccess(res.user);
        } else {
          setError('Gagal mendaftar akun utama');
        }
      } else {
        // Login
        const res = await api.loginUser({
          username: username.trim(),
          password: password.trim()
        });
        if (res.success && res.user) {
          onAuthSuccess(res.user);
        } else {
          setError('Akun tidak terdaftar atau kredensial salah');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md border-2 border-stone-800 bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] rounded-xl"
      >
        <div className="text-center space-y-3 mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-900 border border-stone-200">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 uppercase tracking-tight">
              {isRegisterMode ? 'Daftar Redaktur Utama' : 'Masuk Redaksi Lintas Poin'}
            </h2>
            <p className="font-sans text-xs text-stone-500 mt-1.5 leading-relaxed">
              {isRegisterMode
                ? 'Belum ada akun redaksi dalam sistem. Daftarkan akun Administrator Utama untuk mulai menulis berita.'
                : 'Silakan gunakan akun redaktur Anda untuk me-manajemen kearsipan berita.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 p-3.5 mb-6 text-red-700 text-xs font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div className="space-y-1.5">
              <label className="font-sans text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Nama Lengkap Anda
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Contoh: Danu Kusuma"
                  value={fullname}
                  onChange={(e) => setFullname(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 font-sans text-sm text-stone-900 focus:border-stone-800 focus:ring-1 focus:ring-stone-800 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-sans text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Username Kredensial
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Contoh: danukusuma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 font-sans text-sm text-stone-900 focus:border-stone-800 focus:ring-1 focus:ring-stone-800 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-sans text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Password Pengaman
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                placeholder="Masukkan kata sandi..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 font-sans text-sm text-stone-900 focus:border-stone-800 focus:ring-1 focus:ring-stone-800 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-stone-900 text-white font-sans text-xs font-bold uppercase tracking-wider py-2.5 hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memproses Kredensial...</span>
              </>
            ) : (
              <span>{isRegisterMode ? 'Daftar Akun Utama' : 'Masuk ke Dasbor'}</span>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-stone-100 pt-4 flex flex-col items-center justify-center gap-2">
          <p className="font-sans text-[11px] text-stone-400">
            Sistem Lintas Poin • Hak cipta Redaktur Terdaftar
          </p>
          <button
            onClick={onCheckStatus}
            className="font-sans text-[11px] font-semibold text-stone-700 hover:underline"
          >
            Periksa Status Sistem
          </button>
        </div>
      </motion.div>
    </div>
  );
}
