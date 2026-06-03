import React from 'react';
import { ArticleWithCategory } from '../types';
import { Calendar, Eye, User, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ArticleCardProps {
  key?: any;
  article: ArticleWithCategory;
  onClick: (slug: string) => void;
  index: number;
}

export default function ArticleCard({ article, onClick, index }: ArticleCardProps) {
  const formattedDate = new Date(article.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      onClick={() => onClick(article.slug)}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-xs hover:border-stone-300 hover:shadow-xs transition-all duration-300 cursor-pointer h-full justify-between"
    >
      <div>
        {/* Photo preview container */}
        <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
          <img
            src={article.image_url}
            alt={article.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800';
            }}
            className="h-full w-full object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="rounded bg-white/95 backdrop-blur-xs px-2.2 py-0.8 font-mono text-[9px] font-bold uppercase tracking-wider text-stone-900 border border-stone-200/50">
              {article.category_name}
            </span>
            {(article.is_featured === true || (article.is_featured as any) === 1) && (
              <span className="rounded bg-amber-500 px-2.2 py-0.8 font-mono text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                Pilihan
              </span>
            )}
          </div>
        </div>

        {/* Content body descriptors */}
        <div className="p-5">
          {/* Metadata */}
          <div className="flex items-center gap-3 font-mono text-[10px] text-stone-400 mb-2.5">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {article.views}
            </span>
          </div>

          {/* Heading */}
          <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-stone-700 leading-snug transition-colors line-clamp-2">
            {article.title}
          </h3>

          {/* Intro description */}
          <p className="mt-2 font-sans text-xs text-stone-500 leading-relaxed line-clamp-3">
            {article.summary}
          </p>
        </div>
      </div>

      {/* Footer signature line */}
      <div className="px-5 pb-5 pt-3 border-t border-stone-50 flex items-center justify-between text-stone-600">
        <span className="flex items-center gap-1.5 font-sans text-xs font-semibold text-stone-700">
          <User className="h-3.5 w-3.5 text-stone-400" />
          <span className="truncate max-w-[120px]">{article.author}</span>
        </span>

        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-stone-100 group-hover:bg-stone-900 group-hover:text-stone-50 text-stone-500 transition-all">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </motion.div>
  );
}
