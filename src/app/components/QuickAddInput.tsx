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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Add, AttachMoney, Category as CategoryIcon, Settings, Delete, Edit, AccessTime } from '@mui/icons-material';
import { Category, CATEGORIES } from '../types';

interface QuickAddInputProps {
  onAdd: (description: string, amount: number, categoryId?: string, createdAtOverride?: string) => void;
  customCategories: Category[];
  onUpsertCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

// 将 CATEGORIES 对象转换为数组，便于渲染
const getDefaultCategories = (): Category[] => {
  return (Object.values(CATEGORIES) as Category[])
    .filter(c => c.id !== 'income' && c.id !== 'other' && !c.id.startsWith('custom-'));
};

const PRESET_COLORS = [
  '#EF5350', // 红色
  '#EC407A', // 粉色
  '#AB47BC', // 紫色
  '#7E57C2', // 深紫色
  '#5C6BC0', // 靛蓝
  '#42A5F5', // 蓝色
  '#29B6F6', // 浅蓝
  '#26C6DA', // 青色
  '#26A69A', // 蓝绿
  '#66BB6A', // 绿色
  '#9CCC65', // 浅绿
  '#D4E157', // 黄绿
  '#FFEE58', // 黄色
  '#FFCA28', // 琥珀色
  '#FFA726', // 橙色
  '#FF7043', // 深橙
];

export function QuickAddInput({ onAdd, customCategories, onUpsertCategory, onDeleteCategory }: QuickAddInputProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // 分类管理相关状态
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 合并默认类别和自定义类别
  const defaultCategories = getDefaultCategories();
  const allCategories = [...defaultCategories, ...customCategories];

  const handleCategoryMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCategoryMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    handleCategoryMenuClose();
  };

  const handleAdd = () => {
    const trimmedDescription = description.trim();
    if (!trimmedDescription || !amount || parseFloat(amount) <= 0) {
      return;
    }

    // datetime-local 返回的是 "YYYY-MM-DDTHH:mm"，直接作为本地时间字符串传递
    const createdAtOverride = useCustomTime && customDateTime ? customDateTime : undefined;

    onAdd(trimmedDescription, parseFloat(amount), selectedCategory?.id, createdAtOverride);

    // 清空输入
    setDescription('');
    setAmount('');
    setSelectedCategory(null);
    setCustomDateTime('');
    setUseCustomTime(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAdd();
    }
  };

  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');

  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
    handleCategoryMenuClose();
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
    setNewCategoryName('');
    setNewCategoryColor(PRESET_COLORS[0]);
    setEditingId(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      return;
    }

    const category: Category = {
      id: editingId ? `custom-${editingId}` : `custom-${Date.now()}`,
      name: newCategoryName.trim(),
      color: newCategoryColor,
    };

    onUpsertCategory(category);
    setEditingId(null);
    setNewCategoryName('');
    setNewCategoryColor(PRESET_COLORS[0]);
  };

  const handleEditCategory = (category: Category) => {
    setEditingId(category.id);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color || PRESET_COLORS[0]);
  };

  const handleDeleteCategory = (categoryId: string) => {
    onDeleteCategory(categoryId);
  };

  const renderCategoryIcon = (category: Category) => {
    if (category.icon) {
      return <span style={{ fontSize: '20px' }}>{category.icon}</span>;
    }
    return (
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          marginRight: '4px',
          marginLeft: '4px',
          bgcolor: category.color,
        }}
      />
    );
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
              icon={<Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>{renderCategoryIcon(selectedCategory)}</Box>}
              label={selectedCategory.name}
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
            <CategoryIcon />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCategoryMenuClose}
          >
            {allCategories.map((category) => (
              <MenuItem
                key={category.id}
                onClick={() => handleCategorySelect(category)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {renderCategoryIcon(category)}
                  <span>{category.name}</span>
                </Box>
              </MenuItem>
            ))}
            <MenuItem onClick={handleOpenCategoryDialog}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <Settings fontSize="small" />
                <span>管理分类</span>
              </Box>
            </MenuItem>
          </Menu>

          {/* 描述输入框 */}
          <TextField
            fullWidth
            size="small"
            placeholder="例如：午餐"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
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
            onKeyDown={handleKeyDown}
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

        {/* 时间选择（默认隐藏，仅按钮展开） */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            aria-label="选择时间"
            onClick={() => {
              setUseCustomTime(prev => !prev);
              if (useCustomTime) setCustomDateTime('');
            }}
          >
            <AccessTime fontSize="small" />
          </IconButton>
          {useCustomTime && (
            <TextField
              size="small"
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          )}
        </Box>
      </Box>

      {/* 分类管理对话框 */}
      <Dialog open={categoryDialogOpen} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle>管理分类</DialogTitle>
        <DialogContent>
          {/* 分类列表 */}
          <List sx={{ mb: 2 }}>
            {allCategories.map((category) => {
              const isCustom = category.id.startsWith('custom-');
              return (
                <ListItem
                  key={category.id}
                  secondaryAction={
                    isCustom ? (
                      <>
                        <IconButton edge="end" onClick={() => handleEditCategory(category)} sx={{ mr: 1 }}>
                          <Edit />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDeleteCategory(category.id)}>
                          <Delete />
                        </IconButton>
                      </>
                    ) : null
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                    {renderCategoryIcon(category)}
                    <ListItemText primary={category.name} />
                  </Box>
                </ListItem>
              );
            })}
          </List>

          {/* 添加/编辑分类表单 */}
          <Box>
            <TextField
              fullWidth
              size="small"
              placeholder="分类名称"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* 颜色选择器 */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ mb: 1, color: 'text.secondary', fontSize: '2.875rem' }}>选择颜色</Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {PRESET_COLORS.map((color) => (
                  <IconButton
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    sx={{
                      width: 36,
                      height: 36,
                      padding: 0,
                      border: newCategoryColor === color ? '2px solid' : '2px solid transparent',
                      borderColor: newCategoryColor === color ? 'primary.main' : 'transparent',
                    }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: color,
                      }}
                    />
                  </IconButton>
                ))}
              </Box>
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              {editingId !== null ? '更新分类' : '添加分类'}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}