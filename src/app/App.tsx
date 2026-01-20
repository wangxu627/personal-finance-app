/* @refresh skip */
import { CalendarToday, UploadFile } from '@mui/icons-material';
import {
  AppBar,
  Box,
  createTheme,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Popover,
  ThemeProvider,
  Toolbar,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { zhCN } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { QuickAddInput } from './components/QuickAddInput';
import { SummaryCard } from './components/SummaryCard';
import { TransactionList } from './components/TransactionList';
import {
  Category,
  Transaction,
  CATEGORIES,
  getCategoryById,
  updateCustomCategoryCache,
} from './types';

export type { Category, Transaction };
export { CATEGORIES, getCategoryById };

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

const getTransactionTime = (t: Transaction) =>
  new Date(t.createdAt ?? t.date).getTime();

const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}`;

const formatLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatLocalDateTime = (d: Date) => {
  const datePart = formatLocalDate(d);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${datePart}T${h}:${min}:${s}`;
};

const parseImportDate = (raw: string): Date | null => {
  const trimmed = raw.trim();
  if (/^\d{8}$/.test(trimmed)) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6));
    const day = Number(trimmed.slice(6, 8));
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(year, month - 1, day, 0, 0, 0);
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({});
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

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
        updateCustomCategoryCache(INITIAL_CUSTOM_CATEGORIES);
        setCustomCategories(INITIAL_CUSTOM_CATEGORIES);
      } else {
        updateCustomCategoryCache(allCats);
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
  const sortedCurrentTransactions = [...currentTransactions].sort(
    (a, b) => getTransactionTime(b) - getTransactionTime(a)
  );

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

  const handleAddTransaction = (description: string, amount: number, categoryId?: string, createdAtOverride?: string) => {
    const now = createdAtOverride ? new Date(createdAtOverride) : new Date();
    const newTransaction: Transaction = {
      id: `${now.getTime()}`,
      description,
      amount,
      categoryId: categoryId || 'other',
      date: formatLocalDate(now),
      createdAt: formatLocalDateTime(now),
      type: 'expense',
    };

    const key = getMonthKey(now);
    setTransactions(prev => ({
      ...prev,
      [key]: [newTransaction, ...(prev[key] || [])],
    }));

    void saveTransaction(newTransaction);
  };

  const handleImportTransactions = async () => {
    setImportError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch (error) {
      setImportError('JSON 格式不正确，请检查。');
      return;
    }

    if (!Array.isArray(parsed)) {
      setImportError('数据必须是数组格式。');
      return;
    }

    const now = Date.now();
    const transactionsToAdd: Transaction[] = [];

    for (let i = 0; i < parsed.length; i += 1) {
      const item = parsed[i] as {
        name?: string;
        price?: number;
        category?: string;
        createdAt?: string;
      };

      if (!item?.name || typeof item.name !== 'string') {
        setImportError(`第 ${i + 1} 条缺少 name。`);
        return;
      }
      if (typeof item.price !== 'number' || item.price <= 0) {
        setImportError(`第 ${i + 1} 条 price 无效。`);
        return;
      }
      if (!item.category || typeof item.category !== 'string') {
        setImportError(`第 ${i + 1} 条缺少 category。`);
        return;
      }
      if (!item.createdAt || typeof item.createdAt !== 'string') {
        setImportError(`第 ${i + 1} 条缺少 createdAt。`);
        return;
      }

      const parsedDate = parseImportDate(item.createdAt);
      if (!parsedDate) {
        setImportError(`第 ${i + 1} 条 createdAt 格式不正确。`);
        return;
      }

      const resolvedCategory = getCategoryById(item.category);

      transactionsToAdd.push({
        id: `${now}-${i}`,
        description: item.name.trim(),
        amount: item.price,
        categoryId: resolvedCategory.id || 'other',
        date: formatLocalDate(parsedDate),
        createdAt: formatLocalDateTime(parsedDate),
        type: 'expense',
      });
    }

    setTransactions(prev => {
      const next = { ...prev };
      transactionsToAdd.forEach(t => {
        const key = getMonthKey(new Date(t.date));
        next[key] = [t, ...(next[key] || [])];
      });
      return next;
    });

    await Promise.all(transactionsToAdd.map(saveTransaction));

    setImportDialogOpen(false);
    setImportText('');
  };

  const handleDeleteTransaction = (transactionId: string) => {
    const key = `${currentYear}-${currentMonth}`;
    setTransactions(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter(t => t.id !== transactionId),
    }));
    void deleteTransaction(transactionId);
  };

  const handleUpsertCategory = (category: Category) => {
    setCustomCategories(prev => {
      const exists = prev.some(c => c.id === category.id);
      const next = exists ? prev.map(c => (c.id === category.id ? category : c)) : [...prev, category];
      updateCustomCategoryCache(next);
      return next;
    });
    void saveCategory(category);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setCustomCategories(prev => {
      const next = prev.filter(c => c.id !== categoryId);
      updateCustomCategoryCache(next);
      return next;
    });
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
              onClick={() => setImportDialogOpen(true)}
              sx={{ color: 'text.primary' }}
              aria-label="导入"
            >
              <UploadFile />
            </IconButton>
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

        <Dialog
          open={importDialogOpen}
          onClose={() => {
            setImportDialogOpen(false);
            setImportError(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>导入交易</DialogTitle>
          <DialogContent>
            <TextField
              multiline
              minRows={8}
              fullWidth
              placeholder="粘贴 JSON 数组"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              sx={{ mt: 1 }}
            />
            {importError && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {importError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setImportDialogOpen(false);
                setImportError(null);
              }}
            >
              取消
            </Button>
            <Button
              variant="contained"
              onClick={handleImportTransactions}
              disabled={!importText.trim()}
            >
              导入
            </Button>
          </DialogActions>
        </Dialog>

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
          <TransactionList
            transactions={sortedCurrentTransactions}
            onDelete={handleDeleteTransaction}
          />
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