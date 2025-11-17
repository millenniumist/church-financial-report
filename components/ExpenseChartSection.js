'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useState, useEffect } from 'react';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#eab308', '#f48010', '#a855f7', '#22d3ee'
];

export default function ExpenseChartSection({ expenses = [], totals }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

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
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={isMobile ? 100 : 120}
                innerRadius={isMobile ? 50 : 60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {expensesChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => {
                  const percent = ((value / totals.expenses) * 100).toFixed(1);
                  return `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 0 })} (${percent}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Custom Chart Legend - complete data with colors and total */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
              {sortedExpenses.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <div
                    className="relative w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {item.category}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-destructive flex-shrink-0" />
                  <span className="text-sm font-semibold">รวมรายจ่ายทั้งหมด</span>
                </div>
                <div className="text-lg font-bold text-destructive tabular-nums">
                  ฿{totals.expenses.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
