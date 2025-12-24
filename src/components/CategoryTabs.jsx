import React from 'react';

import { categories } from '../config';

/* 
  Removed hardcoded categories. 
*/

export default function CategoryTabs({ selectedCategory, onSelectCategory }) {
  return (
    <div className="flex overflow-x-auto gap-3 py-4 px-4 no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`
            px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all transform active:scale-95
            ${
              selectedCategory === cat.id
                ? 'bg-banana-black text-banana-yellow shadow-lg scale-105'
                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
            }
          `}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
