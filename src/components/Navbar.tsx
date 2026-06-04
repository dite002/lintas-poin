import React from 'react';
import { Newspaper, Settings2, ShieldCheck, Database, Search, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentRole: 'reader' | 'admin';
  setRole: (role: 'reader' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onResetDb: () => void;
  isResetting: boolean;
  currentUser: UserType | null;
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export default function Navbar({
  currentRole,
  setRole,
  searchQuery,
  setSearchQuery,
  onResetDb,
  isResetting,
  currentUser,
  onLogout,
  onNavigate,
}: NavbarProps) {
  const [showSettings, setShowSettings] = React.useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/95 backdrop-blur-md px-4 py-3 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand Logo & Badge */}
        <div className="flex items-center justify-between">
          <div onClick={() => onNavigate('/')} className="flex items-center cursor-pointer group">
            <div className="flex h-10 sm:h-12 items-center justify-center overflow-hidden bg-transparent transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Lintas Poin Logo" className="h-full w-auto object-contain" />
            </div>
          </div>

          {currentRole === 'admin' && currentUser && (
            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Search, System control */}
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:gap-4">
          {/* Main search bar */}
          {currentRole === 'reader' && (
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berita..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 font-sans text-sm text-blue-900 placeholder-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Profile & Settings Option */}
          {currentRole === 'admin' && currentUser && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.8 font-sans text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Database className="h-3.5 w-3.5 text-slate-600" />
                <span>{currentUser ? currentUser.fullname : 'Menu Redaksi'}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              </button>

              {/* Dropdown settings options */}
              <AnimatePresence>
                {showSettings && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSettings(false)}
                    ></div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-lg z-20"
                    >
                      {currentUser ? (
                        <div>
                          <h3 className="font-sans text-xs font-bold text-blue-900">
                            Profil Redaktur
                          </h3>
                          <p className="mt-1 font-sans text-xs text-slate-500 leading-relaxed">
                            Anda masuk sebagai <strong className="text-orange-600">{currentUser.fullname}</strong> (@{currentUser.username}).
                          </p>
                          <button
                            onClick={() => {
                              onLogout();
                              setShowSettings(false);
                            }}
                            className="mt-3 flex items-center justify-center gap-2 w-full rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 font-sans text-xs font-semibold tracking-tight transition-all"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>Keluar Akun</span>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-sans text-xs font-bold text-blue-900">
                            Sistem Lintas Poin
                          </h3>
                          <p className="mt-1 font-sans text-xs text-slate-500 leading-relaxed">
                            Sistem manajemen konten portal berita nasional yang terintegrasi secara aman.
                          </p>
                        </div>
                      )}
                      
                      {currentUser?.role === 'developer' && (
                        <>
                          <div className="my-3 border-t border-slate-100"></div>
                          <button
                            disabled={isResetting}
                            onClick={() => {
                              if (confirm('Atur ulang seluruh database ke data asal demo? Tindakan ini akan menghapus semua berita dan akun buatan Anda.')) {
                                onResetDb();
                                setShowSettings(false);
                              }
                            }}
                            className="w-full rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-3 py-2 font-sans text-xs font-semibold tracking-tight transition-all disabled:opacity-50"
                          >
                            {isResetting ? 'Mereset...' : 'Atur Ulang ke Data Demo'}
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Mobile panel options */}
      <AnimatePresence>
        {showSettings && currentRole === 'admin' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden mt-3 border-t border-slate-200 pt-3 flex flex-col gap-2 bg-slate-100 p-3 rounded-lg"
          >
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-orange-600 font-sans text-xs font-bold">
                  <User className="h-4 w-4 text-slate-600" />
                  <span>Petugas Redaksi: {currentUser.fullname}</span>
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setShowSettings(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full rounded-lg bg-white border border-slate-200 text-slate-700 py-2 text-xs font-semibold shadow-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-600 font-sans text-xs font-bold">
                <Database className="h-4 w-4 text-slate-600" />
                <span>Media &amp; Berita Nusantara</span>
              </div>
            )}
            {currentUser?.role === 'developer' && (
              <button
                disabled={isResetting}
                onClick={() => {
                  if (confirm('Atur ulang seluruh database ke data demo?')) {
                    onResetDb();
                    setShowSettings(false);
                  }
                }}
                className="mt-1 w-full rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-2 font-sans text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isResetting ? 'Mereset...' : 'Reset Database ke Demo Default'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
