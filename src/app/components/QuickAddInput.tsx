import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add, AttachMoney, Category } from '@mui/icons-material';

interface QuickAddInputProps {
  onAdd: (description: string, amount: number) => void;
}

const CATEGORIES = [
  { name: '餐饮', icon: '🍔' },
  { name: '交通', icon: '🚗' },
  { name: '购物', icon: '🛍️' },
  { name: '娱乐', icon: '🎮' },
  { name: '日常', icon: '🏠' },
  { name: '其他', icon: '📝' },
];

export function QuickAddInput({ onAdd }: QuickAddInputProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[0] | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCategoryMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCategorySelect = (category: typeof CATEGORIES[0]) => {
    setSelectedCategory(category);
    handleCategoryMenuClose();
  };

  const handleAdd = () => {
    if (!description.trim() || !amount || parseFloat(amount) <= 0) {
      return;
    }

    const finalDescription = selectedCategory 
      ? `${selectedCategory.icon} ${description.trim()}`
      : description.trim();

    onAdd(finalDescription, parseFloat(amount));
    
    // 清空输入
    setDescription('');
    setAmount('');
    setSelectedCategory(null);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <Paper
      elevation={8}
      sx={{
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        boxShadow: '0px -2px 4px -1px rgba(0, 0, 0, 0.2), 0px -4px 5px 0px rgba(0, 0, 0, 0.14)',
      }}
    >
      <Box sx={{ p: 2, pb: 3 }}>
        {/* 分类选择器 */}
        {selectedCategory && (
          <Box sx={{ mb: 1.5 }}>
            <Chip
              label={`${selectedCategory.icon} ${selectedCategory.name}`}
              onDelete={() => setSelectedCategory(null)}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          {/* 分类按钮 */}
          <IconButton
            onClick={handleCategoryMenuOpen}
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <Category />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCategoryMenuClose}
          >
            {CATEGORIES.map((category) => (
              <MenuItem
                key={category.name}
                onClick={() => handleCategorySelect(category)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* 描述输入框 */}
          <TextField
            fullWidth
            size="small"
            placeholder="例如：午餐"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* 金额输入框 */}
          <TextField
            size="small"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              // 只允许数字和小数点
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setAmount(value);
              }
            }}
            onKeyPress={handleKeyPress}
            type="text"
            inputMode="decimal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 240,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {/* 添加按钮 */}
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!description.trim() || !amount || parseFloat(amount) <= 0}
            sx={{
              minWidth: 48,
              height: 40,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            }}
          >
            <Add />
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
