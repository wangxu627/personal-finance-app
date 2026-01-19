export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  date: string;
  createdAt?: string;
  type: 'expense' | 'income';
}

export const CATEGORIES: Record<string, Category> = {
  food: { id: 'food', name: '餐饮', icon: '🍔' },
  transport: { id: 'transport', name: '交通', icon: '🚗' },
  shopping: { id: 'shopping', name: '购物', icon: '🛍️' },
  entertainment: { id: 'entertainment', name: '娱乐', icon: '🎮' },
  daily: { id: 'daily', name: '日常', icon: '🏠' },
  income: { id: 'income', name: '收入', icon: '💰' },
  other: { id: 'other', name: '其他', icon: '📝' },
};

let CUSTOM_CATEGORY_CACHE: Category[] = [];

export const updateCustomCategoryCache = (categories: Category[]) => {
  CUSTOM_CATEGORY_CACHE = categories;
};

export const getCategoryById = (categoryId: string): Category => {
  const direct = CATEGORIES[categoryId];
  if (direct) return direct;
  const fromCustom = CUSTOM_CATEGORY_CACHE.find(c => c.id === categoryId);
  return fromCustom || CATEGORIES.other;
};
