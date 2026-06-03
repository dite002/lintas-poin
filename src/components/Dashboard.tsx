import React, { useState, useEffect, useRef } from 'react';
import { Category, ArticleWithCategory, DashboardStats } from '../types';
import {
  Plus,
  Trash2,
  Edit3,
  BarChart3,
  FileText,
  Tags,
  FolderPlus,
  ChevronRight,
  Eye,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Users as UsersIcon,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import * as api from '../utils/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

interface DashboardProps {
  categories: Category[];
  articles: ArticleWithCategory[];
  stats: DashboardStats | null;
  onRefreshData: () => void;
  onCreateArticle: (data: any) => Promise<any>;
  onUpdateArticle: (id: number, data: any) => Promise<any>;
  onDeleteArticle: (id: number) => Promise<any>;
  onCreateCategory: (name: string) => Promise<any>;
  onDeleteCategory: (id: number) => Promise<any>;
}

const IMAGE_PRESETS = [
  { name: 'Teknologi', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800' },
  { name: 'Keuangan/Ekonomi', url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800' },
  { name: 'Gaya Hidup/Nasional', url: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800' },
  { name: 'Olahraga', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800' },
  { name: 'Antariksa/Sains', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800' },
  { name: 'Seni/Hiburan', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800' }
];

export default function Dashboard({
  categories,
  articles,
  stats,
  onRefreshData,
  onCreateArticle,
  onUpdateArticle,
  onDeleteArticle,
  onCreateCategory,
  onDeleteCategory,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'articles' | 'categories' | 'users'>('stats');
  const [formMode, setFormMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);

  // Users Accounts Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newFullname, setNewFullname] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Article Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Redaksi Lintas Poin');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');

  // Status and Error states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [fileLoading, setFileLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsersList = async () => {
    try {
      const list = await api.getAllUsers();
      setUsersList(list);
    } catch (err) {
      console.error('Gagal mengambil daftar pengguna:', err);
    }
  };

  useEffect(() => {
    onRefreshData();
    if (activeTab === 'users') {
      loadUsersList();
    }
  }, [activeTab, formMode]);

  const clearArticleForm = () => {
    setTitle('');
    setAuthor('Redaksi Lintas Poin');
    setSummary('');
    setContent('');
    setCategoryId(categories[0]?.id.toString() || '');
    setImageUrl('');
    setIsFeatured(false);
    setEditingArticleId(null);
    setErrorMsg('');
  };

  const handleEditClick = (article: ArticleWithCategory) => {
    setTitle(article.title);
    setAuthor(article.author);
    setSummary(article.summary);
    setContent(article.content);
    setCategoryId(article.category_id.toString());
    setImageUrl(article.image_url);
    setIsFeatured(article.is_featured === true || (article.is_featured as any) === 1);
    setEditingArticleId(article.id);
    setFormMode('edit');
    setErrorMsg('');
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim() || !content.trim() || !categoryId || !imageUrl.trim()) {
      setErrorMsg('Semua kolom formulir berita wajib diisi rinciannya!');
      return;
    }

    const payload = {
      title,
      author,
      summary,
      content,
      category_id: parseInt(categoryId),
      image_url: imageUrl,
      is_featured: isFeatured,
    };

    try {
      if (formMode === 'add') {
        await onCreateArticle(payload);
        setSuccessMsg('Artikel baru berhasil diterbitkan secara lokal!');
      } else if (formMode === 'edit' && editingArticleId) {
        await onUpdateArticle(editingArticleId, payload);
        setSuccessMsg('Artikel berhasil diperbarui secara lokal!');
      }

      setFormMode('list');
      clearArticleForm();
      onRefreshData();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses artikel');
    }
  };

  const handleDeleteArticleClick = async (id: number, title: string) => {
    if (confirm(`Yakin ingin menghapus artikel "${title}" dari database SQLite?`)) {
      try {
        await onDeleteArticle(id);
        setSuccessMsg('Artikel berhasil dihapus!');
        onRefreshData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await onCreateCategory(newCatName);
      setNewCatName('');
      setSuccessMsg('Kategori baru berhasil ditambahkan!');
      onRefreshData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menambahkan kategori');
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!newFullname.trim() || !newUsername.trim() || !newPassword.trim()) {
      setUserError('Semua kolom pendaftaran wajib diisi');
      return;
    }

    try {
      const res = await api.createRedactor({
        fullname: newFullname.trim(),
        username: newUsername.trim(),
        password: newPassword.trim(),
      });
      if (res.success) {
        setUserSuccess(res.message || 'Akun redaktur baru berhasil didaftarkan!');
        setNewFullname('');
        setNewUsername('');
        setNewPassword('');
        loadUsersList();
        setTimeout(() => setUserSuccess(''), 4000);
      }
    } catch (err: any) {
      setUserError(err.message || 'Gagal mendaftarkan akun redaktur baru');
    }
  };

  const handleDeleteCategoryClick = async (id: number, name: string) => {
    if (confirm(`Yakin ingin menghapus kategori "${name}"? Ini hanya bisa dilakukan jika tidak ada artikel di bawah kategori ini.`)) {
      try {
        await onDeleteCategory(id);
        setSuccessMsg('Kategori berhasil dihapus!');
        onRefreshData();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // Convert localized disk file upload to clean Base64 to save fully offline inside SQLite!
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 8MB for base64 string storage safely in sqlite)
    if (file.size > 8 * 1024 * 1024) {
      alert('File terlalu besar! Batas unggahan gambar offline adalah 8MB.');
      return;
    }

    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setSuccessMsg('Foto offline berhasil ditransformasi ke database!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
      setFileLoading(false);
    };
    reader.onerror = () => {
      alert('Gagal memproses berkas gambar');
      setFileLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
      {/* Dashboard Left Sidebar Tabs */}
      <div className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-3 lg:pb-0 h-fit">
        <button
          onClick={() => { setActiveTab('stats'); setFormMode('list'); }}
          className={`flex-1 sm:flex-initial flex items-center gap-2.5 rounded-xl px-4 py-3 font-sans text-xs font-bold transition-all text-left whitespace-nowrap ${
            activeTab === 'stats'
              ? 'bg-stone-900 text-stone-50 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Statistik Redaksi
        </button>

        <button
          onClick={() => { setActiveTab('articles'); setFormMode('list'); }}
          className={`flex-1 sm:flex-initial flex items-center gap-2.5 rounded-xl px-4 py-3 font-sans text-xs font-bold transition-all text-left whitespace-nowrap ${
            activeTab === 'articles'
              ? 'bg-stone-900 text-stone-50 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Kelola Berita ({articles.length})
        </button>

        <button
          onClick={() => { setActiveTab('categories'); setFormMode('list'); }}
          className={`flex-1 sm:flex-initial flex items-center gap-2.5 rounded-xl px-4 py-3 font-sans text-xs font-bold transition-all text-left whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-stone-900 text-stone-50 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Tags className="h-4 w-4" />
          Menejemen Kategori
        </button>

        <button
          onClick={() => { setActiveTab('users'); setFormMode('list'); }}
          className={`flex-1 sm:flex-initial flex items-center gap-2.5 rounded-xl px-4 py-3 font-sans text-xs font-bold transition-all text-left whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-stone-900 text-stone-50 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          Kelola Redaktur
        </button>
      </div>

      {/* Dashboard Main Display Workspace */}
      <div className="lg:col-span-9 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        {/* Dynamic Alerts */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-emerald-800 text-xs font-semibold">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-100 p-3 text-red-800 text-xs font-semibold">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* --- STATS WORKSPACE --- */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-stone-850" />
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Gambaran Kinerja Redaksi
              </h2>
            </div>

            {/* Grid statistics highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl border border-stone-150 bg-stone-50/50">
                <span className="font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Total Tulisan Berita
                </span>
                <p className="font-serif text-3xl font-extrabold text-stone-900 mt-1">
                  {stats.totalArticles}
                </p>
                <div className="mt-2 text-[10px] font-mono text-stone-400">
                  Tersimpan di SQLite Lokal
                </div>
              </div>

              <div className="p-5 rounded-xl border border-stone-150 bg-stone-50/50">
                <span className="font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Total Dibaca (Traffic)
                </span>
                <p className="font-serif text-3xl font-extrabold text-stone-900 mt-1">
                  {stats.totalViews}
                </p>
                <div className="mt-2 text-[10px] font-mono text-stone-400">
                  Akumulasi Kunjungan
                </div>
              </div>

              <div className="p-5 rounded-xl border border-stone-150 bg-stone-50/50">
                <span className="font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Total Opini Pembaca
                </span>
                <p className="font-serif text-3xl font-extrabold text-stone-900 mt-1">
                  {stats.totalComments}
                </p>
                <div className="mt-2 text-[10px] font-mono text-stone-400">
                  Ulasan Aktif Komentar
                </div>
              </div>
            </div>

            {/* Recharts Traffic Visual Graph */}
            <div className="pt-4">
              <div className="mb-4">
                <h3 className="font-serif text-base font-bold text-stone-900">
                  Kunjungan per Kategori Berita
                </h3>
                <p className="font-sans text-xs text-stone-500">
                  Menampilkan kategori paling diminati dihitung dari frekuensi pembaca membuka detail naskah berita.
                </p>
              </div>

              <div className="h-72 w-full border border-stone-200 rounded-xl p-4 bg-stone-50/30">
                {stats.categoryStats && stats.categoryStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats.categoryStats}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e0" />
                      <XAxis
                        dataKey="category"
                        stroke="#78716c"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#78716c"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1c1917',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#f5f5f4'
                        }}
                        labelStyle={{ fontWeight: 'bold', fontFamily: 'sans-serif', fontSize: '11px', color: '#dbd7d2' }}
                        itemStyle={{ fontSize: '12px' }}
                      />
                      <Bar dataKey="views" radius={[4, 4, 0, 0]} name="Kunjungan">
                        {stats.categoryStats.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index % 2 === 0 ? '#1c1917' : '#78716c'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-400 text-xs">
                    Data grafik kosong. Belum ada berita.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ARTICLE MANAGEMENT WORKSPACE --- */}
        {activeTab === 'articles' && (
          <div>
            {formMode === 'list' ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-stone-850" />
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      Kelola Naskah Berita
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      clearArticleForm();
                      setFormMode('add');
                    }}
                    className="flex justify-center items-center gap-2 rounded-lg bg-stone-900 border border-stone-950 hover:bg-stone-850 px-4 py-2 font-sans text-xs font-bold text-stone-50 tracking-tight transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Tulis Berita Baru
                  </button>
                </div>

                {/* Table listing */}
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  {articles.length === 0 ? (
                    <div className="text-center py-10 bg-stone-50">
                      <p className="font-sans text-xs text-stone-500">
                        Belum ada berita tercatat. Ketuk tombol di atas untuk menerbitkan berita pertama Anda.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 font-sans text-[10px] font-bold uppercase tracking-wider text-stone-500">
                          <th className="px-5 py-3">Berita</th>
                          <th className="px-5 py-3">Kategori</th>
                          <th className="px-5 py-3 text-center">Dibaca</th>
                          <th className="px-5 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-150 font-sans text-xs">
                        {articles.map((art) => (
                          <tr key={art.id} className="hover:bg-stone-50/50 group">
                            <td className="px-5 py-3.5 max-w-xs sm:max-w-md">
                              <div className="flex items-start gap-3">
                                <img
                                  src={art.image_url}
                                  alt=""
                                  className="h-10 w-16 object-cover rounded-md bg-stone-100 flex-shrink-0"
                                />
                                <div>
                                  <span className="font-semibold text-stone-900 block group-hover:text-stone-700 leading-snug">
                                    {art.title}
                                  </span>
                                  <span className="text-[10px] text-stone-400 mt-1 block">
                                    Oleh: {art.author} | {new Date(art.created_at).toLocaleDateString('id-ID')}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="rounded bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700">
                                {art.category_name}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center font-mono font-medium text-stone-600">
                              {art.views}
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                              <button
                                onClick={() => handleEditClick(art)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition"
                                title="Edit Berita"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteArticleClick(art.id, art.title)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition"
                                title="Hapus Berita"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              // Create or Edit Naskah Form
              <form onSubmit={handleArticleSubmit} className="space-y-6">
                <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-stone-900">
                      {formMode === 'add' ? 'Redaksi Naskah Baru' : 'Menyunting Naskah'}
                    </h2>
                    <p className="font-sans text-xs text-stone-400 mt-0.5">
                      Berita akan langsung dimasukkan ke file SQLite lokal Anda.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearArticleForm();
                      setFormMode('list');
                    }}
                    className="font-sans text-xs font-semibold text-stone-500 hover:text-stone-900"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Judul Berita <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="cth: Perkembangan IoT Lokal Indonesia"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Penulis Berita
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="cth: Heru Wicaksono"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <input
                        id="is_featured"
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                      />
                      <label htmlFor="is_featured" className="font-sans text-xs font-bold text-stone-700 cursor-pointer">
                        Sorot Laporan Utama (is_featured)
                      </label>
                    </div>
                  </div>

                  {/* Image Handling Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        URL Gambar / Sampul <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Masukkan URL foto atau convert foto lokal di bawah"
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
                      />
                    </div>

                    {/* True local offline file conversion */}
                    <div className="p-3 border border-stone-200 rounded-lg bg-stone-50/50">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Upload className="h-3 w-3" />
                          Unggah File Lokal (SQLite Offline)
                        </span>
                        {fileLoading && <span className="text-stone-500 font-normal">Memproses...</span>}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 hover:border-stone-400 bg-white p-3 font-sans text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer transition"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Pilih Gambar dari Komputer (Max 8MB)
                      </button>
                    </div>

                    {/* Presets Grid */}
                    <div>
                      <span className="block font-sans text-[10px] font-bold text-stone-400 mb-1.5 uppercase tracking-wider">
                        Atau pilih Preset Ilustrasi:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {IMAGE_PRESETS.map((p, pidx) => (
                          <button
                            key={pidx}
                            type="button"
                            onClick={() => setImageUrl(p.url)}
                            className="text-center rounded border border-stone-200 hover:border-stone-500 p-1 font-sans text-[9px] font-bold text-stone-600 hover:text-stone-900 truncate"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Ringkasan Berita <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tulis paragraf pengantar singkat berita (summary) yang menarik pembaca..."
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-sans text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Naskah Lengkap <span className="text-red-500">*</span>
                    </label>
                    <span className="font-sans text-[9px] font-bold text-amber-600 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      Mendukung penulisan Markdown (###, &gt;, -)
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="### Sub-Judul Pertama&#10;Tuliskan isi berita di sini yang menjabarkan seluruh ulasan berita secara analitis...&#10;&#10;> 'Kata kutipan tanggapan narasumber yang kredibel' — Jabatan narasumber&#10;&#10;- Poin rincian data pertama&#10;- Poin rincian data kedua"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 resize-y"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => {
                      clearArticleForm();
                      setFormMode('list');
                    }}
                    className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 font-sans text-xs font-semibold text-stone-600 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-stone-900 border border-stone-950 hover:bg-stone-850 px-5 py-2 font-sans text-xs font-semibold text-stone-100 transition cursor-pointer"
                  >
                    {formMode === 'add' ? 'Terbitkan Berita' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- CATEGORY MANAGER WORKSPACE --- */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-stone-850" />
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Kelola Kategori Berita
              </h2>
            </div>

            {/* Form to submit category */}
            <form onSubmit={handleCategorySubmit} className="flex gap-3 max-w-md">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama kategori baru..."
                className="flex-1 rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex justify-center items-center gap-1.5 rounded-lg bg-stone-900 border border-stone-950 hover:bg-stone-850 px-4 py-2 font-sans text-xs font-bold text-stone-50 tracking-tight transition-all cursor-pointer"
              >
                <FolderPlus className="h-4 w-4" />
                Tambah Kategori
              </button>
            </form>

            {/* List and counts of active categories */}
            <div className="border border-stone-200 rounded-xl overflow-hidden max-w-xl">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 font-sans text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <th className="px-5 py-3">Nama Kategori</th>
                    <th className="px-5 py-3">Slug (Link)</th>
                    <th className="px-5 py-3 text-center">Jumlah Berita</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-150">
                  {categories.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-stone-50/30">
                      <td className="px-5 py-3 font-semibold text-stone-900">
                        {cat.name}
                      </td>
                      <td className="px-5 py-3 font-mono text-[10px] text-stone-400">
                        {cat.slug}
                      </td>
                      <td className="px-5 py-3 text-center font-mono font-bold text-stone-500">
                        {cat.article_count !== undefined ? cat.article_count : 0}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCategoryClick(cat.id, cat.name)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- USERS ACCOUNTS MANAGEMENT WORKSPACE --- */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-stone-850" />
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Pendaftaran &amp; Kelola Redaktur
              </h2>
            </div>

            {userSuccess && (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-100 p-3.5 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>{userSuccess}</span>
              </div>
            )}

            {userError && (
              <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-100 p-3.5 text-red-800 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{userError}</span>
              </div>
            )}

            {/* Form to submit new Redactor */}
            <div className="p-5 rounded-xl border border-stone-200 bg-stone-50/50 max-w-xl shadow-xs">
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                Daftarkan Redaktur/Kontributor Baru
              </h3>
              <form onSubmit={handleUserSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={newFullname}
                      onChange={(e) => setNewFullname(e.target.value)}
                      placeholder="cth: Akhmad Fauzi"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs text-stone-900 focus:border-stone-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      Username Kredensial
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="cth: fauzi_news"
                      className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs text-stone-900 focus:border-stone-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                    Kata Sandi Pengaman
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan sandi..."
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs text-stone-900 focus:border-stone-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-stone-900 border border-stone-950 hover:bg-stone-850 px-4 py-2 font-sans text-xs font-bold text-stone-50 tracking-tight transition-all cursor-pointer"
                >
                  Daftarkan Akun
                </button>
              </form>
            </div>

            {/* List and counts of active users */}
            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                Daftar Redaktur Terdaftar ({usersList.length})
              </h3>
              <div className="border border-stone-200 rounded-xl overflow-hidden max-w-xl">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 font-sans text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <th className="px-5 py-3">Nama Lengkap</th>
                      <th className="px-5 py-3">Username</th>
                      <th className="px-5 py-3">Jabatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-150 font-sans">
                    {usersList.map((user_row: any) => (
                      <tr key={user_row.id} className="hover:bg-stone-50/30">
                        <td className="px-5 py-3 font-semibold text-stone-900">
                          {user_row.fullname}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-stone-500">
                          @{user_row.username}
                        </td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-stone-100 border border-stone-200 px-2 py-0.5 text-[9px] font-bold text-stone-600 uppercase tracking-wider">
                            {user_row.role || 'Redaktur'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
