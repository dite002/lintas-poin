import React from 'react';
import { ArticleWithCategory } from '../types';
import { Calendar, Eye, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroSectionProps {
  articles: ArticleWithCategory[];
  onArticleClick: (slug: string) => void;
}

export default function HeroSection({ articles, onArticleClick }: HeroSectionProps) {
  // Find primary featured article, or default to the most recent article
  const featured = articles.find((a) => a.is_featured === true || a.is_featured as any === 1) || articles[0];

  if (!featured) return null;

  const formattedDate = new Date(featured.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0"
    >
      {/* Banner Image */}
      <div className="lg:col-span-7 relative h-72 lg:h-96 w-full overflow-hidden bg-slate-100">
        <img
          src={featured.image_url}
          alt={featured.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).onerror = null;
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200';
          }}
          className="h-full w-full object-cover transform hover:scale-[1.03] transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          <span className="rounded-md bg-blue-600/90 backdrop-blur-xs px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-100">
            {featured.category_name}
          </span>
        </div>
      </div>

      {/* Flagship Content Detail */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 md:p-10 bg-white">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-mono text-[10px] font-bold text-red-600 uppercase tracking-widest">
              Laporan Utama
            </span>
          </div>

          <h2
            onClick={() => onArticleClick(featured.slug)}
            className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-blue-900 hover:text-slate-700 cursor-pointer transition-colors leading-tight"
          >
            {featured.title}
          </h2>

          <p className="font-sans text-sm text-slate-600 leading-relaxed line-clamp-4">
            {featured.summary}
          </p>
        </div>

        {/* Footer Meta Statistics */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 font-mono text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-sans font-medium text-slate-700">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {featured.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              {featured.views} dibaca
            </span>
          </div>

          <button
            onClick={() => onArticleClick(featured.slug)}
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 border border-blue-700 px-4 py-2 font-sans text-xs font-semibold text-slate-50 transition-all hover:bg-blue-700 cursor-pointer"
          >
            Baca Selengkapnya
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
