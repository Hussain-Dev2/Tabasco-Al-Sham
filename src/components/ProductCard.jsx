import React from 'react';
import { storeConfig } from '../config';

export default function ProductCard({ product, quantity, onAdd, onRemove }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
      <div className="h-40 overflow-hidden relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">
            {product.name}
          </h3>
          <span className="font-bold text-orange-600">{product.price.toLocaleString()} {storeConfig.currency}</span>
        </div>
        
        <div className="mt-auto pt-4">
          {quantity > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1 border border-gray-200">
              <button
                onClick={() => onRemove(product.id)}
                className="w-9 h-9 flex items-center justify-center bg-white text-banana-black rounded-lg shadow-sm font-bold text-xl hover:bg-gray-100 transition-colors"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="font-bold text-banana-black text-lg">{quantity}</span>
              <button
                onClick={() => onAdd(product)}
                className="w-9 h-9 flex items-center justify-center bg-banana-yellow text-banana-black rounded-lg shadow-sm font-bold text-xl hover:bg-yellow-400 transition-colors"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(product)}
              className="w-full py-3 bg-banana-black text-banana-yellow rounded-xl font-bold shadow-md active:scale-95 hover:bg-black transition-all transform duration-200"
            >
              أضف للسلة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
