/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CategoryFilters from './components/CategoryFilters';
import HeroSection from './components/HeroSection';
import ArticleCard from './components/ArticleCard';
import ArticleDetail from './components/ArticleDetail';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

import { Category, ArticleWithCategory, Comment, DashboardStats, User } from './types';
import * as api from './utils/api';
import { Newspaper, HelpCircle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [path, setPath] = useState<string>(() => window.location.pathname);
  const role = path === '/admin' ? 'admin' : 'reader';

  const navigateTo = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    setSelectedArticleSlug(null);
  };

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lintaspoin_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userCount, setUserCount] = useState<number>(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<ArticleWithCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);

  // Read State details
  const [detailArticle, setDetailArticle] = useState<ArticleWithCategory | null>(null);
  const [detailComments, setDetailComments] = useState<Comment[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Administrative stats state
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Global UI Spinners
  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const checkUsersCount = async () => {
    try {
      const cnt = await api.getUserCount();
      setUserCount(cnt);
    } catch (err) {
      console.error('Gagal mengambil jumlah pengguna:', err);
    }
  };

  // Core Data loader
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const fetchedCats = await api.getCategories();
      const fetchedArts = await api.getArticles({
        category: selectedCategory || undefined,
        search: searchQuery.trim() || undefined,
      });

      setCategories(fetchedCats);
      setArticles(fetchedArts);

      if (role === 'admin' && currentUser) {
        const statsData = await api.getDashboardStats();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Gagal mengambil data dari server:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount to check users
  useEffect(() => {
    checkUsersCount();
  }, []);

  // Reload core data whenever filters shift or role changes
  useEffect(() => {
    loadInitialData();
  }, [selectedCategory, searchQuery, role, currentUser]);

  // Load specific news article whenever selected slug triggers
  useEffect(() => {
    const fetchArticleDetail = async () => {
      if (!selectedArticleSlug) {
        setDetailArticle(null);
        setDetailComments([]);
        return;
      }

      try {
        setDetailLoading(true);
        const detail = await api.getArticleBySlug(selectedArticleSlug);
        setDetailArticle(detail.article);
        setDetailComments(detail.comments);
      } catch (err) {
        console.error('Error fetching article detail:', err);
        setSelectedArticleSlug(null);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchArticleDetail();
  }, [selectedArticleSlug]);

  const handleBackToGallery = () => {
    setSelectedArticleSlug(null);
    setDetailArticle(null);
    setDetailComments([]);
    // Reload articles to ensure view counts reflecting correctly
    loadInitialData();
  };

  const handleArticleClick = (slug: string) => {
    setSelectedArticleSlug(slug);
  };

  const handleCommentSubmit = async (name: string, content: string) => {
    if (!detailArticle) return;
    const newComment = await api.submitComment(detailArticle.id, name, content);
    setDetailComments((prev) => [newComment, ...prev]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lintaspoin_user');
  };

  const handleResetDatabase = async () => {
    try {
      setIsResetting(true);
      await api.resetDatabase();
      
      // Wipe clean UI tracking filters
      setSelectedCategory('');
      setSearchQuery('');
      setSelectedArticleSlug(null);
      navigateTo('/');
      setCurrentUser(null);
      localStorage.removeItem('lintaspoin_user');

      // Reload fresh seeded database
      await checkUsersCount();
      await loadInitialData();
    } catch (err) {
      alert('Gagal mereset database');
    } finally {
      setIsResetting(false);
    }
  };

  // Admin Wrapper Callbacks
  const handleCreateArticle = async (data: api.ArticleInput) => {
    const res = await api.createArticle(data);
    await loadInitialData();
    return res;
  };

  const handleUpdateArticle = async (id: number, data: api.ArticleInput) => {
    const res = await api.updateArticle(id, data);
    await loadInitialData();
    return res;
  };

  const handleDeleteArticle = async (id: number) => {
    const res = await api.deleteArticle(id);
    await loadInitialData();
    return res;
  };

  const handleCreateCategory = async (name: string) => {
    const res = await api.createCategory(name);
    await loadInitialData();
    return res;
  };

  const handleDeleteCategory = async (id: number) => {
    const res = await api.deleteCategory(id);
    await loadInitialData();
    return res;
  };

  const handleRefreshStats = async () => {
    try {
      const statsData = await api.getDashboardStats();
      setStats(statsData);
      
      // Also refresh lists to keep aligned
      const freshCats = await api.getCategories();
      const freshArts = await api.getArticles();
      setCategories(freshCats);
      setArticles(freshArts);
    } catch (err) {
      console.error('Gagal menyegarkan data stat:', err);
    }
  };

  const activeDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col min-h-screen bg-stone-50/50 text-stone-900 selection:bg-stone-900 selection:text-white">
      {/* Centered navigation bar */}
      <Navbar
        currentRole={role}
        setRole={() => {}}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onResetDb={handleResetDatabase}
        isResetting={isResetting}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={navigateTo}
      />

      {/* Main body canvas content */}
      <main className="flex-1 px-4 py-8 sm:px-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* --- ADMIN DASHBOARD --- */}
          {role === 'admin' && (
            <motion.div
              key="admin-workspace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentUser ? (
                <Dashboard
                  categories={categories}
                  articles={articles}
                  stats={stats}
                  onRefreshData={handleRefreshStats}
                  onCreateArticle={handleCreateArticle}
                  onUpdateArticle={handleUpdateArticle}
                  onDeleteArticle={handleDeleteArticle}
                  onCreateCategory={handleCreateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              ) : (
                <Auth
                  isRegisterMode={userCount === 0}
                  onAuthSuccess={(usr) => {
                    setCurrentUser(usr);
                    localStorage.setItem('lintaspoin_user', JSON.stringify(usr));
                    checkUsersCount();
                  }}
                  onCheckStatus={checkUsersCount}
                />
              )}
            </motion.div>
          )}

          {/* --- READ DETAILED ARTICLE --- */}
          {role === 'reader' && selectedArticleSlug && detailArticle && (
            <motion.div
              key="detail-workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
            >
              {detailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 text-stone-800 animate-spin" />
                  <p className="font-sans text-xs font-semibold text-stone-500">
                    Memuat rincian berita...
                  </p>
                </div>
              ) : (
                <ArticleDetail
                  article={detailArticle}
                  comments={detailComments}
                  onBack={handleBackToGallery}
                  onSubmitComment={handleCommentSubmit}
                />
              )}
            </motion.div>
          )}

          {/* --- READER NEWSROOM GRID (HOMEPAGE) --- */}
          {role === 'reader' && !selectedArticleSlug && (
            <motion.div
              key="reader-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Publisher Banner Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-stone-800 pb-4 gap-4">
                <div>
                  <h1 className="font-serif text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight leading-none uppercase">
                    Edisi Utama
                  </h1>
                  <span className="font-mono text-[10px] sm:text-xs text-stone-500 font-semibold block mt-1.5 uppercase">
                    Redaksi Independen Lintas Poin • Media Siber & Pers
                  </span>
                </div>
                <div className="text-right sm:text-right flex items-center sm:block">
                  <span className="font-serif italic text-xs block text-stone-600">
                    {activeDate}
                  </span>
                </div>
              </div>

              {/* Responsive horizontal category scrollers */}
              <CategoryFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {loading ? (
                // Skeletons / Loader State
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <RefreshCw className="h-7 w-7 text-stone-700 animate-spin" />
                  <span className="font-sans text-xs font-semibold text-stone-500">
                    Menghubungkan ke server portal dan mengurai data...
                  </span>
                </div>
              ) : (
                <>
                  {articles.length === 0 ? (
                    // Empty list state
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-200">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 mb-4">
                        <Newspaper className="h-6 w-6" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-stone-900">
                        Tidak Ada Berita Ditemukan
                      </h3>
                      <p className="font-sans text-xs text-stone-500 max-w-sm mx-auto mt-1 leading-relaxed">
                        {searchQuery.trim()
                          ? `Ulangi pencarian dengan kata kunci lain. Kata kunci "${searchQuery}" tidak menghasilkan kecocokan di database.`
                          : 'Kategori ini belum terisi berita. Silakan berpindah ke menu Redaksi untuk menulis berita pertama.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-12">
                      {/* Highlighted Flagship News (only show if no search is active) */}
                      {!searchQuery && (
                        <div className="space-y-4">
                          <HeroSection
                            articles={articles}
                            onArticleClick={handleArticleClick}
                          />
                        </div>
                      )}

                      {/* Editorial News list feed */}
                      <div className="space-y-5">
                        <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                          <span className="h-2 w-2 rounded-full bg-stone-900"></span>
                          <h3 className="font-serif text-lg font-bold text-stone-900">
                            {searchQuery ? `Hasil Pencarian ("${searchQuery}")` : 'Kabar Terkini'}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6.5">
                          {articles
                            .filter((_, idx) => searchQuery || idx > 0 || !articles.some(a => a.is_featured === true || (a.is_featured as any) === 1)) // skip hero unless search / featured checks
                            .map((art, index) => (
                              <ArticleCard
                                key={art.id}
                                article={art}
                                onClick={handleArticleClick}
                                index={index}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Aesthetic Publishing Footer */}
      <footer className="border-t border-stone-200 bg-stone-100/50 py-10 mt-16 px-4 sm:px-8 text-center text-stone-500 font-sans text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="font-serif text-base font-bold tracking-tight text-stone-900 block">
              LINTAS POIN
            </span>
            <p className="font-sans text-[11px] text-stone-500">
              Web Portal Media Siber dan Berita Nasional Terpercaya.
            </p>
          </div>
          <p className="font-mono text-[10px] text-stone-400">
            © 2026 Lintas Poin Media. Semua hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

