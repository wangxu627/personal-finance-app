import {
  Box,
  List,
  ListItem,
  Paper,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Transaction, getCategoryById } from '@/app/App';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (transactionId: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const formatCurrency = (amount: number, type: 'expense' | 'income') => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}¥${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  const groupedByDate: Record<string, Transaction[]> = {};
  transactions.forEach(transaction => {
    if (!groupedByDate[transaction.date]) {
      groupedByDate[transaction.date] = [];
    }
    groupedByDate[transaction.date].push(transaction);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          color: 'text.secondary',
          fontWeight: 500,
        }}
      >
        账单明细
      </Typography>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <List sx={{ py: 0 }}>
          {sortedDates.map((date, dateIndex) => (
            <Box key={date}>
              {groupedByDate[date].map((transaction, index) => (
                <Box key={transaction.id}>
                  <ListItem
                    sx={{
                      py: 0.75,
                      px: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    {/* 类别图标 */}
                    {(() => {
                      const category = getCategoryById(transaction.categoryId);
                      if (category.icon) {
                        return (
                          <Typography
                            component="span"
                            sx={{ fontSize: '1.1rem', flexShrink: 0 }}
                          >
                            {category.icon}
                          </Typography>
                        );
                      } else {
                        return (
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: category.color || '#9E9E9E',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginLeft: '3px',
                              marginRight: '3px',
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.65rem',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            >
                              {category.name.charAt(0)}
                            </Typography>
                          </Box>
                        );
                      }
                    })()}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 400,
                        color: 'text.primary',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {transaction.description}
                    </Typography>
                    
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        flexShrink: 0,
                        minWidth: '32px',
                      }}
                    >
                      {formatDate(transaction.date)}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: transaction.type === 'income' ? 'success.main' : 'text.primary',
                        fontFamily: 'monospace',
                        flexShrink: 0,
                        minWidth: '80px',
                        textAlign: 'right',
                      }}
                    >
                      {formatCurrency(transaction.amount, transaction.type)}
                    </Typography>

                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() => onDelete(transaction.id)}
                      aria-label="删除"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItem>
                  {(index < groupedByDate[date].length - 1 || dateIndex < sortedDates.length - 1) && (
                    <Divider component="li" />
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </List>
      </Paper>
    </Box>
  );
}