import { Card, CardContent, Typography, Box, Divider } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalance } from '@mui/icons-material';

interface SummaryCardProps {
  totalExpense: number;
  totalIncome: number;
  balance: number;
}

export function SummaryCard({ totalExpense, totalIncome, balance }: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return `¥ ${amount.toFixed(2)}`;
  };

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* 总支出 - 主要突出显示 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <TrendingDown sx={{ fontSize: 20, color: 'error.main', mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              总支出
            </Typography>
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: 'error.main',
              letterSpacing: '-0.5px',
            }}
          >
            {formatCurrency(totalExpense)}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 收入和结余 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          {/* 收入 */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <TrendingUp sx={{ fontSize: 18, color: 'success.main', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                收入
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                color: 'success.main',
              }}
            >
              {formatCurrency(totalIncome)}
            </Typography>
          </Box>

          {/* 结余 */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <AccountBalance sx={{ fontSize: 18, color: 'primary.main', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                结余
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                color: balance >= 0 ? 'primary.main' : 'error.main',
              }}
            >
              {formatCurrency(balance)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
