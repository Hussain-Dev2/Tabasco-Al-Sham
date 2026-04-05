"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  createCategory, deleteCategory, updateCategory,
  createProduct, deleteProduct, updateProduct,
  updateOrderStatus, updateStoreStatus, updateStoreSettings
} from "@/app/actions";
import { supabase } from "@/lib/supabase";

// Professional SVG Icons
const Icons = {
  Edit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
};

export default function AdminDashboard({ initialCategories, initialOrders, isOpenInitial, lastOpenedAt, settings }: any) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(isOpenInitial);
  const [password, setPassword] = useState("admin123");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [confirmModal, setConfirmModal] = useState<{show: boolean, type: 'category' | 'product', id: string} | null>(null);
  const [localLastOpenedAt, setLocalLastOpenedAt] = useState(lastOpenedAt);

  // Settings state
  const [openDays, setOpenDays] = useState<string[]>(settings?.openDays?.split(',') || ['1','2','3','4','5','6','0']);
  const [openTime, setOpenTime] = useState(settings?.openTime || '14:30');
  const [closeTime, setCloseTime] = useState(settings?.closeTime || '01:30');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

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

  // Category Logic
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Product Logic
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCat, setNewProdCat] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdAvailable, setNewProdAvailable] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editProdData, setEditProdData] = useState<any>({});
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

  const todayOrdersCount = useMemo(() => initialOrders.filter((o: any) => o.status === 'DONE').length, [initialOrders]);
  const activeOrdersCount = useMemo(() => initialOrders.filter((o: any) => o.status !== 'DONE').length, [initialOrders]);

  const handleConfirm = useCallback(async () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'category') await deleteCategory(confirmModal.id);
    else await deleteProduct(confirmModal.id);
    setConfirmModal(null);
  }, [confirmModal]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      if (!supabase) {
        throw new Error("لم يتم تكوين Supabase! يرجى إضافة NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY إلى الإعدادات.");
      }
      // 1. Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      // 2. Upload to Supabase 'products' bucket
      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (error) throw error;

      // 3. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      if (editingProdId) {
        setEditProdData((prev: any) => ({ ...prev, imageUrl: publicUrl }));
      } else {
        setNewProdImage(publicUrl);
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("فشل رفع الصورة: " + (error.message || "تأكد من إعدادات Supabase Storage"));
    } finally {
      setIsUploading(false);
    }
  }, [editingProdId]);

  const handleToggleStore = useCallback(async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    await updateStoreStatus(nextState);
    if (nextState) setLocalLastOpenedAt(new Date().toISOString());
    router.refresh();
  }, [isOpen, router]);

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    await updateStoreSettings({
      openDays: openDays.join(','),
      openTime,
      closeTime
    });
    setIsSavingSettings(false);
    router.refresh();
  };

  const handleStatusUpdate = useCallback(async (id: string, status: string) => {
    await updateOrderStatus(id, status);
  }, []);

  const formatTel = (phone: string) => {
    let cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('0')) cleaned = '+964' + cleaned.substring(1);
    if (!cleaned.startsWith('+')) cleaned = '+964' + cleaned;
    return cleaned;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505] font-cairo overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#ff3b3b15,transparent_50%)]"></div>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (password === "admin123") setIsAuthenticated(true);
          else alert("رمز مرور خاطئ!");
        }} className="glass bg-white/[0.01] p-12 rounded-[4rem] w-full max-w-md shadow-2xl border border-white/5 relative z-10 text-center animate-fade-in">
          <div className="mb-10 group relative">
            {/* Ultra-Smooth Radiant Container */}
            <div className="w-32 h-32 bg-gradient-to-br from-[#ff5f00] via-[#ff3b3b] to-[#e62e2e] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_20px_60px_rgba(255,59,59,0.4)] border border-white/20 relative group-hover:scale-110 transition-all duration-1000 ease-in-out">
              {/* Diffused Glow Layer */}
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl opacity-40 animate-pulse"></div>
              
              {/* Perfectly Blended Inner Circle */}
              <div className="relative w-[5.8rem] h-[5.8rem] bg-white rounded-full flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] border-4 border-white/10 overflow-hidden">
                <img 
                  src="/55555555555_page-0001.jpg" 
                  alt="Logo" 
                  className="w-full h-full object-contain scale-95" 
                />
              </div>
              
              {/* Exterior Shine Ring */}
              <div className="absolute inset-[-4px] rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none italic animate-gradient-x bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white">TABASCO AL-SHAM</h1>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mt-5">Security Protocol Active</p>
          </div>
          
          <div className="space-y-6">
            <div className="relative group/input overflow-hidden rounded-[2rem]">
               <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 via-transparent to-brand-orange/10 opacity-0 group-focus-within/input:opacity-100 transition-opacity"></div>
               <input
                 autoFocus
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] px-8 py-6 text-white text-base md:text-xl font-black text-center focus:outline-none focus:border-brand-red/40 focus:bg-white/[0.05] transition-all relative z-10 placeholder:text-gray-800"
                 placeholder="••••••••"
               />
            </div>
            
            <button 
              type="submit" 
              className="group relative w-full bg-white text-black py-5 rounded-[2rem] font-black text-lg hover:bg-brand-red hover:text-white transition-all duration-500 overflow-hidden shadow-2xl active:scale-[0.95]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-red to-brand-orange opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 uppercase tracking-[0.2em] italic">دخول النظام</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 font-cairo text-right" dir="rtl">
      {/* Custom Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
          <div className="glass bg-[#0f0f10] p-8 rounded-[3rem] w-full max-sm relative z-10 border border-white/5 text-center shadow-3xl">
             <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icons.Trash />
              </div>
             <h3 className="text-xl font-black mb-2">هل أنت متأكد؟</h3>
             <p className="text-xs text-gray-500 font-bold leading-relaxed mb-8">
               {confirmModal.type === 'category' 
                ? 'سيتم حذف القسم وجميع الوجبات التابعة له نهائياً!' 
                : 'سيتم حذف هذه الوجبة من المنيو بشكل دائم.'}
             </p>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setConfirmModal(null)} className="py-4 bg-white/5 rounded-2xl font-black text-xs border border-white/5 hover:bg-white/10">إلغاء</button>
                <button onClick={handleConfirm} className="py-4 bg-red-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-red-500/20">تأكيد الحذف</button>
             </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <div className="glass bg-black/60 border-b border-white/5 sticky top-0 z-[100] px-4 md:px-8 py-3 md:py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3">
          {/* Store Toggle */}
          <div
            className="flex items-center gap-2 md:gap-4 bg-white/5 px-3 md:px-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl border border-white/5 cursor-pointer select-none active:scale-95 flex-row-reverse transition-all"
            onClick={handleToggleStore}
          >
            <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${isOpen ? 'text-green-500' : 'text-red-500'}`}>
              {isOpen ? 'مفتوح' : 'مغلق'}
            </span>
            <div className={`w-10 h-5 md:w-12 md:h-6 rounded-full relative transition-all duration-500 ${isOpen ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className={`absolute top-0.5 md:top-1 w-4 h-4 rounded-full transition-all duration-500 shadow-lg ${isOpen ? 'right-5 md:right-7 bg-green-500' : 'right-0.5 md:right-1 bg-red-500'}`}></div>
            </div>
            <span className="text-[9px] font-black uppercase text-gray-500 hidden sm:block">المطعم:</span>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 bg-white/5 hover:bg-red-500/10 hover:text-red-500 px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black border border-white/5 transition-all text-gray-500"
          >
            <Icons.Logout />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:p-8 pt-6 md:mt-12">
        
        {/* ANALYTICS OVERVIEW */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-8 md:mb-16">
          <div className="glass bg-brand-red/5 p-4 md:p-8 rounded-2xl md:rounded-[3rem] border border-brand-red/10 relative overflow-hidden transition-all hover:bg-brand-red/10 group">
            <span className="text-[9px] md:text-[10px] font-black text-brand-red uppercase tracking-widest block mb-1">طلبات اليوم</span>
            <div className="text-2xl md:text-3xl font-black italic">{todayOrdersCount}</div>
            <div className="absolute top-[-20px] right-[-20px] w-20 h-20 bg-brand-red/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          </div>
          
          <div className="glass bg-white/[0.02] p-4 md:p-8 rounded-2xl md:rounded-[3rem] border border-white/5 relative overflow-hidden transition-all hover:bg-white/[0.05]">
            <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">نشط حالياً</span>
            <div className="text-2xl md:text-3xl font-black italic text-brand-orange">{activeOrdersCount}</div>
          </div>

          <div className="col-span-2 lg:col-span-1 xl:col-span-3 glass bg-white/[0.01] p-4 md:p-8 rounded-2xl md:rounded-[3rem] border border-white/5 flex items-center justify-between flex-row-reverse border-dashed">
            <div className="text-right">
              <span className="text-[9px] md:text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-1">آخر تحديث</span>
              <p className="text-[10px] md:text-xs font-bold text-gray-400">تتم المزامنة تلقائياً كل ٣٠ ثانية</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center animate-spin duration-[3000ms]">
              <Icons.Check />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 md:flex md:gap-6 mb-8 md:mb-16">
          <button 
            onClick={() => setActiveTab("settings")} 
            className={`flex-1 py-3 md:py-4 px-4 md:px-14 rounded-[1.2rem] md:rounded-[2.5rem] text-[10px] md:text-sm font-black tracking-widest uppercase transition-all duration-700 flex items-center justify-center gap-3 md:gap-5 border-2 ${
              activeTab === "settings" 
                ? 'bg-brand-orange text-white border-brand-orange shadow-[0_20px_50px_rgba(255,95,0,0.3)] scale-[1.02] z-20' 
                : 'bg-white/5 text-brand-orange/60 border-brand-orange/20 hover:bg-brand-orange/5 hover:text-brand-orange group'
            }`}
          >
            <div className={`${activeTab === "settings" ? 'animate-spin-slow' : 'group-hover:animate-spin-slow'}`}>
              <Icons.Settings />
            </div>
            <div className="flex flex-col items-center md:items-start leading-none gap-1">
              <span className="text-[10px] md:text-xs">الإعدادات</span>
              <span className="text-[7px] md:text-[8px] opacity-60 uppercase font-extrabold tracking-tighter">SETTINGS</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab("menu")} 
            className={`flex-1 py-3 md:py-4 px-4 md:px-14 rounded-[1.2rem] md:rounded-[2.5rem] text-[10px] md:text-sm font-black tracking-widest uppercase transition-all duration-700 flex items-center justify-center gap-3 md:gap-5 border-2 ${
              activeTab === "menu" 
                ? 'bg-brand-red text-white border-brand-red shadow-[0_20px_50px_rgba(255,59,59,0.3)] scale-[1.02] z-20' 
                : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex flex-col items-center md:items-start leading-none gap-1">
              <span className="text-[10px] md:text-xs">المنيو</span>
              <span className="text-[7px] md:text-[8px] opacity-40 uppercase font-extrabold tracking-tighter">MENU</span>
            </div>
          </button>

          <button 
            onClick={() => setActiveTab("orders")} 
            className={`flex-1 py-3 md:py-4 px-4 md:px-14 rounded-[1.2rem] md:rounded-[2.5rem] text-[10px] md:text-sm font-black tracking-widest uppercase transition-all duration-700 flex items-center justify-center gap-3 md:gap-5 border-2 ${
              activeTab === "orders" 
                ? 'bg-brand-red text-white border-brand-red shadow-[0_20px_50px_rgba(255,59,59,0.3)] scale-[1.02] z-20' 
                : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex flex-col items-center md:items-start leading-none gap-1">
              <span className="text-[10px] md:text-xs">الطلبات</span>
              <span className="text-[7px] md:text-[8px] opacity-40 uppercase font-extrabold tracking-tighter">ORDERS</span>
            </div>
          </button>
        </div>

        {activeTab === "orders" && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center mb-4 md:mb-10 flex-row-reverse">
              <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">لوحة الطلبات</h2>
              <div className="h-0.5 flex-1 mx-4 md:mx-10 bg-white/[0.03]"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {initialOrders.length === 0 ? (
                <div className="col-span-full py-16 md:py-32 text-center glass rounded-3xl md:rounded-[4rem] border border-dashed border-white/10 opacity-30">
                  <p className="text-lg md:text-2xl font-black uppercase tracking-widest italic">لا يوجد طلبات جديدة</p>
                </div>
              ) : (
                initialOrders.map((o: any) => (
                  <div key={o.id} className={`glass p-5 md:p-10 rounded-3xl md:rounded-[4rem] border transition-all duration-700 relative group overflow-hidden ${o.status === 'DONE' ? 'border-green-500/20 bg-green-500/5 opacity-60' : 'border-white/5 bg-white/[0.02] hover:border-brand-red/20'}`}>
                    <div className="flex justify-between items-start mb-4 md:mb-10 flex-row-reverse">
                      <div className="text-right">
                        <span className="text-[9px] md:text-[10px] font-black text-brand-red uppercase tracking-widest block mb-1">رقم الطلب</span>
                        <h3 className="text-xl md:text-3xl font-black italic tracking-tighter">#{o.id.slice(-4).toUpperCase()}</h3>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${o.status === 'DONE' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-brand-orange/10 text-brand-orange border-brand-orange/20 animate-pulse'}`}>
                        {o.status === 'DONE' ? 'مكتمل' : 'قيد التحضير'}
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-6 mb-4 md:mb-10 border-y border-white/5 py-4 md:py-8">
                      {o.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center flex-row-reverse">
                          <span className="text-xs md:text-sm font-black text-white">{item.name}</span>
                          <span className="bg-white/5 px-2 py-1 rounded-lg text-xs font-black text-white">×{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mb-4 md:mb-10 flex-row-reverse">
                      <span className="text-[9px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest">المجموع</span>
                      <span className="text-lg md:text-2xl font-black text-brand-orange italic tracking-tighter">{o.total.toLocaleString()} د.ع</span>
                    </div>

                    <div className="flex gap-3 mt-auto">
                      {o.status !== 'DONE' && (
                        <button
                          onClick={() => handleStatusUpdate(o.id, 'DONE')}
                          className="flex-1 py-3.5 md:py-5 bg-green-500 text-white rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-500/30 active:scale-95 transition-all"
                        >
                          إنهاء الطلب
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${formatTel(o.customerPhone)}?text=${encodeURIComponent(`مرحباً! طلبك رقم #${o.id.slice(-4).toUpperCase()} جاهز الآن من تاباسكو الشام. المجموع: ${o.total.toLocaleString()} د.ع`)}`}
                        target="_blank"
                        className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/5 hover:bg-white/10 transition-all active:scale-95 text-xl"
                      >💬</a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-10 animate-fade-in">
            
            {/* Categories Sidebar */}
            <div className="lg:col-span-1 space-y-4 md:space-y-8">
              <div className="glass bg-white/[0.01] p-4 md:p-10 rounded-2xl md:rounded-[3.5rem] border border-white/5">
                <h2 className="font-black text-sm md:text-lg mb-4 md:mb-8 uppercase tracking-widest text-gray-500">الأقسام</h2>
                
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  if (newCatName) { await createCategory(newCatName); setNewCatName(''); } 
                }} className="relative mb-10">
                   <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="قسم جديد..." className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-sm md:text-xs font-black focus:border-brand-red/40 outline-none text-right" />
                   <button type="submit" className="absolute left-2 top-2 bg-brand-red w-11 h-11 rounded-xl flex items-center justify-center shadow-lg active:scale-90"><Icons.Plus /></button>
                </form>

                <div className="space-y-3">
                   {initialCategories.map((c: any) => (
                      <div key={c.id} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-2xl border border-white/[0.02] group/cat flex-row-reverse">
                         {editingCatId === c.id ? (
                           <div className="flex gap-2 w-full flex-row-reverse">
                              <input autoFocus type="text" value={editCatName} onChange={e => setEditCatName(e.target.value)} className="flex-1 bg-white/10 border border-brand-red/30 rounded-xl px-4 text-xs font-black outline-none" />
                              <button onClick={async () => { await updateCategory(c.id, editCatName); setEditingCatId(null); }} className="bg-brand-red p-2 rounded-lg text-white"><Icons.Check /></button>
                           </div>
                         ) : (
                           <>
                             <span className="font-black text-xs text-gray-300">{c.name}</span>
                             <div className="flex gap-1.5 opacity-0 group-hover/cat:opacity-100 transition-all flex-row-reverse">
                                <button onClick={() => { setEditingCatId(c.id); setEditCatName(c.name); }} className="p-2 h-9 w-9 rounded-xl bg-white/5 text-gray-500 hover:text-white"><Icons.Edit /></button>
                                <button onClick={() => setConfirmModal({show: true, type: 'category', id: c.id})} className="p-2 h-9 w-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"><Icons.Trash /></button>
                             </div>
                           </>
                         )}
                      </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Products Main Management */}
            <div className="lg:col-span-3 space-y-4 md:space-y-10">
              
              {/* Product Form Panel */}
              <div ref={editFormRef} className="glass bg-white/[0.01] p-4 md:p-12 rounded-2xl md:rounded-[4rem] border border-white/5">
                <h2 className="font-black text-lg md:text-2xl mb-5 md:mb-10 flex items-center gap-3 flex-row-reverse">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-brand-red shadow-[0_0_15px_#ff3b3b]"></div>
                  {editingProdId ? 'تعديل الصنف' : 'إضافة صنف جديد'}
                </h2>
                
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  const pData = { 
                    name: editingProdId ? editProdData.name : newProdName, 
                    price: Number(editingProdId ? editProdData.price : newProdPrice), 
                    description: editingProdId ? editProdData.description : newProdDesc, 
                    categoryId: editingProdId ? editProdData.categoryId : (newProdCat || initialCategories[0]?.id),
                    imageUrl: editingProdId ? editProdData.imageUrl : newProdImage,
                    isAvailable: editingProdId ? editProdData.isAvailable : newProdAvailable
                  };

                  if (editingProdId) { await updateProduct(editingProdId, pData); setEditingProdId(null); } 
                  else { await createProduct(pData); }
                  
                  setNewProdName(''); setNewProdPrice(''); setNewProdDesc(''); setNewProdImage(''); setNewProdAvailable(true);
                }} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-4">صورة الوجبة</label>
                        <div className="flex gap-2 flex-row-reverse">
                           <input type="text" value={editingProdId ? editProdData.imageUrl : newProdImage} onChange={e => editingProdId ? setEditProdData({...editProdData, imageUrl: e.target.value}) : setNewProdImage(e.target.value)} placeholder="رابط خارجي..." className="flex-1 bg-white/[0.03] border border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:border-brand-red/40 outline-none text-right" />
                           <button 
                             type="button" 
                             disabled={isUploading}
                             onClick={() => fileInputRef.current?.click()}
                             className={`px-6 rounded-[1.8rem] border border-white/10 font-black text-[10px] uppercase transition-all ${isUploading ? 'bg-white/5 opacity-50' : 'bg-white/5 hover:bg-white/10'}`}
                           >
                             {isUploading ? 'جاري...' : 'رفع'}
                           </button>
                           <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-4">تصنيف القسم</label>
                        <div className="relative" ref={catDropdownRef}>
                           <div 
                             onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                             className="w-full bg-white/[0.03] border border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black flex justify-between items-center cursor-pointer hover:bg-white/[0.05] transition-all flex-row-reverse"
                           >
                             <span className="text-white">
                                {initialCategories.find((c:any) => c.id === (editingProdId ? editProdData.categoryId : newProdCat))?.name || "اختر القسم..."}
                             </span>
                             <div className={`transition-transform duration-300 opacity-40 ${isCatDropdownOpen ? 'rotate-180' : ''}`}>▼</div>
                           </div>

                           {isCatDropdownOpen && (
                             <div className="absolute top-full left-0 w-full mt-3 bg-[#0d0d0e]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden z-[150] shadow-3xl animate-fade-in text-right">
                                {initialCategories.map((c:any) => (
                                  <div 
                                    key={c.id}
                                    onClick={() => {
                                      if (editingProdId) setEditProdData({...editProdData, categoryId: c.id});
                                      else setNewProdCat(c.id);
                                      setIsCatDropdownOpen(false);
                                    }}
                                    className={`px-8 py-5 text-sm font-black cursor-pointer transition-all ${
                                      (editingProdId ? editProdData.categoryId : newProdCat) === c.id 
                                      ? 'bg-brand-red text-white' 
                                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                  >
                                    {c.name}
                                  </div>
                                ))}
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-4">اسم الوجبة</label>
                        <input type="text" value={editingProdId ? editProdData.name : newProdName} onChange={e => editingProdId ? setEditProdData({...editProdData, name: e.target.value}) : setNewProdName(e.target.value)} placeholder="..." className="w-full bg-white/[0.03] border border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:border-brand-red/40 outline-none text-right" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-4">سعر الوجبة</label>
                        <input type="number" value={editingProdId ? editProdData.price : newProdPrice} onChange={e => editingProdId ? setEditProdData({...editProdData, price: Number(e.target.value)}) : setNewProdPrice(e.target.value)} placeholder="..." className="w-full bg-white/[0.03] border border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:border-brand-red/40 outline-none text-right" required />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest mr-4">وصف المكونات</label>
                         <input type="text" value={editingProdId ? editProdData.description : newProdDesc} onChange={e => editingProdId ? setEditProdData({...editProdData, description: e.target.value}) : setNewProdDesc(e.target.value)} placeholder="..." className="w-full bg-white/[0.03] border border-white/10 rounded-[1.8rem] px-8 py-5 text-sm font-black focus:border-brand-red/40 outline-none text-right" />
                      </div>
                      
                      <div 
                        onClick={() => editingProdId ? setEditProdData({...editProdData, isAvailable: !editProdData.isAvailable}) : setNewProdAvailable(!newProdAvailable)}
                        className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] cursor-pointer hover:bg-white/5 transition-all select-none flex-row-reverse"
                      >
                         <div className="flex items-center gap-4 flex-row-reverse">
                            <div className={`w-3 h-3 rounded-full ${(editingProdId ? editProdData.isAvailable : newProdAvailable) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">حالة التوفر:</span>
                         </div>
                         <span className={`text-[10px] font-black uppercase ${(editingProdId ? editProdData.isAvailable : newProdAvailable) ? 'text-green-500' : 'text-red-500'}`}>
                            {(editingProdId ? editProdData.isAvailable : newProdAvailable) ? 'متوفر للطلب' : 'نفدت الكمية'}
                         </span>
                      </div>
                   </div>
                   <div className="pt-4 flex gap-3 flex-row-reverse">
                       <button type="submit" className="flex-[2] py-4 md:py-5 bg-brand-red text-white rounded-2xl md:rounded-[1.8rem] font-black text-sm shadow-xl shadow-brand-red/30 active:scale-[0.98] transition-all">
                        {editingProdId ? 'حفظ التعديلات' : 'إضافة للمنيو الآن'}
                      </button>
                       {editingProdId && <button type="button" onClick={() => setEditingProdId(null)} className="flex-1 py-4 md:py-5 bg-white/5 rounded-2xl md:rounded-[1.8rem] font-black text-sm border border-white/5 hover:bg-white/10 transition-all text-white">إلغاء</button>}
                   </div>
                </form>
              </div>

              {/* Products List Panel */}
              <div className="glass bg-white/[0.01] p-4 md:p-12 rounded-2xl md:rounded-[4.5rem] border border-white/5">
                <div className="flex justify-between items-center mb-5 md:mb-12 flex-row-reverse">
                  <h2 className="font-black text-sm md:text-xl uppercase tracking-widest text-gray-500">قائمة الوجبات</h2>
                  <div className="h-0.5 flex-1 mx-4 md:mx-10 bg-white/[0.03]"></div>
                </div>

                <div className="space-y-2 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 max-h-[1000px] overflow-y-auto custom-scrollbar">
                  {initialCategories.map((c: any) =>
                    c.products.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex flex-row-reverse justify-between items-center bg-white/[0.02] p-3 md:p-4 rounded-xl md:rounded-[2rem] border border-white/5 hover:border-brand-red/20 transition-all gap-3"
                        style={{ contentVisibility: 'auto', containIntrinsicSize: '72px' }}
                      >
                        <div className="flex items-center gap-3 flex-row-reverse flex-1 min-w-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shrink-0">
                            <img src={p.imageUrl || "/burger-placeholder.png"} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-right flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-black text-white truncate">{p.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-row-reverse">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${p.isAvailable ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {p.isAvailable ? 'متوفر' : 'نفد'}
                              </span>
                              <span className="text-[9px] font-bold text-brand-orange">{p.price.toLocaleString()} د.ع</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => { setEditingProdId(p.id); setEditProdData({ ...p, categoryId: c.id }); setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
                            className="p-2.5 bg-white/5 text-gray-500 rounded-xl hover:text-white active:scale-90 transition-all border border-white/5"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={() => setConfirmModal({show: true, type: 'product', id: p.id})}
                            className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white active:scale-90 transition-all border border-red-500/20"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto animate-fade-in text-right">
             <div className="glass bg-white/[0.01] p-8 md:p-16 rounded-[4rem] border-2 border-white/5 relative overflow-hidden group/card shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover/card:bg-brand-red/10 transition-colors duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 border-b border-white/5 pb-10">
                   <div>
                      <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none mb-3 animate-gradient-x bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white">إعدادات المتجر</h2>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] opacity-40">Store Management & Operational Hours</p>
                   </div>
                   <div className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-[2.5rem] border border-white/5 shadow-inner">
                      <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-brand-red shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}></div>
                      <span className="text-xs font-black text-white/60 uppercase tracking-widest">{isOpen ? 'المتجر مفتوح الآن' : 'المتجر مغلق حالياً'}</span>
                   </div>
                </div>
                
                <div className="space-y-16">
                   {/* Days Selection */}
                   <div className="space-y-8">
                      <div className="flex items-center gap-4">
                         <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] leading-none">أيام العمل الأسبوعية</label>
                         <div className="h-[1px] flex-1 bg-gradient-to-l from-white/10 to-transparent"></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                         {[
                           {id: '1', name: 'الاثنـين', en: 'MON'},
                           {id: '2', name: 'الثـلاثاء', en: 'TUE'},
                           {id: '3', name: 'الأربـعاء', en: 'WED'},
                           {id: '4', name: 'الخـميس', en: 'THU'},
                           {id: '5', name: 'الجـمعة', en: 'FRI'},
                           {id: '6', name: 'السـبت', en: 'SAT'},
                           {id: '0', name: 'الأحـد', en: 'SUN'}
                         ].map((day) => (
                           <div 
                             key={day.id}
                             onClick={() => {
                               if (openDays.includes(day.id)) {
                                 setOpenDays(openDays.filter(d => d !== day.id));
                               } else {
                                 setOpenDays([...openDays, day.id]);
                               }
                             }}
                             className={`relative group p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all duration-700 text-center flex flex-col items-center gap-1 overflow-hidden active:scale-95 shadow-xl ${
                               openDays.includes(day.id) 
                               ? 'bg-gradient-to-br from-brand-red to-brand-orange border-transparent text-white scale-[1.05] z-10' 
                               : 'bg-white/[0.02] border-white/5 text-gray-500 hover:bg-white/[0.05] hover:border-white/10'
                             }`}
                           >
                              <span className={`text-sm md:text-base font-black whitespace-nowrap transition-colors ${openDays.includes(day.id) ? 'text-white' : 'group-hover:text-white'}`}>{day.name}</span>
                              <span className={`text-[8px] md:text-[9px] font-black tracking-[0.2em] uppercase opacity-40 transition-colors ${openDays.includes(day.id) ? 'text-white/60' : 'group-hover:text-brand-orange'}`}>{day.en}</span>
                              <div className={`absolute bottom-2 w-1 h-1 rounded-full transition-all duration-700 ${openDays.includes(day.id) ? 'bg-white scale-100 opacity-100' : 'bg-white/10 scale-0 opacity-0'}`}></div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Hours Selection */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6 group/time">
                         <div className="flex justify-between items-end px-6">
                            <div className="flex items-center gap-3">
                               <div className="w-2.5 h-2.5 rounded-full bg-brand-orange shadow-lg shadow-brand-orange/40 group-hover/time:scale-125 transition-transform"></div>
                               <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] leading-none">وقت الافتتاح</label>
                            </div>
                            <span className="text-[11px] font-black text-brand-orange uppercase italic tracking-[0.15em] animate-pulse">{format12h(openTime)}</span>
                         </div>
                         <div className="relative">
                            <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20 group-hover/time:opacity-60 transition-all duration-500 group-hover/time:scale-110">
                               <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <input 
                              type="time" 
                              value={openTime} 
                              onChange={e => setOpenTime(e.target.value)}
                              className="w-full bg-white/[0.02] border-2 border-white/5 rounded-[2.5rem] px-10 py-7 text-3xl font-black focus:border-brand-orange/40 focus:bg-white/[0.05] outline-none text-right [color-scheme:dark] transition-all duration-500 shadow-inner group-hover/time:border-white/10"
                            />
                         </div>
                      </div>
                      <div className="space-y-6 group/time">
                         <div className="flex justify-between items-end px-6">
                            <div className="flex items-center gap-3">
                               <div className="w-2.5 h-2.5 rounded-full bg-brand-red shadow-lg shadow-brand-red/40 group-hover/time:scale-125 transition-transform animate-pulse"></div>
                               <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] leading-none">وقت الإغلاق</label>
                            </div>
                            <span className="text-[11px] font-black text-brand-red uppercase italic tracking-[0.15em] animate-pulse">{format12h(closeTime)}</span>
                         </div>
                         <div className="relative">
                            <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-20 group-hover/time:opacity-60 transition-all duration-500 group-hover/time:scale-110">
                               <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <input 
                              type="time" 
                              value={closeTime} 
                              onChange={e => setCloseTime(e.target.value)}
                              className="w-full bg-white/[0.02] border-2 border-white/5 rounded-[2.5rem] px-10 py-7 text-3xl font-black focus:border-brand-red/40 focus:bg-white/[0.05] outline-none text-right [color-scheme:dark] transition-all duration-500 shadow-inner group-hover/time:border-white/10"
                            />
                         </div>
                      </div>
                   </div>

                   <div className="pt-12">
                     <button 
                       onClick={handleSaveSettings}
                       disabled={isSavingSettings}
                       className="group relative w-full py-8 bg-white text-black rounded-[2.5rem] font-black text-xl hover:text-white transition-all duration-700 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] active:scale-[0.98] disabled:opacity-50"
                     >
                       <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-brand-orange to-brand-red bg-[length:200%_auto] opacity-0 group-hover:opacity-100 transition-all duration-700 animate-gradient-x"></div>
                       <span className="relative z-10 uppercase tracking-[0.4em] italic flex items-center justify-center gap-4">
                         {isSavingSettings ? (
                            <>
                               <div className="w-5 h-5 border-4 border-black/20 border-t-black animate-spin rounded-full"></div>
                               <span>جاري الحفظ</span>
                            </>
                         ) : (
                            <>
                               <Icons.Check />
                               <span>حفظ الإعدادات الفاخرة</span>
                            </>
                         )}
                       </span>
                     </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* PREMIUM STANDARDIZED FOOTER */}
      <footer className="relative z-20 mt-40 pb-20 px-8 border-t border-white/5 pt-24 bg-gradient-to-b from-transparent to-black">
         <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row-reverse justify-between items-center md:items-start gap-16 text-right">
               
               {/* Branding & Socials */}
               <div className="space-y-10 flex flex-col items-center md:items-end">
                  <div className="flex flex-col items-center md:items-end gap-4">
                     <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/10 mb-2 shadow-2xl skew-y-3">
                        <img src="/55555555555_page-0001.jpg" alt="Logo" className="w-full h-full object-cover" />
                     </div>
                     <h3 className="text-4xl font-black text-white italic tracking-tighter leading-none italic animate-gradient-x bg-clip-text text-transparent bg-gradient-to-r from-white via-white/80 to-white">TABASCO AL-SHAM</h3>
                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] max-w-xs leading-relaxed text-center md:text-right">نقدم لكم أفخر النكهات الشامية الأصيلة والوصفات الأسطورية منذ {new Date().getFullYear()}</p>
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

               {/* Info & Location */}
               <div className="flex flex-col items-center md:items-start gap-12 text-center md:text-left">
                  <div className="space-y-6">
                     <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.5em] block">موقعنا</span>
                     <div className="space-y-2">
                        <span className="block text-white font-black text-2xl md:text-4xl italic tracking-tight">بغداد، بوب الشام</span>
                        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 mt-2">
                           <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-gray-400 text-[10px] md:text-xs font-black tracking-widest uppercase">
                              {format12h(settings?.openTime || "14:30")} - {format12h(settings?.closeTime || "01:30")}
                           </span>
                           <span className="px-4 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-[10px] md:text-xs font-black tracking-widest uppercase">
                              {(settings?.openDays?.split(',')?.length === 7) ? 'طوال أيام الأسبوع' : 'أيام العمل المحددة'}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center justify-center md:justify-start gap-4 text-brand-orange scale-110 md:scale-100 origin-right">
                        <div className="w-2 h-2 rounded-full bg-brand-orange animate-ping"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">فخر النكهة الشامية</span>
                     </div>
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
    </div>
  );
}
