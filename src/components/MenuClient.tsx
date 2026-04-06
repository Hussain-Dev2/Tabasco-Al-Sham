"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { updateStoreStatus } from "@/app/actions";

const CheckoutModal = dynamic(() => import("./CheckoutModal"), {
  ssr: false,
  loading: () => null
});

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
  products: Product[];
};

type CartItem = { 
  product: Product; 
  quantity: number; 
  selectedSize?: string;
  selectedPrice?: number;
};

export default function MenuClient({ categories, settings }: { categories: Category[], settings: any }) {
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, { name: string; price: number }>>({});

  const format12h = (time: string) => {
    if (!time) return "";
    try {
       const [h, m] = time.split(':').map(Number);
       const period = h >= 12 ? 'PM' : 'AM';
       const hours = h % 12 || 12;
       return `${hours}:${m.toString().padStart(2, '0')} ${period}`;
    } catch {
       return time;
    }
  };

  // Calculate if store is effectively open
  const checkIfOpen = useCallback(() => {
    if (!settings || !settings.isOpen) return false;

    const now = new Date();
    const day = now.getDay().toString();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const openTimeStr = settings.openTime || "14:30";
    const closeTimeStr = settings.closeTime || "01:30";
    const openDaysStr = settings.openDays || "1,2,3,4,5,6,0";

    const [openH, openM] = openTimeStr.split(':').map(Number);
    const [closeH, closeM] = closeTimeStr.split(':').map(Number);

    const openMin = openH * 60 + openM;
    const closeMin = closeH * 60 + closeM;
    const openDaysList = openDaysStr.split(',');

    if (closeMin < openMin) {
      if (currentTime < closeMin) {
        const yesterday = ((now.getDay() + 6) % 7).toString();
        return openDaysList.includes(yesterday);
      }
      return currentTime >= openMin && openDaysList.includes(day);
    }
    
    return openDaysList.includes(day) && currentTime >= openMin && currentTime < closeMin;
  }, [settings]);

  useEffect(() => {
    setLocalIsOpen(checkIfOpen());
    const interval = setInterval(() => {
      setLocalIsOpen(checkIfOpen());
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkIfOpen]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const isScrolled = window.scrollY > 120;
      setScrolled(prev => prev !== isScrolled ? isScrolled : prev);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.name === "الوجبات") return -1;
      if (b.name === "الوجبات") return 1;
      return 0;
    });
  }, [categories]);

  const displayedProducts = useMemo(() => {
    if (activeCategoryId === "all") {
      return sortedCategories.flatMap(cat => cat.products);
    }
    return sortedCategories.find(c => c.id === activeCategoryId)?.products || [];
  }, [activeCategoryId, sortedCategories]);

  const activeCategoryName = useMemo(() => {
    if (activeCategoryId === "all") return "الكل";
    return sortedCategories.find(c => c.id === activeCategoryId)?.name || "";
  }, [activeCategoryId, sortedCategories]);

  const specialCategoryId = useMemo(() => {
    return categories.find(c => c.name === "الجديد والقسم الخاص")?.id;
  }, [categories]);

  const parsePizzaSizes = (desc: string | null) => {
    if (!desc?.includes("SIZES:")) return null;
    try {
      const parts = desc.split("SIZES:")[1].split(",");
      return parts.map(p => {
        const [name, price] = p.trim().split("-");
        return { name, price: parseFloat(price) };
      });
    } catch (e) { return null; }
  };

  const getQuantity = (productId: string, sizeName?: string) => {
    return cart.find((item) => 
      item.product.id === productId && (!sizeName || item.selectedSize === sizeName)
    )?.quantity || 0;
  };

  const addToCart = useCallback((product: Product, size?: { name: string; price: number }) => {
    if (!localIsOpen) return;
    setCart((prev) => {
      const existing = prev.find((item) => 
        item.product.id === product.id && (!size || item.selectedSize === size.name)
      );
      if (existing) {
        return prev.map((item) =>
          (item.product.id === product.id && (!size || item.selectedSize === size.name)) 
            ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        product, 
        quantity: 1, 
        selectedSize: size?.name, 
        selectedPrice: size?.price 
      }];
    });
  }, [localIsOpen]);

  const removeFromCart = useCallback((productId: string, sizeName?: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => 
        item.product.id === productId && (!sizeName || item.selectedSize === sizeName)
      );
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((item) => 
          !(item.product.id === productId && (!sizeName || item.selectedSize === sizeName))
        );
      }
      return prev.map((item) =>
        (item.product.id === productId && (!sizeName || item.selectedSize === sizeName)) 
          ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }, []);

  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((sum, item) => sum + ((item.selectedPrice || item.product.price) * item.quantity), 0), [cart]);


  return (
    <div className="min-h-screen bg-[#050505] relative isolate font-cairo overflow-x-hidden text-right" dir="rtl">
      {/* MAGICAL BACKGROUND LAYER */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60rem] h-[60rem] bg-brand-red/5 rounded-full blur-[150px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-[0%] right-[-10%] w-[50rem] h-[50rem] bg-brand-orange/5 rounded-full blur-[130px] opacity-30 animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-[0.08] mix-blend-screen"></div>
      </div>

      <header className="relative pt-20 pb-16 px-8 text-center overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className={`mb-8 px-6 py-2 rounded-full border flex items-center gap-3 transition-all duration-700 animate-fade-in ${localIsOpen ? 'bg-green-500/5 border-green-500/20 text-green-500' : 'bg-red-500/5 border-red-500/20 text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${localIsOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              {localIsOpen ? 'مفتوح الآن • نتشرف بخدمتكم' : 'مغلق حالياً • نراكم لاحقاً'}
            </span>
          </div>

          <div className="relative group mb-10 transform hover:rotate-3 transition-transform duration-700">
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-red to-brand-orange rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-30 transition"></div>
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl bg-black">
              <Image 
                src="/55555555555_page-0001.jpg" 
                alt="Logo" 
                fill 
                priority 
                className="object-cover scale-110" 
              />
            </div>
          </div>

          <h1 className="text-4xl md:text-8xl font-black text-white mb-4 tracking-tighter leading-none italic">
            TABASCO <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red via-brand-orange to-brand-red animate-gradient-x">AL-SHAM</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-gray-400 text-xs md:text-base font-bold leading-relaxed opacity-70 px-4 mb-8">
            استمتع بتجربة طعام استثنائية تجمع بين المذاق الشامي الأصيل وأجود المكونات، لتمنحك نكهة أسطورية لا تُنسى في كل لقمة.
          </p>

          <div className="mt-12 w-full max-w-2xl mx-auto animate-fade-in px-4">
             <div className="px-10 py-8 rounded-[3.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center gap-6 max-w-md mx-auto shadow-[0_50px_100px_-30px_rgba(0,0,0,0.9)] relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-red/5 to-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="flex items-center gap-3 relative z-10">
                   <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse shadow-[0_0_10px_rgba(255,157,0,0.4)]"></div>
                   <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] opacity-80 font-cairo">أوقات العمل المعتمدة</span>
                </div>

                <div className="flex items-center gap-8 relative z-10">
                   <div className="flex flex-col items-center">
                      <div className="flex items-center gap-3 mb-1" dir="ltr">
                         <span className="text-white font-black text-3xl tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {(() => {
                              const [h, m] = (settings?.openTime || "14:30").split(':');
                              const period = Number(h) >= 12 ? 'PM' : 'AM';
                              return `${Number(h) % 12 || 12}:${m} ${period}`;
                            })()}
                         </span>
                         <span className="text-gray-700 font-black text-xl">-</span>
                         <span className="text-white font-black text-3xl tracking-tighter italic drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            {(() => {
                              const [h, m] = (settings?.closeTime || "01:30").split(':');
                              const period = Number(h) >= 12 ? 'PM' : 'AM';
                              return `${Number(h) % 12 || 12}:${m} ${period}`;
                            })()}
                         </span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-60 transition-opacity">
                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Daily Schedule</span>
                         <span className="text-xs">🕒</span>
                      </div>
                   </div>
                   
                   <div className="w-[1px] h-14 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                   
                   <div className="flex flex-col items-center">
                      <span className="text-brand-orange font-black text-base uppercase tracking-widest italic drop-shadow-[0_0_10px_rgba(255,157,0,0.2)]">
                         {(settings?.openDays?.split(',')?.length === 7) ? 'طوال الأسبوع' : 'أيام محددة'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 opacity-40 group-hover:opacity-60 transition-opacity">
                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">Open Days</span>
                         <span className="text-xs">🗓️</span>
                      </div>
                   </div>
                </div>

                {/* Operational Status Pill */}
                <div className={`relative z-10 px-8 py-2 rounded-full border text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-700 shadow-2xl ${localIsOpen ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-brand-red/10 border-brand-red/20 text-brand-red'}`}>
                   {localIsOpen ? 'Live Now • Open' : 'Store Closed'}
                </div>
             </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 relative z-20">
        {/* CATEGORY SELECTOR - Original Design with Anti-Glitch Fixes */}
        <div 
          className={`sticky top-0 z-[100] transition-all duration-700 -mx-8 px-8 py-4 transform-gpu will-change-[transform,backdrop-filter] ${scrolled ? 'bg-black/90 backdrop-blur-3xl border-b border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] translate-y-0' : 'bg-transparent -translate-y-1'}`}
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-2 pb-2">
               <button 
                onClick={() => setActiveCategoryId("all")} 
                className={`whitespace-nowrap px-10 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500 active:scale-90 ${activeCategoryId === "all" ? 'bg-brand-red text-white shadow-[0_10px_30px_rgba(255,59,59,0.3)]' : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'}`}
                dir="rtl"
               >
                  الكل
               </button>
               {sortedCategories.map((cat) => {
                  const isSpecial = cat.name === "الجديد والقسم الخاص";
                  return (
                    <button 
                      key={cat.id} 
                      onClick={() => setActiveCategoryId(cat.id)} 
                      className={`relative whitespace-nowrap px-10 py-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all duration-500 active:scale-90 ${
                        activeCategoryId === cat.id 
                          ? isSpecial 
                            ? 'bg-gradient-to-r from-brand-red via-brand-orange to-brand-red text-white shadow-[0_15px_40px_rgba(255,255,255,0.1)] scale-110 border-none'
                            : 'bg-brand-red text-white shadow-[0_10px_30px_rgba(255,59,59,0.3)]' 
                          : isSpecial
                            ? 'bg-brand-red/10 text-brand-red border border-brand-red/20 shadow-[0_5px_15px_rgba(239,68,68,0.1)] opacity-70 hover:opacity-100'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                      }`}
                      dir="rtl"
                    >
                      {isSpecial && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-brand-red text-[7px] px-2 py-0.5 rounded-full font-black animate-bounce shadow-xl">NEW</span>}
                      {cat.name}
                    </button>
                  );
               })}
            </div>
          </div>
        </div>

        <div className="mt-16 md:mt-32 mb-10 md:mb-16 flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 md:pb-10">
           <div>
              <span className="text-[9px] md:text-[10px] font-black text-brand-red uppercase tracking-[0.3em] mb-2 md:mb-4 block">قائمة الطعام</span>
              <h2 className="text-3xl md:text-7xl font-black text-white italic tracking-tighter">{activeCategoryName}</h2>
           </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-12 pb-60">
          {displayedProducts.map((product, idx) => (
            <ProductCard 
              key={product.id}
              product={product}
              idx={idx}
              isSpecialCategory={product.categoryId === specialCategoryId}
              localIsOpen={localIsOpen}
              getQuantity={getQuantity}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              parsePizzaSizes={parsePizzaSizes}
              selectedSize={selectedSizes[product.id]}
              setSelectedSize={(size: { name: string; price: number }) => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
            />
          ))}
        </div>
      </div>

      {/* PREMIUM STANDARDIZED FOOTER */}
      <footer className="relative z-20 mt-40 pb-24 px-8 border-t border-white/5 pt-24 bg-gradient-to-b from-transparent to-black">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center gap-16 text-center">
               
               {/* Branding & Socials */}
               <div className="space-y-10 flex flex-col items-center w-full">
                  <div className="flex flex-col items-center gap-4">
                     <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 mb-2 shadow-2xl skew-y-3 relative">
                        <Image src="/55555555555_page-0001.jpg" alt="Logo" fill className="object-cover" />
                     </div>
                     <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none italic animate-gradient-x bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white">TABASCO AL-SHAM</h3>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] max-w-xs leading-relaxed text-center">نقدم لكم أفخر النكهات الشامية الأصيلة والوصفات الأسطورية منذ {new Date().getFullYear()}</p>
                  </div>
                  
                  <div className="flex gap-5">
                     <a href="https://www.facebook.com/share/1CgeTMMTYZ/" target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-[2rem] glass bg-white/5 flex items-center justify-center border border-white/5 hover:border-brand-red/40 hover:bg-brand-red/10 transition-all duration-700 group active:scale-90 shadow-lg">
                        <svg className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                     </a>
                     <a href="https://www.instagram.com/tab_asco1?igsh=ZXprcTdqNms2dWlz" target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-[2rem] glass bg-white/5 flex items-center justify-center border border-white/5 hover:border-brand-red/40 hover:bg-brand-red/10 transition-all duration-700 group active:scale-90 shadow-lg">
                        <svg className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.669-.072-4.948-.2-4.351-2.609-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                     </a>
                  </div>
               </div>
            </div>

            {/* COPYRIGHT BAR */}
            <div className="mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row-reverse justify-between items-center gap-10">
               <div className="flex flex-col items-center md:items-end gap-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">© {new Date().getFullYear()} TABASCO AL-SHAM • ALL RIGHTS RESERVED</p>
                  <p className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">Premium Restaurant Experience</p>
               </div>
               
               <a href="https://me.nexadigital.dev" target="_blank" rel="noopener noreferrer" className="group">
                  <div className="flex items-center gap-5 bg-transparent px-8 py-3.5 rounded-[2rem] border border-white/5 hover:border-brand-red/30 hover:bg-white/[0.05] transition-all duration-700 shadow-2xl active:scale-95">
                     <span className="text-[10px] font-black text-white/10 group-hover:text-brand-red/40 transition-colors uppercase tracking-[0.3em] font-cairo">Handcrafted by</span>
                     <div className="h-4 w-[1px] bg-white/10 group-hover:bg-brand-red/20 transition-colors"></div>
                     <span className="text-[11px] font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all tracking-[0.15em]">NEXA DIGITAL</span>
                  </div>
               </a>
            </div>
         </div>
      </footer>

      {totalItems > 0 && localIsOpen && (
         <div className="fixed bottom-4 left-0 w-full z-[100] px-3 pointer-events-none animate-slide-up">
            <div className="max-w-lg mx-auto pointer-events-auto flex gap-2">
               {/* Edit cart button */}
               <button
                 onClick={() => setIsCartOpen(true)}
                 className="flex-shrink-0 glass bg-white/10 border border-white/20 rounded-2xl px-4 flex items-center justify-center gap-2 active:scale-90 transition-all"
               >
                 <div className="bg-brand-orange/90 w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs text-white">{totalItems}</div>
                 <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                 </svg>
               </button>
               {/* Checkout button */}
               <button onClick={() => setIsCheckoutOpen(true)} className="relative flex-1 group">
                  <div className="relative glass bg-brand-red text-white rounded-2xl py-3.5 px-5 flex items-center justify-between shadow-3xl active:scale-95 border border-white/20">
                     <span className="text-base font-black">{totalPrice.toLocaleString("ar-IQ")} د.ع</span>
                     <span className="font-black text-sm italic uppercase">إتمام الطلب</span>
                  </div>
               </button>
            </div>
         </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          cart={cart}
          totalPrice={totalPrice}
          totalItems={totalItems}
          onClose={() => setIsCartOpen(false)}
          onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
          onAdd={(product: Product, size?: string, price?: number) => addToCart(product, size ? { name: size, price: price! } : undefined)}
          onRemove={(productId: string, sizeName?: string) => removeFromCart(productId, sizeName)}
        />
      )}

      {isCheckoutOpen && (
        <CheckoutModal 
          cart={cart}
          totalPrice={totalPrice}
          onClose={() => setIsCheckoutOpen(false)} 
          onSuccess={() => { setCart([]); setIsCheckoutOpen(false); }}
        />
      )}

      {/* FLOATING BOT/SERVICE ICON */}
      <div className="fixed bottom-32 left-6 z-[90] animate-bounce-slow">
        <a 
          href="https://wa.me/9647727681903" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative block group"
        >
          <div className="absolute -inset-2 bg-brand-orange rounded-full blur opacity-20 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full glass border border-white/20 bg-brand-orange shadow-2xl overflow-hidden active:scale-90 transition-all">
            <Image 
              src="/55555555555_page-0001.jpg" 
              alt="Bot Service" 
              fill 
              className="object-cover hover:scale-125 transition-transform" 
            />
          </div>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 glass px-4 py-2 rounded-xl border border-white/10 whitespace-nowrap text-[10px] font-black text-white pointer-events-none opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
             هل تحتاج مساعدة؟ 👋
          </div>
        </a>
      </div>
    </div>
  );
}

const ProductCard = React.memo(({ 
  product, 
  idx, 
  isSpecialCategory,
  localIsOpen, 
  getQuantity, 
  addToCart, 
  removeFromCart, 
  parsePizzaSizes, 
  selectedSize, 
  setSelectedSize 
}: any) => {
  const currentPrice = selectedSize?.price || product.price;
  const sizes = parsePizzaSizes(product.description);
  const activeSize = selectedSize?.name || "وسط";
  const qty = getQuantity(product.id, sizes ? activeSize : undefined);

  return (
    <div 
      className="group relative animate-slide-up transform-gpu" 
      style={{ 
        animationDelay: `${idx * 40}ms`,
        contentVisibility: 'auto',
        containIntrinsicSize: '500px',
        transform: 'translateZ(0)'
      }}
    >
        <div className={`glass bg-white/[0.01] rounded-[1.5rem] md:rounded-[4rem] p-3 md:p-8 border transition-all duration-700 relative overflow-hidden flex flex-col h-full 
           ${(!localIsOpen || product.isAvailable === false) && 'grayscale opacity-60 pointer-events-none'} 
           ${isSpecialCategory 
             ? 'border-brand-red/60 bg-gradient-to-br from-brand-red/[0.08] via-transparent to-brand-orange/[0.05] shadow-[0_0_50px_rgba(239,68,68,0.15)] ring-1 ring-brand-red/20' 
             : 'border-white/5 hover:border-brand-red/40 hover:bg-white/[0.04]'
           }`}
        >
           {/* Shimmer Effect for Special Items */}
           {isSpecialCategory && (
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent -translate-x-[100%] animate-shimmer pointer-events-none"></div>
           )}
           
           {isSpecialCategory && (
             <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2 scale-110">
                <div className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-red text-white text-[9px] md:text-[11px] font-black px-5 py-2 rounded-full shadow-[0_10px_30px_rgba(239,68,68,0.4)] flex items-center gap-2 border border-white/20 animate-pulse-slow">
                   <span className="text-sm">🔥</span>
                   قسم العروض الجديدة
                </div>
             </div>
           )}

           {/* Unavailable Banner */}
           {product.isAvailable === false && (
              <div className="absolute top-4 left-[-35px] bg-red-600 text-white text-[8px] md:text-[10px] font-black px-10 py-1 rotate-[-45deg] z-50 shadow-xl uppercase tracking-tighter">نفدت الكمية</div>
           )}
           
           <div className={`w-full h-40 md:h-72 mb-4 md:mb-10 rounded-[1.2rem] md:rounded-[3rem] overflow-hidden relative shadow-3xl bg-[#0f0f10] border transition-all duration-700 
             ${isSpecialCategory ? 'border-brand-red/40 scale-[1.02] shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'border-white/5 group-hover:border-brand-red/20'}
           `}>
              {isSpecialCategory && (
                 <div className="absolute inset-0 bg-gradient-to-t from-brand-red/20 via-transparent to-transparent z-10 pointer-events-none"></div>
              )}
              {product.imageUrl ? (
                 <Image 
                    src={product.imageUrl} 
                    alt={product.name} 
                    fill 
                    priority={idx < 4}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-[2000ms] ease-out will-change-transform" 
                 />
              ) : (
                 <div className="w-full h-full flex items-center justify-center text-4xl md:text-7xl opacity-10">🍜</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60"></div>
              <div className={`absolute bottom-4 right-4 md:bottom-6 md:right-6 glass px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-white/10 shadow-2xl transition-all
                 ${isSpecialCategory ? 'bg-brand-red/90 text-white border-brand-red/20 py-2.5 md:py-4 scale-110' : 'bg-black/80'}
              `}>
                 <span className={`text-lg md:text-3xl font-black italic tracking-tighter transition-colors ${isSpecialCategory ? 'text-white' : 'text-brand-orange'}`}>
                    {currentPrice.toLocaleString("ar-IQ")}
                    <small className="text-[9px] md:text-[11px] font-bold opacity-60 mr-1 uppercase NOT-italic">د.ع</small>
                 </span>
              </div>
           </div>

          <div className="flex-grow">
             <h3 className="text-xl md:text-2xl font-black text-white mb-2 md:mb-3 tracking-tight">{product.name}</h3>
             {product.description && (
                <p className="text-[11px] md:text-[13px] text-gray-500 font-bold leading-relaxed line-clamp-2 opacity-70">
                   {product.description.includes("SIZES:") ? product.description.split("SIZES:")[0] : product.description}
                </p>
             )}
          </div>

          <div className="mt-4 md:mt-10 pt-4 md:pt-8 border-t border-white/5">
              {localIsOpen ? (
                 <>
                    {sizes ? (
                       <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-2">
                             {sizes.map((size: any) => (
                                <button 
                                  key={size.name}
                                  onClick={() => setSelectedSize(size)}
                                  className={`py-2 px-1 rounded-xl text-[9px] font-black border transition-all ${
                                    activeSize === size.name 
                                      ? 'bg-brand-orange text-white border-brand-orange scale-105' 
                                      : 'bg-white/5 text-gray-500 border-white/10'
                                  }`}
                                >
                                   {size.name}
                                </button>
                             ))}
                          </div>
                          
                          {qty > 0 ? (
                             <div className="flex items-center w-full justify-between bg-white/5 rounded-xl md:rounded-3xl p-1 md:p-1.5 border border-white/10">
                                <button onClick={() => removeFromCart(product.id, activeSize)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white text-lg md:text-2xl font-bold active:bg-white/10 rounded-lg">-</button>
                                <span className="text-xs md:text-lg font-black text-white">{qty}</span>
                                <button onClick={() => addToCart(product, selectedSize || sizes.find((s:any) => s.name === "وسط"))} className="w-10 h-10 md:w-12 md:h-12 bg-brand-red text-white flex items-center justify-center font-bold rounded-lg md:rounded-2xl shadow-2xl shadow-brand-red/40 active:scale-90">+</button>
                             </div>
                          ) : (
                             <button onClick={() => addToCart(product, selectedSize || sizes.find((s:any) => s.name === "وسط"))} className="w-full bg-white/5 hover:bg-brand-red text-white py-4 md:py-5 rounded-xl md:rounded-3xl font-black text-[11px] md:text-xs tracking-widest transition-all active:scale-95 shadow-lg line-clamp-1">
                                إضافة {activeSize}
                             </button>
                          )}
                       </div>
                    ) : (
                       <div className="flex items-center justify-between w-full">
                          {product.isAvailable === false ? (
                             <div className="w-full text-center py-4 bg-red-500/10 rounded-xl md:rounded-3xl border border-red-500/20 text-red-500 font-black text-[9px] md:text-[10px]">غير متوفر</div>
                          ) : qty > 0 ? (
                             <div className="flex items-center w-full justify-between bg-white/5 rounded-xl md:rounded-3xl p-1 md:p-1.5 border border-white/10">
                                <button onClick={() => removeFromCart(product.id)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white text-lg md:text-2xl font-bold active:bg-white/10 rounded-lg">-</button>
                                <span className="text-xs md:text-lg font-black text-white">{qty}</span>
                                <button onClick={() => addToCart(product)} className="w-10 h-10 md:w-12 md:h-12 bg-brand-red text-white flex items-center justify-center font-bold rounded-lg md:rounded-2xl shadow-2xl shadow-brand-red/40 active:scale-90">+</button>
                             </div>
                          ) : (
                             <button onClick={() => addToCart(product)} className="w-full bg-white/5 hover:bg-brand-red text-white py-4 md:py-5 rounded-xl md:rounded-3xl font-black text-[11px] md:text-xs tracking-widest transition-all active:scale-95 shadow-lg">+ إضافة للطلب</button>
                          )}
                       </div>
                    )}
                 </>
              ) : (
                 <div className="w-full text-center text-red-500 font-black text-[11px] py-4 bg-red-500/10 rounded-xl border border-red-500/20 uppercase tracking-widest">مغلق</div>
              )}
           </div>
       </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

// ─── Cart Drawer ────────────────────────────────────────────────────────────
function CartDrawer({
  cart,
  totalPrice,
  totalItems,
  onClose,
  onCheckout,
  onAdd,
  onRemove,
}: {
  cart: CartItem[];
  totalPrice: number;
  totalItems: number;
  onClose: () => void;
  onCheckout: () => void;
  onAdd: (product: Product, size?: string, price?: number) => void;
  onRemove: (productId: string, sizeName?: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-[#0f0f10] border-t border-white/10 rounded-t-[2.5rem] shadow-2xl animate-slide-up flex flex-col max-h-[80vh]">
        {/* Handle bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-brand-red/20 border border-brand-red/30 rounded-xl px-3 py-1 text-xs font-black text-brand-red">
              {totalItems} وجبة
            </div>
            <h3 className="text-base font-black text-white">طلبك</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white active:scale-90 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
          {cart.map((item, i) => {
            const price = item.selectedPrice ?? item.product.price;
            const lineTotal = price * item.quantity;
            return (
              <div
                key={`${item.product.id}-${item.selectedSize ?? "nosize"}-${i}`}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl p-3"
              >
                {/* Product name & size */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{item.product.name}</p>
                  {item.selectedSize && (
                    <span className="text-[10px] font-bold text-brand-orange/80">
                      {item.selectedSize}
                    </span>
                  )}
                  <p className="text-xs font-bold text-gray-500 mt-0.5">
                    {lineTotal.toLocaleString("ar-IQ")} د.ع
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={() => onRemove(item.product.id, item.selectedSize)}
                    className="w-8 h-8 flex items-center justify-center text-white font-bold rounded-lg active:bg-white/10 transition-all text-lg"
                  >
                    {item.quantity === 1 ? (
                      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    ) : "−"}
                  </button>
                  <span className="w-6 text-center text-sm font-black text-white">{item.quantity}</span>
                  <button
                    onClick={() => onAdd(item.product, item.selectedSize, item.selectedPrice)}
                    className="w-8 h-8 bg-brand-red flex items-center justify-center text-white font-bold rounded-lg active:scale-90 transition-all text-lg shadow-lg shadow-brand-red/30"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-black text-white">المجموع</span>
            <span className="text-lg font-black text-brand-orange">
              {totalPrice.toLocaleString("ar-IQ")} <small className="text-xs opacity-60">د.ع</small>
            </span>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-brand-red text-white py-4 rounded-2xl font-black text-sm tracking-wide active:scale-95 transition-all shadow-lg shadow-brand-red/30 flex items-center justify-center gap-2"
          >
            <span>إتمام الطلب</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
