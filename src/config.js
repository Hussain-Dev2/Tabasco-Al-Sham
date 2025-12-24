export const storeConfig = {
  storeName: "Karazat Banana",
  phoneNumber: "9647738411429", // Format: CountryCode + Number
  currency: "IQD", // Using IQD or 'د.ع'
  currencySymbol: "د.ع",
};

export const categories = [
  { id: 'all', name: 'الكل' },
  { id: 'nuts', name: 'مكسرات' },
  { id: 'korean_sweets', name: 'حلويات كورية' },
  { id: 'cake', name: 'كيك' },
  { id: 'chocolate', name: 'جكليت' }, 
];

export const products = [
  {
    id: 1,
    name: "كيلو مشكل جامبو",
    price: 15000,
    category: "nuts",
    image: "https://images.unsplash.com/photo-1599599810653-9853a53f521c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWl4ZWQlMjBudXRzfGVufDB8fDB8fHww",
  },
  {
    id: 2,
    name: "بوكس حلويات كورية مستوردة",
    price: 20000,
    category: "korean_sweets",
    image: "https://images.unsplash.com/photo-1582034986517-30d163aa1da9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXNpYW4lMjBzbmFja3N8ZW58MHx8MHx8fDA%3D",
  },
  {
    id: 3,
    name: "جكليت الطفولة",
    price: 10000,
    category: "chocolate",
    image: "https://images.unsplash.com/photo-1548848470-681d5147a46c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Y2hvY29sYXRlJTIwYmFyfGVufDB8fDB8fHww",
  },
  {
    id: 4,
    name: "كيكة الكراميل المميزة",
    price: 12000,
    category: "cake",
    image: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2FyYW1lbCUyMGNha2V8ZW58MHx8MHx8fDA%3D",
  },
];

