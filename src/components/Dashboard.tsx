import React, { useState, useEffect, useRef } from 'react';
import { Category, ArticleWithCategory, DashboardStats, User } from '../types';
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
  ShieldAlert,
  Bold,
  Italic,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Settings
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
  currentUser?: User | null;
  siteTitle: string;
  siteTagline: string;
  onUpdateSettings: (title: string, tagline: string) => Promise<any>;
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
  currentUser,
  siteTitle,
  siteTagline,
  onUpdateSettings,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'articles' | 'categories' | 'users' | 'settings'>('stats');
  const [formMode, setFormMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);

  // Settings State
  const [localSiteTitle, setLocalSiteTitle] = useState(siteTitle || 'Edisi Utama');
  const [localSiteTagline, setLocalSiteTagline] = useState(siteTagline || 'Redaksi Independen Lintas Poin • Media Siber & Pers');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    if (siteTitle) setLocalSiteTitle(siteTitle);
    if (siteTagline) setLocalSiteTagline(siteTagline);
  }, [siteTitle, siteTagline]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSiteTitle.trim() || !localSiteTagline.trim()) {
      setSettingsError('Semua kolom pengaturan wajib diisi');
      return;
    }

    try {
      setSettingsLoading(true);
      setSettingsError('');
      setSettingsSuccess('');
      await onUpdateSettings(localSiteTitle, localSiteTagline);
      setSettingsSuccess('Pengaturan nama portal dan tagline berhasil diperbarui secara permanen!');
      setTimeout(() => setSettingsSuccess(''), 4000);
    } catch (err: any) {
      setSettingsError('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Users Accounts Management State
  const [usersList, setUsersList] = useState<any[]>([]);

  const displayedUsers = currentUser?.role === 'super_admin'
    ? usersList.filter((u: any) => u.role !== 'developer')
    : usersList;
  const [newFullname, setNewFullname] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'developer' | 'super_admin' | 'redaktur'>('redaktur');
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
  const contentTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const inlinePhotoFileInputRef = useRef<HTMLInputElement>(null);

  // Rich formatting editor states
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const [showInsertInlineImage, setShowInsertInlineImage] = useState(false);
  const [inlinePhotoUrl, setInlinePhotoUrl] = useState('');
  const [inlinePhotoAlt, setInlinePhotoAlt] = useState('');
  const [inlinePhotoLoading, setInlinePhotoLoading] = useState(false);

  // Helper to insert markdown format at cursor
  const insertFormat = (type: 'bold' | 'italic' | 'h3' | 'quote' | 'list' | 'list-ordered' | 'custom-image', customUrl?: string, customAlt?: string) => {
    const textarea = contentTextAreaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = content;
    const selectedText = text.substring(startPos, endPos);

    let replacement = '';
    switch (type) {
      case 'bold':
        replacement = `**${selectedText || 'Teks Tebal'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'Teks Miring'}*`;
        break;
      case 'h3':
        replacement = `\n\n### ${selectedText || 'Sub-Judul Berita'}\n`;
        break;
      case 'quote':
        replacement = `\n\n> "${selectedText || 'Tulis kutipan disini'}" — Sumber Kutipan\n`;
        break;
      case 'list':
        replacement = `\n\n- ${selectedText || 'Tulis poin rincian pertama'}\n- Tulis poin rincian kedua\n`;
        break;
      case 'list-ordered':
        replacement = `\n\n1. ${selectedText || 'Langkah Pertama'}\n2. Langkah Kedua\n`;
        break;
      case 'custom-image':
        if (customUrl) {
          replacement = `\n\n![${customAlt || 'Deskripsi Foto'}](${customUrl})\n`;
        }
        break;
      default:
        break;
    }

    const newContent = text.substring(0, startPos) + replacement + text.substring(endPos);
    setContent(newContent);

    // Refocus & set selection range safely
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 20);
  };

  // Convert inline photo upload to server disk URL
  const processAndUploadInlineFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert('Berkas terlalu besar! Batas sela foto adalah 8MB.');
      return;
    }

    setInlinePhotoLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const res = await api.uploadImage(file.name, reader.result);
          if (res.success) {
            setInlinePhotoUrl(res.url);
          }
        } catch (err: any) {
          alert('Gagal mengunggah foto sela ke server: ' + err.message);
        }
      }
      setInlinePhotoLoading(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca berkas foto');
      setInlinePhotoLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleInlinePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadInlineFile(file);
    }
  };

  // Safe and clean localized parser for Markdown preview
  const parseMarkdownLocal = (text: string) => {
    if (!text) return <p className="text-stone-400 italic text-xs">Belum ada naskah yang ditulis...</p>;
    const blocks = text.split('\n\n');

    return blocks.map((rawBlock, idx) => {
      const block = rawBlock.trim();
      if (!block) return null;

      if (block.startsWith('![') && block.includes('](')) {
        const match = block.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          const altText = match[1];
          const srcUrl = match[2];
          return (
            <div key={idx} className="my-5 flex flex-col items-center">
              <img
                src={srcUrl}
                alt={altText}
                referrerPolicy="no-referrer"
                className="w-full max-h-[350px] object-cover rounded-xl border border-stone-200 shadow-xs"
              />
              {altText && (
                <span className="block text-center text-[11px] text-stone-500 font-sans mt-1.5 font-medium bg-stone-50 px-2.5 py-0.5 rounded border border-stone-200/45">
                  📷 {altText}
                </span>
              )}
            </div>
          );
        }
      }

      if (block.startsWith('### ')) {
        return (
          <h3
            key={idx}
            className="font-serif text-lg sm:text-xl font-bold text-stone-900 mt-6 mb-3 border-b border-stone-100 pb-1"
          >
            {block.substring(4)}
          </h3>
        );
      }

      if (block.startsWith('#### ')) {
        return (
          <h4
            key={idx}
            className="font-serif text-base sm:text-lg font-bold text-stone-800 mt-5 mb-2.5"
          >
            {block.substring(5)}
          </h4>
        );
      }

      if (block.startsWith('> ')) {
        const cleanedQuote = block.replace(/^>\s+/, '').replace(/^["'“”‘]/g, '').replace(/["'“”‘]$/g, '');
        return (
          <blockquote
            key={idx}
            className="border-l-4 border-stone-900 bg-stone-50 pl-4 pr-3 py-2.5 my-5 italic text-stone-700 font-serif text-sm leading-relaxed"
          >
            "{cleanedQuote}"
          </blockquote>
        );
      }

      if (block.startsWith('- ') || block.startsWith('* ')) {
        const lines = block.split('\n');
        return (
          <ul
            key={idx}
            className="list-disc pl-5 my-3.5 space-y-1.5 text-stone-700 text-xs sm:text-sm font-sans"
          >
            {lines.map((line, lidx) => {
              const cleanedLine = line
                .replace(/^[\-\*]\s+/, '')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              return (
                <li
                  key={lidx}
                  dangerouslySetInnerHTML={{ __html: cleanedLine }}
                ></li>
              );
            })}
          </ul>
        );
      }

      const parsedHTML = block
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-stone-150 px-1.5 py-0.5 rounded font-mono text-stone-800 text-[11px]">$1</code>');

      return (
        <p
          key={idx}
          className="font-sans text-stone-700 leading-relaxed text-xs sm:text-sm my-3.5"
          dangerouslySetInnerHTML={{ __html: parsedHTML }}
        ></p>
      );
    });
  };

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
      if (currentUser?.role !== 'developer' && currentUser?.role !== 'super_admin') {
        setActiveTab('stats');
      } else {
        loadUsersList();
      }
    }
  }, [activeTab, formMode, currentUser]);

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
    setEditorTab('edit');
    setShowInsertInlineImage(false);
    setInlinePhotoUrl('');
    setInlinePhotoAlt('');
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

    if (newUserRole === 'developer' && currentUser?.role !== 'developer') {
      setUserError('Hanya akun Developer yang dapat mendaftarkan akun Developer baru');
      return;
    }

    try {
      const res = await api.createRedactor({
        fullname: newFullname.trim(),
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: newUserRole,
        creator_role: currentUser?.role,
      });
      if (res.success) {
        setUserSuccess(res.message || 'Akun redaktur baru berhasil didaftarkan!');
        setNewFullname('');
        setNewUsername('');
        setNewPassword('');
        setNewUserRole('redaktur');
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

  // Convert localized disk file upload to relative URL stored on server disk!
  const processAndUploadFile = (file: File) => {
    // Check size limit (max 8MB for upload)
    if (file.size > 8 * 1024 * 1024) {
      alert('File terlalu besar! Batas unggahan gambar adalah 8MB.');
      return;
    }

    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          const res = await api.uploadImage(file.name, reader.result);
          if (res.success) {
            setImageUrl(res.url);
            setSuccessMsg('Foto ilustrasi berhasil diunggah ke server!');
            setTimeout(() => setSuccessMsg(''), 3000);
          }
        } catch (err: any) {
          alert('Gagal mengunggah foto ke server: ' + err.message);
        }
      }
      setFileLoading(false);
    };
    reader.onerror = () => {
      alert('Gagal memproses berkas gambar');
      setFileLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
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

        {(currentUser?.role === 'developer' || currentUser?.role === 'super_admin') && (
          <button
            onClick={() => { setActiveTab('users'); setFormMode('list'); }}
            className={`flex-1 sm:flex-initial flex items-center gap-2.5 rounded-xl px-4 py-3 font-sans text-xs font-bold transition-all text-left whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-stone-900 text-stone-50 shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <UsersIcon className="h-4 w-4" />
            Kelola Akun
          </button>
        )}

        {currentUser && (
          <button
            onClick={() => { setActiveTab('settings'); setFormMode('list'); }}
            className={`flex-1 sm:flex-initial flex items-center gap-2.5 rounded-xl px-4 py-3 font-sans text-xs font-bold transition-all text-left whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-stone-900 text-stone-50 shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Settings className="h-4 w-4" />
            Pengaturan Situs
          </button>
        )}
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
                        className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 font-sans text-xs text-stone-900 focus:border-stone-500 focus:outline-none"
                      />
                    </div>

                    {/* Interactive Realtime Cover Image Preview */}
                    {imageUrl.trim() && (
                      <div className="rounded-xl border border-stone-250 bg-stone-50 p-3.5 space-y-2.5 shadow-xs transition-all">
                        <div className="flex items-center justify-between text-[10px] font-bold text-stone-600">
                          <span className="flex items-center gap-1 uppercase tracking-wider">
                            🖼️ Pratinjau Sampul Aktif
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[8px] uppercase ${
                            imageUrl.startsWith('/uploads/') 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-stone-200 text-stone-800'
                          }`}>
                            {imageUrl.startsWith('/uploads/') ? 'Unggahan Lokal' : 'Tautan/Preset'}
                          </span>
                        </div>
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shadow-inner group flex items-center justify-center">
                          <img
                            src={imageUrl}
                            alt="Sampul Berita Terpasang"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback on broken URL
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setImageUrl('')}
                              className="rounded-lg bg-red-600 hover:bg-red-700 text-stone-50 font-sans text-[10px] font-extrabold px-3 py-1.5 shadow-md flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                            >
                              Hapus Foto Sampul
                            </button>
                          </div>
                        </div>
                        <span className="block font-sans text-[10px] text-stone-400 italic truncate" title={imageUrl}>
                          Sumber: {imageUrl}
                        </span>
                      </div>
                    )}

                    {/* True local offline file conversion and Drag Drop */}
                    <div className="p-3.5 border border-stone-200 rounded-lg bg-stone-100/50">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5 text-stone-500" />
                          Unggah File Lokal (Redaksi Siber)
                        </span>
                        {fileLoading && (
                          <span className="inline-flex items-center text-amber-700 font-bold text-[10px] uppercase tracking-wider animate-pulse">
                            Memproses...
                          </span>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLocalImageUpload}
                        className="hidden"
                      />
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            processAndUploadFile(file);
                          }
                        }}
                        className="border-2 border-dashed border-stone-300 hover:border-stone-400 hover:bg-white rounded-lg p-4 text-center cursor-pointer transition-all duration-200"
                        onClick={() => !fileLoading && fileInputRef.current?.click()}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <ImageIcon className={`h-6 w-6 ${fileLoading ? 'text-amber-500 animate-spin' : 'text-stone-400'}`} />
                          <span className="font-sans text-xs font-bold text-stone-700">
                            {fileLoading ? 'Sedang Memuat Foto...' : 'Seret & Jatuhkan / Pilih Gambar'}
                          </span>
                          <span className="font-sans text-[10px] text-stone-400 block">
                            Mendukung PNG, JPG, WEBP (Maks 8MB)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Presets Grid */}
                    <div>
                      <span className="block font-sans text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wider">
                        Atau gunakan Preset Ilustrasi:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {IMAGE_PRESETS.map((p, pidx) => {
                          const isActive = imageUrl === p.url;
                          return (
                            <button
                              key={pidx}
                              type="button"
                              onClick={() => {
                                if (imageUrl.startsWith('/uploads/') && !confirm('Anda sudah mengunggah foto kustom. Ganti dengan preset ini?')) {
                                  return;
                                }
                                setImageUrl(p.url);
                              }}
                              className={`text-center rounded border p-1.5 font-sans text-[9px] font-extrabold truncate transition-all cursor-pointer ${
                                isActive 
                                  ? 'bg-stone-900 border-stone-900 text-stone-50 font-black' 
                                  : 'bg-white border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-900'
                              }`}
                              title={p.name}
                            >
                              {isActive ? `✓ ${p.name}` : p.name}
                            </button>
                          );
                        })}
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

                <div className="border border-stone-200 rounded-xl overflow-hidden shadow-xs bg-stone-50/20">
                  {/* Tab Selector & Custom Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stone-200 bg-stone-50/75 p-3.5">
                    <div className="flex items-center gap-2">
                      <label className="font-sans text-xs font-extrabold uppercase tracking-widest text-stone-700">
                        Naskah Lengkap <span className="text-red-500">*</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setEditorTab('edit')}
                        className={`px-3 py-1.5 rounded-md font-sans text-xs font-bold transition-all ${
                          editorTab === 'edit'
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-500 hover:text-stone-850'
                        }`}
                      >
                        ✍️ Tulis Berita (Asisten Format)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorTab('preview')}
                        className={`px-3 py-1.5 rounded-md font-sans text-xs font-bold transition-all ${
                          editorTab === 'preview'
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-500 hover:text-stone-850'
                        }`}
                      >
                        👁️ Pratinjau Tampilan Berita
                      </button>
                    </div>
                  </div>

                  {editorTab === 'edit' ? (
                    <div className="p-3.5 space-y-3.5 bg-white">
                      {/* Modern formatting toolbar */}
                      <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-100 pb-3">
                        <button
                          type="button"
                          onClick={() => insertFormat('bold')}
                          className="flex items-center gap-1 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1.5 font-sans text-xs font-bold text-stone-700 hover:text-stone-900 shadow-xs cursor-pointer transition-all"
                          title="Tebalkan Teks"
                        >
                          <Bold className="h-3.5 w-3.5 text-stone-400" />
                          Tebal
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat('italic')}
                          className="flex items-center gap-1 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1.5 font-sans text-xs font-bold text-stone-700 hover:text-stone-900 shadow-xs cursor-pointer transition-all"
                          title="Miringkan Teks"
                        >
                          <Italic className="h-3.5 w-3.5 text-stone-400" />
                          Miring
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat('h3')}
                          className="flex items-center gap-1 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1.5 font-sans text-xs font-bold text-stone-700 hover:text-stone-900 shadow-xs cursor-pointer transition-all"
                          title="Tambah Sub Judul / Paragraf Baru"
                        >
                          <Heading3 className="h-3.5 w-3.5 text-stone-400" />
                          Sub-Judul
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat('quote')}
                          className="flex items-center gap-1 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1.5 font-sans text-xs font-bold text-stone-700 hover:text-stone-900 shadow-xs cursor-pointer transition-all"
                          title="Tambah Kutipan Tokoh / Narasumber"
                        >
                          <Quote className="h-3.5 w-3.5 text-stone-400" />
                          Kutipan
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat('list')}
                          className="flex items-center gap-1 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1.5 font-sans text-xs font-bold text-stone-700 hover:text-stone-900 shadow-xs cursor-pointer transition-all"
                          title="Tambah Daftar Bullet"
                        >
                          <List className="h-3.5 w-3.5 text-stone-400" />
                          Poin
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormat('list-ordered')}
                          className="flex items-center gap-1 rounded bg-stone-50 hover:bg-stone-100 border border-stone-200/60 px-2.5 py-1.5 font-sans text-xs font-bold text-stone-700 hover:text-stone-900 shadow-xs cursor-pointer transition-all"
                          title="Tambah Daftar Angka"
                        >
                          <ListOrdered className="h-3.5 w-3.5 text-stone-400" />
                          Angka
                        </button>

                        <div className="h-5 w-px bg-stone-250 mx-1"></div>

                        {/* Sisipkan foto di antara teks button */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowInsertInlineImage(!showInsertInlineImage);
                          }}
                          className={`flex items-center gap-1.5 rounded border px-3 py-1.5 font-sans text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            showInsertInlineImage 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-655'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          📸 Sisipkan Foto di Sela Teks
                        </button>
                      </div>

                      {/* Expandable Image Inserter Toolbox */}
                      {showInsertInlineImage && (
                        <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-xs space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-xs font-extrabold text-amber-800 flex items-center gap-1">
                              <ImageIcon className="h-4 w-4" />
                              Asisten Penyisip Foto di Antara Teks (Inline Image)
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowInsertInlineImage(false)}
                              className="text-stone-400 hover:text-stone-600 font-sans text-xs font-bold"
                            >
                              Sembunyikan
                            </button>
                          </div>
                          
                          <p className="font-sans text-[11px] text-stone-500 leading-normal">
                            Foto akan disisipkan tepat di posisi kursor ketikan Anda berada. Anda bisa mengunggah file foto dari komputer atau menempelkan URL gambar langsung.
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Upload area or url input */}
                            <div className="space-y-2.5">
                              <div>
                                <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                                  Keterangan / Caption Foto
                                </label>
                                <input
                                  type="text"
                                  value={inlinePhotoAlt}
                                  onChange={(e) => setInlinePhotoAlt(e.target.value)}
                                  placeholder="cth: Suasana serah terima bantuan pangan"
                                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs text-stone-900 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                                  Gunakan URL atau Tautan Gambar
                                </label>
                                <input
                                  type="text"
                                  value={inlinePhotoUrl}
                                  onChange={(e) => setInlinePhotoUrl(e.target.value)}
                                  placeholder="https://domain.com/photo.jpg"
                                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-sans text-xs text-stone-900 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Local upload and upload feedback */}
                            <div className="space-y-2">
                              <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">
                                Atau Unggah File Foto dari Komputer
                              </label>
                              <input
                                ref={inlinePhotoFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleInlinePhotoUpload}
                                className="hidden"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => inlinePhotoFileInputRef.current?.click()}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith('image/')) {
                                      processAndUploadInlineFile(file);
                                    }
                                  }}
                                  className="flex-1 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-stone-300 hover:border-amber-400 hover:bg-amber-50/5 p-3.5 font-sans text-center text-xs font-bold text-stone-600 cursor-pointer transition-all"
                                >
                                  <Upload className="h-4 w-4 text-stone-400" />
                                  <span>{inlinePhotoLoading ? 'Sedang Memproses...' : 'Pilih Berkas Foto'}</span>
                                </button>

                                {inlinePhotoUrl && (
                                  <div className="w-20 h-20 rounded-lg border border-stone-200 overflow-hidden bg-stone-100 flex-shrink-0">
                                    <img
                                      src={inlinePhotoUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setInlinePhotoUrl('');
                                setInlinePhotoAlt('');
                                setShowInsertInlineImage(false);
                              }}
                              className="px-3 py-1.5 rounded border border-stone-200 hover:bg-stone-100 font-sans text-xs font-bold text-stone-600 cursor-pointer transition"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={!inlinePhotoUrl}
                              onClick={() => {
                                insertFormat('custom-image', inlinePhotoUrl, inlinePhotoAlt);
                                setInlinePhotoUrl('');
                                setInlinePhotoAlt('');
                                setShowInsertInlineImage(false);
                              }}
                              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-sans text-xs font-bold cursor-pointer transition disabled:opacity-40"
                            >
                              Sisipkan Sekarang
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Main Textarea */}
                      <textarea
                        ref={contentTextAreaRef}
                        rows={12}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="### Sub-Judul Pertama&#10;Tuliskan isi berita di sini yang menjabarkan seluruh ulasan berita secara analitis...&#10;&#10;Gunakan tombol format di atas untuk menebalkan teks, membuat judul, menyisipkan kutipan, maupun menambahkan foto lokal di sela-sela tulisan secara instan."
                        className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-3 font-sans text-sm text-stone-900 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 resize-y leading-relaxed"
                      />
                    </div>
                  ) : (
                    /* Elegant Live Preview Screen mockup */
                    <div className="bg-stone-50/50 p-6 sm:p-8 min-h-[350px] max-h-[500px] overflow-y-auto border-t border-stone-100">
                      <div className="prose prose-stone max-w-none">
                        {parseMarkdownLocal(content)}
                      </div>
                    </div>
                  )}
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
                Pendaftaran &amp; Kelola Akun
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
                Daftarkan Akun Redaksi Baru
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

                <div className="space-y-1">
                  <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest block">
                    Pilih Peran Anggota Tim
                  </label>
                  <div className={`grid gap-2 mt-1.55 ${currentUser?.role === 'developer' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {currentUser?.role === 'developer' && (
                      <button
                        type="button"
                        onClick={() => setNewUserRole('developer')}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg border py-2 px-1 text-[10px] sm:text-xs font-bold uppercase transition-all cursor-pointer text-center ${
                          newUserRole === 'developer'
                            ? 'bg-stone-900 text-stone-50 border-stone-900'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Developer
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setNewUserRole('super_admin')}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg border py-2 px-1 text-[10px] sm:text-xs font-bold uppercase transition-all cursor-pointer text-center ${
                        newUserRole === 'super_admin'
                          ? 'bg-stone-900 text-stone-50 border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserRole('redaktur')}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 rounded-lg border py-2 px-1 text-[10px] sm:text-xs font-bold uppercase transition-all cursor-pointer text-center ${
                        newUserRole === 'redaktur'
                          ? 'bg-stone-900 text-stone-50 border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Admin (Redaktur)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-stone-900 border border-stone-950 hover:bg-stone-850 px-4 py-2 font-sans text-xs font-bold text-stone-50 tracking-tight transition-all cursor-pointer block mt-2"
                >
                  Daftarkan Akun
                </button>
              </form>
            </div>

            {/* List and counts of active users */}
            <div>
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
                Daftar Akun Terdaftar ({displayedUsers.length})
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
                    {displayedUsers.map((user_row: any) => (
                      <tr key={user_row.id} className="hover:bg-stone-50/30">
                        <td className="px-5 py-3 font-semibold text-stone-900">
                          {user_row.fullname}
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-stone-500">
                          @{user_row.username}
                        </td>
                        <td className="px-5 py-3">
                          {user_row.role === 'developer' && (
                            <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                              Developer
                            </span>
                          )}
                          {user_row.role === 'super_admin' && (
                            <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-bold text-indigo-700 uppercase tracking-wider">
                              Super Admin
                            </span>
                          )}
                          {(user_row.role === 'redaktur' || !user_row.role) && (
                            <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[9px] font-bold text-blue-700 uppercase tracking-wider">
                              Admin (Redaktur)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- SITE SETTINGS WORKSPACE --- */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-stone-850" />
              <h2 className="font-serif text-xl font-bold text-stone-900">
                Pengaturan Identitas Portal Siber
              </h2>
            </div>

            <p className="font-sans text-xs text-stone-500 leading-relaxed max-w-2xl">
              Gunakan formulir ini untuk mengubah nama edisi utama dan tagline media pers Anda. Perubahan ini disimpan secara permanen di database lokal SQLite dan akan langsung diperbarui di bagian atas halaman depan pembaca.
            </p>

            {settingsSuccess && (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 border border-emerald-100 p-3.5 text-emerald-800 text-xs font-semibold">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span>{settingsSuccess}</span>
              </div>
            )}

            {settingsError && (
              <div className="flex items-center gap-2.5 rounded-lg bg-red-50 border border-red-100 p-3.5 text-red-800 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{settingsError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form Input */}
              <form onSubmit={handleSettingsSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-stone-50/50 p-5 shadow-xs">
                <div>
                  <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                    Judul Edisi Utama / Nama Situs <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={localSiteTitle}
                    onChange={(e) => setLocalSiteTitle(e.target.value)}
                    placeholder="cth: Edisi Utama"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-sans text-xs text-stone-900 focus:border-stone-500 focus:outline-none"
                  />
                  <span className="font-sans text-[10px] text-stone-400 mt-1 block">
                    Nama headline besar di sisi kiri atas.
                  </span>
                </div>

                <div>
                  <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">
                    Tagline Redaksi &amp; Pers <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={localSiteTagline}
                    onChange={(e) => setLocalSiteTagline(e.target.value)}
                    placeholder="cth: Redaksi Independen Lintas Poin • Media Siber & Pers"
                    className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-sans text-xs text-stone-850 focus:border-stone-500 focus:outline-none"
                  />
                  <span className="font-sans text-[10px] text-stone-400 mt-1 block">
                    Keterangan kecil kredensial pers atau slogan di bawah judul siber.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={settingsLoading}
                    className="w-full sm:w-auto rounded-lg bg-stone-900 hover:bg-stone-850 border border-stone-950 px-4.5 py-2.5 font-sans text-xs font-bold text-stone-50 tracking-tight transition-all cursor-pointer disabled:opacity-50"
                  >
                    {settingsLoading ? 'Sedang Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>

              {/* Live Preview Box */}
              <div className="flex flex-col h-full justify-between">
                <div>
                  <label className="block font-sans text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">
                    Pratinjau Tampilan Header Homepage
                  </label>
                  <div className="border border-dashed border-stone-300 rounded-xl bg-white p-5 shadow-xs relative overflow-hidden min-h-[140px] flex flex-col justify-center">
                    <span className="absolute top-2 right-2 text-[8px] uppercase tracking-widest bg-stone-100 text-stone-400 font-bold px-1.5 py-0.5 rounded">
                      Live Preview
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-stone-800 pb-3 gap-2">
                      <div>
                        <h2 className="font-serif text-lg font-extrabold text-stone-900 tracking-tight leading-none uppercase">
                          {localSiteTitle || 'Tanpa Nama'}
                        </h2>
                        <span className="font-mono text-[9px] text-stone-500 font-semibold block mt-1 uppercase leading-normal">
                          {localSiteTagline || 'Tanpa Tagline'}
                        </span>
                      </div>
                      <div className="text-right sm:text-right">
                        <span className="font-serif italic text-[10px] block text-stone-500">
                          {new Date().toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 space-y-2">
                  <span className="font-sans text-[10px] font-bold text-stone-700 uppercase tracking-widest block">
                    💡 Informasi Tambahan
                  </span>
                  <p className="font-sans text-[11px] leading-normal text-stone-500">
                    Sistem akan menyinkronkan data judul dan slogan ini secara dinamis. Header ini akan tercermin langsung baik saat pembaca membuka lewat handphone, tablet, maupun komputer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
