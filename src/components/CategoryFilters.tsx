import React from 'react';
import { Category } from '../types';

interface CategoryFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export default function CategoryFilters({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFiltersProps) {
  // Derive extra article counts if any category item has article_count from server
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
      <button
        onClick={() => onSelectCategory('')}
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all cursor-pointer ${
          selectedCategory === ''
            ? 'bg-blue-600 text-slate-50 shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-900'
        }`}
      >
        Semua Berita
      </button>

      {categories.map((cat: any) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.slug)}
          className={`inline-flex items-center gap-1.5 justify-center whitespace-nowrap rounded-lg px-4 py-2 font-sans text-xs font-semibold transition-all cursor-pointer ${
            selectedCategory === cat.slug
              ? 'bg-blue-600 text-slate-50 shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-900'
          }`}
        >
          <span>{cat.name}</span>
          {cat.article_count !== undefined && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedCategory === cat.slug
                  ? 'bg-slate-700 text-slate-200'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {cat.article_count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
