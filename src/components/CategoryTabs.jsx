import React from 'react';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'burger', label: 'Burgers' },
  { id: 'side', label: 'Sides' },
  { id: 'drink', label: 'Drinks' },
];

export default function CategoryTabs({ selectedCategory, onSelectCategory }) {
  return (
    <div className="flex overflow-x-auto gap-3 py-4 px-4 no-scrollbar">
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`
            px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors
            ${
              selectedCategory === cat.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
