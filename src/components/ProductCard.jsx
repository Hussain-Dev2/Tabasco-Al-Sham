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
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => onRemove(product.id)}
                className="w-8 h-8 flex items-center justify-center bg-white text-orange-600 rounded-md shadow-sm font-bold text-lg hover:bg-orange-50 transition-colors"
              >
                -
              </button>
              <span className="font-semibold text-gray-800">{quantity}</span>
              <button
                onClick={() => onAdd(product)}
                className="w-8 h-8 flex items-center justify-center bg-orange-600 text-white rounded-md shadow-sm font-bold text-lg hover:bg-orange-700 transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(product)}
              className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium shadow-lg shadow-gray-200 active:scale-95 transition-transform"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
