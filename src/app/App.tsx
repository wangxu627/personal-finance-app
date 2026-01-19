import { useEffect, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Popover,
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN } from 'date-fns/locale';
import { SummaryCard } from '@/app/components/SummaryCard';
import { TransactionList } from '@/app/components/TransactionList';
import { QuickAddInput } from '@/app/components/QuickAddInput';

// Material 3 Light Theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4',
      light: '#7965AF',
      dark: '#4E3A8C',
    },
    secondary: {
      main: '#625B71',
    },
    background: {
      default: '#FEF7FF',
      paper: '#FFFBFE',
    },
    surface: {
      main: '#FFFBFE',
    },
    error: {
      main: '#BA1A1A',
    },
  },
  typography: {
    fontFamily: 'Roboto, "Noto Sans SC", sans-serif',
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
});

export interface Category {
  id: string;
  name: string;
  icon?: string;  // emoji 图标（可选）
  color?: string; // 自定义颜色（当没有 emoji 时使用）
}

// 类别配置 - 集中管理所有类别
export const CATEGORIES: Record<string, Category> = {
  food: { id: 'food', name: '餐饮', icon: '🍔' },
  transport: { id: 'transport', name: '交通', icon: '🚗' },
  shopping: { id: 'shopping', name: '购物', icon: '🛍️' },
  entertainment: { id: 'entertainment', name: '娱乐', icon: '🎮' },
  daily: { id: 'daily', name: '日常', icon: '🏠' },
  income: { id: 'income', name: '收入', icon: '💰' },
  other: { id: 'other', name: '其他', icon: '📝' },
  // 自定义类别示例（无 emoji，使用颜色）
  fitness: { id: 'custom-fitness', name: '健身', color: '#4CAF50' },
  education: { id: 'custom-education', name: '教育', color: '#2196F3' },
};

// 根据类别ID获取类别配置
export const getCategoryById = (categoryId: string): Category => {
  return CATEGORIES[categoryId] || CATEGORIES.other;
};

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: string;  // 使用类别ID而非名称
  date: string;
  type: 'expense' | 'income';
}

const DB_NAME = 'finance-db';
const DB_VERSION = 1;
const TRANSACTION_STORE_NAME = 'transactions';
const CATEGORY_STORE_NAME = 'categories';

const INITIAL_CUSTOM_CATEGORIES: Category[] = [
  { id: 'custom-fitness', name: '健身', color: '#4CAF50' },
  { id: 'custom-education', name: '教育', color: '#2196F3' },
];

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TRANSACTION_STORE_NAME)) {
        const store = db.createObjectStore(TRANSACTION_STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(CATEGORY_STORE_NAME)) {
        db.createObjectStore(CATEGORY_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSACTION_STORE_NAME, 'readonly');
    const store = tx.objectStore(TRANSACTION_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Transaction[]);
    request.onerror = () => reject(request.error);
  });
};

const saveTransaction = async (transaction: Transaction): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSACTION_STORE_NAME, 'readwrite');
    const store = tx.objectStore(TRANSACTION_STORE_NAME);
    const request = store.put(transaction);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const deleteTransaction = async (id: string): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TRANSACTION_STORE_NAME, 'readwrite');
    const store = tx.objectStore(TRANSACTION_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getAllCategories = async (): Promise<Category[]> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORY_STORE_NAME, 'readonly');
    const store = tx.objectStore(CATEGORY_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result as Category[];

      // 分离 custom 和 非 custom
      const nonCustom = all.filter(c => !c.id.startsWith('custom-'));
      const custom = all.filter(c => c.id.startsWith('custom-'));

      // 根据后缀判断：纯数字归为数字组，其它归为字母组（包含字母或混合）
      const customLetter = custom.filter(c => {
        const suffix = c.id.slice('custom-'.length);
        return !/^\d+$/.test(suffix);
      });
      const customNumber = custom.filter(c => {
        const suffix = c.id.slice('custom-'.length);
        return /^\d+$/.test(suffix);
      });

      // 排序：非 custom 按 id 字典序（保持确定性）
      nonCustom.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: false }));

      // 字母组按后缀字典序
      customLetter.sort((a, b) => {
        const sa = a.id.slice('custom-'.length);
        const sb = b.id.slice('custom-'.length);
        return sa.localeCompare(sb, undefined, { numeric: false });
      });

      // 数字组按数值排序
      customNumber.sort((a, b) => {
        const na = Number(a.id.slice('custom-'.length));
        const nb = Number(b.id.slice('custom-'.length));
        return na - nb;
      });

      // 最终顺序：非 custom -> custom(字母) -> custom(数字)
      resolve([...nonCustom, ...customLetter, ...customNumber]);
    };
    request.onerror = () => reject(request.error);
  });
};

const saveCategory = async (category: Category): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORY_STORE_NAME);
    const request = store.put(category);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const deleteCategory = async (categoryId: string): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORY_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CATEGORY_STORE_NAME);
    const request = store.delete(categoryId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const groupByMonth = (items: Transaction[]) => {
  const grouped = items.reduce<Record<string, Transaction[]>>((acc, t) => {
    const [y, m] = t.date.split('-');
    const key = `${Number(y)}-${Number(m)}`;
    (acc[key] ||= []).push(t);
    return acc;
  }, {});
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  return grouped;
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({});
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const monthKey = `${currentYear}-${currentMonth}`;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [allTx, allCats] = await Promise.all([getAllTransactions(), getAllCategories()]);
      if (cancelled) return;

      setTransactions(groupByMonth(allTx));

      if (allCats.length === 0) {
        await Promise.all(INITIAL_CUSTOM_CATEGORIES.map(saveCategory));
        if (cancelled) return;
        setCustomCategories(INITIAL_CUSTOM_CATEGORIES);
      } else {
        setCustomCategories(allCats);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    Object.keys(CATEGORIES).forEach((id) => {
      if (id.startsWith('custom-')) {
        delete CATEGORIES[id];
      }
    });
    customCategories.forEach((c) => {
      CATEGORIES[c.id] = c;
    });
  }, [customCategories]);

  // 获取当月数据（无 mock）
  const currentTransactions = transactions[monthKey] || [];

  const totalExpense = currentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = currentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  const handleMonthMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMonthMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMonthChange = (monthOffset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + monthOffset);
    setCurrentDate(newDate);
    handleMonthMenuClose();
  };

  const handleAddTransaction = (description: string, amount: number, categoryId?: string) => {
    const newTransaction: Transaction = {
      id: `${Date.now()}`,
      description,
      amount,
      categoryId: categoryId || 'other',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
    };

    const key = `${currentYear}-${currentMonth}`;
    setTransactions(prev => ({
      ...prev,
      [key]: [newTransaction, ...(prev[key] || [])],
    }));

    void saveTransaction(newTransaction);
  };

  const handleUpsertCategory = (category: Category) => {
    setCustomCategories(prev => {
      const exists = prev.some(c => c.id === category.id);
      return exists ? prev.map(c => (c.id === category.id ? category : c)) : [...prev, category];
    });
    void saveCategory(category);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCustomCategories(prev => prev.filter(c => c.id !== categoryId));
    void deleteCategory(categoryId);
  };

  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          bgcolor: 'background.default',
          overflow: 'hidden',
        }}
      >
        {/* Top App Bar */}
        <AppBar position="static" color="surface" elevation={0}>
          <Toolbar>
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, color: 'text.primary' }}
            >
              记账
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleMonthMenuOpen}
              sx={{ color: 'text.primary' }}
            >
              <CalendarToday />
            </IconButton>
            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleMonthMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDateFns} locale={zhCN}>
                <DateCalendar
                  value={currentDate}
                  onChange={(date) => {
                    if (date) {
                      setCurrentDate(date);
                      handleMonthMenuClose();
                    }
                  }}
                  views={['year', 'month']}
                  openTo="month"
                />
              </LocalizationProvider>
            </Popover>
          </Toolbar>
        </AppBar>

        {/* 当前月份显示 */}
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {currentYear} 年 {monthNames[currentMonth - 1]}
          </Typography>
        </Box>

        {/* 可滚动区域 */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 2,
            pb: 2,
          }}
        >
          {/* 汇总卡片 */}
          <SummaryCard
            totalExpense={totalExpense}
            totalIncome={totalIncome}
            balance={balance}
          />

          {/* 账单列表 */}
          <TransactionList transactions={currentTransactions} />
        </Box>

        {/* 固定底部输入区域 */}
        <QuickAddInput
          onAdd={handleAddTransaction}
          customCategories={customCategories}
          onUpsertCategory={handleUpsertCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </Box>
    </ThemeProvider>
  );
}