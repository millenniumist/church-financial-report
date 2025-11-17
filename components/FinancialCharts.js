'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82ca9d', '#ffc658', '#8dd1e1', '#d084d0', '#a4de6c',
  '#ff7c7c', '#6b8e23', '#dda0dd', '#4682b4', '#f08080'
];

export default function FinancialCharts({ monthlyData, income = [], expenses = [] }) {
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

  // Prepare data for pie charts
  const incomeChartData = income.map(item => ({
    name: item.category,
    value: item.amount
  }));

  const expensesChartData = expenses.map(item => ({
    name: item.category,
    value: item.amount
  }));

  // Custom label for pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Hide labels for slices less than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-8">
      {/* Doughnut Charts for Income and Expenses by Category */}
      {(incomeChartData.length > 0 || expensesChartData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income Doughnut Chart */}
          {incomeChartData.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">รายรับแยกตามประเภท</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={incomeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={120}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {incomeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry) => {
                        const percentage = ((entry.payload.value / incomeChartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
                        return `${value} (${percentage}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Expenses Doughnut Chart */}
          {expensesChartData.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">รายจ่ายแยกตามประเภท</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={expensesChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={120}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {expensesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry) => {
                        const percentage = ((entry.payload.value / expensesChartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
                        return `${value} (${percentage}%)`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
