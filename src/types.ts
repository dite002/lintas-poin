export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  category_id: number;
  image_url: string;
  views: number;
  created_at: string;
  is_featured: boolean;
  author: string;
}

export interface ArticleWithCategory extends Article {
  category_name: string;
  category_slug: string;
}

export interface Comment {
  id: number;
  article_id: number;
  name: string;
  content: string;
  created_at: string;
}

export interface CategoryStats {
  category: string;
  views: number;
  count: number;
}

export interface User {
  id: number;
  username: string;
  fullname: string;
  role: 'developer' | 'super_admin' | 'redaktur';
  created_at?: string;
}

export interface DashboardStats {
  totalArticles: number;
  totalViews: number;
  totalComments: number;
  categoryStats: CategoryStats[];
}
