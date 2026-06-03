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
            ? 'bg-stone-900 text-stone-50 shadow-sm'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
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
              ? 'bg-stone-900 text-stone-50 shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
          }`}
        >
          <span>{cat.name}</span>
          {cat.article_count !== undefined && (
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                selectedCategory === cat.slug
                  ? 'bg-stone-700 text-stone-200'
                  : 'bg-stone-200 text-stone-600'
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
