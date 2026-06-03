import { Category, ArticleWithCategory, Comment, DashboardStats, User } from '../types';

export async function getCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memuat kategori');
  }
  return res.json();
}

export async function createCategory(name: string): Promise<Category> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal membuat kategori');
  }
  return res.json();
}

export async function deleteCategory(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/categories/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menghapus kategori');
  }
  return res.json();
}

export interface GetArticlesParams {
  category?: string;
  search?: string;
  limit?: number;
  is_featured?: boolean;
}

export async function getArticles(params: GetArticlesParams = {}): Promise<ArticleWithCategory[]> {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.is_featured !== undefined) query.append('is_featured', params.is_featured.toString());

  const res = await fetch(`/api/articles?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Gagal memuat artikel');
  }
  return res.json();
}

export interface ArticleDetailPayload {
  article: ArticleWithCategory;
  comments: Comment[];
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetailPayload> {
  const res = await fetch(`/api/articles/${slug}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Artikel tidak ditemukan');
  }
  return res.json();
}

export interface ArticleInput {
  title: string;
  summary: string;
  content: string;
  category_id: number;
  image_url: string;
  is_featured: boolean;
  author?: string;
}

export async function createArticle(data: ArticleInput): Promise<ArticleWithCategory> {
  const res = await fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal membuat artikel');
  }
  return res.json();
}

export async function updateArticle(id: number, data: ArticleInput): Promise<ArticleWithCategory> {
  const res = await fetch(`/api/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memperbarui artikel');
  }
  return res.json();
}

export async function deleteArticle(id: number): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/articles/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal menghapus artikel');
  }
  return res.json();
}

export async function submitComment(articleId: number, name: string, content: string): Promise<Comment> {
  const res = await fetch(`/api/articles/${articleId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengirimkan komentar');
  }
  return res.json();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) {
    throw new Error('Gagal memuat statistik data');
  }
  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/db/reset', {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Gagal mereset database');
  }
  return res.json();
}

export async function getUserCount(): Promise<number> {
  const res = await fetch('/api/users/count');
  if (!res.ok) {
    throw new Error('Gagal memeriksa status pengguna');
  }
  const data = await res.json();
  return data.count;
}

export async function registerFirstUser(data: any): Promise<any> {
  const res = await fetch('/api/users/register-first', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mendaftarkan akun administratif pertama');
  }
  return res.json();
}

export async function loginUser(data: any): Promise<any> {
  const res = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Username atau Password salah');
  }
  return res.json();
}

export async function createRedactor(data: any): Promise<any> {
  const res = await fetch('/api/users/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal membuat akun redaksi baru');
  }
  return res.json();
}

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  if (!res.ok) {
    throw new Error('Gagal mengunduh daftar pengguna');
  }
  return res.json();
}

export async function uploadImage(filename: string, base64: string): Promise<{ success: boolean; url: string }> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, base64 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengunggah foto');
  }
  return res.json();
}

export async function getSettings(): Promise<{ site_title: string; site_tagline: string }> {
  const res = await fetch('/api/settings');
  if (!res.ok) {
    throw new Error('Gagal memuat pengaturan situs');
  }
  return res.json();
}

export async function updateSettings(site_title: string, site_tagline: string): Promise<{ success: boolean; site_title: string; site_tagline: string }> {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_title, site_tagline }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal memperbarui pengaturan situs');
  }
  return res.json();
}

