import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingDown } from '@mui/icons-material';

interface SummaryCardProps {
  totalExpense: number;
  totalIncome: number;
  balance: number;
}

export function SummaryCard({ totalExpense }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return `¥ ${amount.toFixed(2)}`;
  };

  return (
    <Card
      sx={{
        mb: 1.5,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* 总支出 - 主要突出显示 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <TrendingDown sx={{ fontSize: 18, color: 'error.main', mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              总支出
            </Typography>
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: 'error.main',
              letterSpacing: '-0.5px',
              fontSize: '2rem',
            }}
          >
            {formatCurrency(totalExpense)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}