'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function FinancialCharts({ monthlyData }) {
  // Prepare data for monthly trend with cumulative balance
  const monthlyTrendData = monthlyData
    .filter(m => m.income > 0 || m.expense > 0)
    .reduce((acc, m, index) => {
      const previousBalance = index > 0 ? acc[index - 1].คงเหลือสะสม : 0;
      const cumulativeBalance = previousBalance + m.balance;

      acc.push({
        month: m.month.split(' ')[0], // Just month name without year
        รายรับ: m.income,
        รายจ่าย: m.expense,
        คงเหลือสะสม: cumulativeBalance,
      });

      return acc;
    }, []);

  return (
    <div className="space-y-8">
      {/* Monthly Trend Line Chart */}
      {monthlyTrendData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">แนวโน้มรายเดือน</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              * คงเหลือสะสม = ยอดสะสมตั้งแต่ต้นปี (เริ่มจาก ฿0)
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="รายรับ" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="รายจ่าย" stroke="#FF8042" strokeWidth={2} />
                <Line type="monotone" dataKey="คงเหลือสะสม" stroke="#8884D8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
