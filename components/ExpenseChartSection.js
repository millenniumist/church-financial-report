'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableRow } from '@/components/ui/table';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#eab308', '#f48010', '#a855f7', '#22d3ee'
];

export default function ExpenseChartSection({ expenses = [], totals }) {
  // Sort expenses descending by amount for consistent display
  const sortedExpenses = [...expenses].sort((a, b) => b.amount - a.amount);

  const expensesChartData = sortedExpenses.map(item => ({
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

  if (expensesChartData.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Expenses Doughnut Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">รายจ่ายแยกตามประเภท</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={expensesChartData}
                cx="40%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={50}
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
                data={expensesChartData}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconSize={8}
                wrapperStyle={{ paddingLeft: '20px', fontSize: '11px' }}
                formatter={(value, entry) => {
                  const percentage = ((entry.payload.value / expensesChartData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1);
                  return `${value}`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableBody>
              {sortedExpenses.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="h-14 px-6">{item.category}</TableCell>
                  <TableCell className="h-14 px-6 text-right font-medium tabular-nums">
                    ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-primary text-primary-foreground hover:bg-primary">
                <TableCell className="h-14 px-6 font-semibold">รวม</TableCell>
                <TableCell className="h-14 px-6 text-right font-semibold tabular-nums">
                  ฿{totals.expenses.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
