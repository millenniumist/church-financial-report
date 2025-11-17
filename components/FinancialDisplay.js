'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import MonthlyTable from '@/components/MonthlyTable';
import IncomeChartSection from '@/components/IncomeChartSection';
import ExpenseChartSection from '@/components/ExpenseChartSection';
import MonthlyTrendChartSection from '@/components/MonthlyTrendChartSection';
import { getAdminSettings } from '@/lib/adminSettings';

export default function FinancialDisplay({ initialData }) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false); // Prevent double-fetching

  useEffect(() => {
    // Only fetch once
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadDataWithSettings = async () => {
      setIsLoading(true);

      try {
        // Fetch available categories from spreadsheet
        const categoriesResponse = await fetch('/api/categories');
        const detectedCategories = await categoriesResponse.json();

        // Get saved settings from localStorage
        const savedSettings = getAdminSettings();

        // Merge detected categories with saved settings
        const { mergeSettings } = await import('@/lib/adminSettings');
        const settings = mergeSettings(detectedCategories, savedSettings);

        // Fetch data with merged settings
        const response = await fetch('/api/financial-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings }),
        });

        if (response.ok) {
          const newData = await response.json();
          setData(newData);
        }
      } catch (error) {
        console.error('Error loading data with settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataWithSettings();
  }, []);

  const { income, expenses, monthlyData, year, totals } = data;

  // Calculate month range from available data
  const getMonthRange = (data, year) => {
    if (!data || data.length === 0) return null;

    const monthMap = {
      "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3, "พฤษภาคม": 4, "มิถุนายน": 5,
      "กรกฎาคม": 6, "สิงหาคม": 7, "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11
    };

    const monthNums = data.map(item => {
      // If month includes year, extract just month name
      const monthStr = item.month.split(' ')[0];
      return monthMap[monthStr] ?? -1;
    }).filter(num => num !== -1);

    if (monthNums.length === 0) return null;

    monthNums.sort((a, b) => a - b);

    const earliest = monthNums[0];
    const latest = monthNums[monthNums.length - 1];

    const thaiMonths = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    if (earliest === latest) {
      return `${thaiMonths[earliest]} ${year}`;
    }
    return `${thaiMonths[earliest]} - ${thaiMonths[latest]} ${year}`;
  };

  const monthRange = getMonthRange(monthlyData, year);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-2 text-center">
          <div className="h-2 w-32 bg-muted rounded mx-auto"></div>
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
              รายงานการเงิน
            </h1>
            <p className="text-lg text-muted-foreground">
              สรุปภาพรวมการเงินคริสตจักร ปี {year}
              {monthRange && <br />}
              {monthRange && <span className="text-sm">ข้อมูลเดือน: {monthRange}</span>}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Income Card */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">รายรับรวม</p>
                  <p className="text-3xl sm:text-4xl font-semibold tracking-tight">
                    ฿{totals.income.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Expense Card */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">รายจ่ายรวม</p>
                  <p className="text-3xl sm:text-4xl font-semibold tracking-tight">
                    ฿{totals.expenses.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Balance Card */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">ยอดคงเหลือสะสม</p>
                  <p className={`text-3xl sm:text-4xl font-semibold tracking-tight ${totals.balance >= 0 ? '' : 'text-destructive'}`}>
                    ฿{totals.balance.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">ตั้งแต่ต้นปี</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">แผนภูมิการเงิน</h2>
          </div>

          <div className="space-y-8">
            {/* Income and Expenses Charts with Tables */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <IncomeChartSection income={income} totals={totals} />
              <ExpenseChartSection expenses={expenses} totals={totals} />
            </div>

            {/* Monthly Trend Chart */}
            {monthlyData && monthlyData.length > 0 && (
              <MonthlyTrendChartSection monthlyData={monthlyData} />
            )}
          </div>
        </div>
      </section>

      {/* Monthly Data Section */}
      {monthlyData && monthlyData.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">รายงานรายเดือน</h2>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <MonthlyTable monthlyData={monthlyData} />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}


    </>
  );
}
