import React from 'react';
import { storeConfig } from '../config';

export default function CartSummary({ cartItems }) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (totalItems === 0) return null;

  const handleCheckout = () => {
    // 1. رقم هاتف صاحب المتجر
    const { phoneNumber } = storeConfig;

    // 2. تجهيز نص الرسالة
    let message = `*طلب جديد من متجر كرزات بنانا 🍌*\n`;
    message += `----------------------------\n`;

    // 3. إضافة المنتجات
    cartItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      const formattedTotal = itemTotal.toLocaleString('en-US');
      message += `▪️ ${item.name}\n   العدد: ${item.quantity} | السعر: ${formattedTotal}\n`;
    });

    // 4. إضافة خط فاصل والمجموع الكلي
    const formattedGrandTotal = totalPrice.toLocaleString('en-US');
    message += `----------------------------\n`;
    message += `*المجموع الكلي: ${formattedGrandTotal} ${storeConfig.currencySymbol}*\n`;
    message += `----------------------------\n`;
    message += `طرق الدفع المتاحة:\n- زين كاش\n- آسيا حوالة\n`;
    message += `\n📍 يرجى تزويدنا بالعنوان الكامل لإتمام الطلب:`;

    // 5. تشفير الرسالة
    const encodedMessage = encodeURIComponent(message);

    // 6. فتح رابط واتساب
    const url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] safe-area-pb z-50">
      <div className="max-w-md mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-gray-500 text-xs font-medium">المجموع الكلي</span>
          <span className="text-xl font-black text-banana-black">{totalPrice.toLocaleString()} {storeConfig.currencySymbol}</span>
        </div>
        
        <button
          onClick={handleCheckout}
          className="flex-1 bg-banana-yellow hover:bg-yellow-400 text-banana-black py-3.5 px-6 rounded-2xl font-bold shadow-lg shadow-yellow-200/50 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>إتمام الطلب عبر واتساب</span>
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
