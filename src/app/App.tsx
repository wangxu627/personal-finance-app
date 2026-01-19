import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { CalendarToday } from '@mui/icons-material';
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

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
}

const generateMockData = (year: number, month: number): Transaction[] => {
  const categories = [
    { name: '餐饮', icon: '🍔' },
    { name: '交通', icon: '🚗' },
    { name: '购物', icon: '🛍️' },
    { name: '娱乐', icon: '🎮' },
    { name: '日常', icon: '🏠' },
  ];
  
  const descriptions = {
    '餐饮': ['早餐', '午餐', '晚餐', '咖啡', '奶茶', '水果'],
    '交通': ['打车', '地铁', '公交', '停车费', '加油'],
    '购物': ['衣服', '鞋子', '日用品', '电子产品', '书籍'],
    '娱乐': ['电影', '游戏', '运动', '音乐会', 'KTV'],
    '日常': ['水电费', '房租', '话费', '网费', '医药'],
  };

  const transactions: Transaction[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 0; i < 15; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const descs = descriptions[category.name as keyof typeof descriptions];
    const description = descs[Math.floor(Math.random() * descs.length)];
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    
    transactions.push({
      id: `${year}-${month}-${i}`,
      description: `${category.icon} ${description}`,
      amount: Math.floor(Math.random() * 200) + 10,
      category: category.name,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      type: Math.random() > 0.9 ? 'income' : 'expense',
    });
  }

  // 添加一些收入项
  transactions.push({
    id: `${year}-${month}-income-1`,
    description: '💰 工资',
    amount: 8000,
    category: '收入',
    date: `${year}-${String(month).padStart(2, '0')}-01`,
    type: 'income',
  });

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [transactions, setTransactions] = useState<Record<string, Transaction[]>>({});

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const monthKey = `${currentYear}-${currentMonth}`;

  // 获取或生成当月数据
  const currentTransactions = transactions[monthKey] || generateMockData(currentYear, currentMonth);
  
  // 如果还没有这个月的数据，保存到状态中
  if (!transactions[monthKey]) {
    setTransactions(prev => ({
      ...prev,
      [monthKey]: currentTransactions,
    }));
  }

  // 计算汇总
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

  const handleAddTransaction = (description: string, amount: number) => {
    const newTransaction: Transaction = {
      id: `${Date.now()}`,
      description: description.startsWith('🍔') || description.startsWith('🚗') || 
                   description.startsWith('🛍️') || description.startsWith('🎮') || 
                   description.startsWith('🏠') ? description : `📝 ${description}`,
      amount,
      category: '其他',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
    };

    const key = `${currentYear}-${currentMonth}`;
    setTransactions(prev => ({
      ...prev,
      [key]: [newTransaction, ...(prev[key] || [])],
    }));
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
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMonthMenuClose}
            >
              <MenuItem onClick={() => handleMonthChange(-1)}>上个月</MenuItem>
              <MenuItem onClick={() => handleMonthChange(0)} disabled>
                当前月
              </MenuItem>
              <MenuItem onClick={() => handleMonthChange(1)}>下个月</MenuItem>
            </Menu>
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
        <QuickAddInput onAdd={handleAddTransaction} />
      </Box>
    </ThemeProvider>
  );
}
