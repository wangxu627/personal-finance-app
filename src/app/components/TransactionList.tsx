import { List, ListItem, ListItemText, Typography, Box, Divider, Paper } from '@mui/material';
import type { Transaction } from '@/app/App';

interface TransactionListProps {
  transactions: Transaction[];
}

export function TransactionList({ transactions }: TransactionListProps) {
  const formatCurrency = (amount: number, type: 'expense' | 'income') => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}¥${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (transactions.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 6,
          color: 'text.secondary',
        }}
      >
        <Typography variant="body2">暂无账单记录</Typography>
        <Typography variant="caption">在下方添加您的第一笔账目</Typography>
      </Box>
    );
  }

  // 按日期分组
  const groupedByDate = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1.5,
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
                      py: 2,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 400,
                            color: 'text.primary',
                          }}
                        >
                          {transaction.description}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            mt: 0.5,
                            display: 'block',
                          }}
                        >
                          {formatDate(transaction.date)}
                        </Typography>
                      }
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: transaction.type === 'income' ? 'success.main' : 'text.primary',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatCurrency(transaction.amount, transaction.type)}
                    </Typography>
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
