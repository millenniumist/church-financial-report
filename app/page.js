import { getFinancialData } from '@/lib/sheets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default async function Home() {
  let data = null;
  let error = null;

  try {
    data = await getFinancialData();
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">เกิดข้อผิดพลาด</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse space-y-2 text-center">
          <div className="h-2 w-32 bg-muted rounded mx-auto"></div>
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const { income, expenses, monthlyData, year, totals } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
              รายงานการเงิน
            </h1>
            <p className="text-lg text-muted-foreground">
              สรุปภาพรวมการเงินคริสตจักร ปี {year}
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
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">ยอดคงเหลือ</p>
                  <p className={`text-3xl sm:text-4xl font-semibold tracking-tight ${totals.balance >= 0 ? '' : 'text-destructive'}`}>
                    ฿{totals.balance.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Monthly Data Section */}
      {monthlyData && monthlyData.length > 0 && (
        <section className="py-12 sm:py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">รายงานรายเดือน</h2>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="h-14 px-6 text-left font-semibold">เดือน</TableHead>
                        <TableHead className="h-14 px-6 text-right font-semibold">รายรับ</TableHead>
                        <TableHead className="h-14 px-6 text-right font-semibold">รายจ่าย</TableHead>
                        <TableHead className="h-14 px-6 text-right font-semibold">คงเหลือ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.filter(m => m.income > 0 || m.expense > 0).map((month, index) => (
                        <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="h-16 px-6 font-medium">{month.month}</TableCell>
                          <TableCell className="h-16 px-6 text-right tabular-nums">
                            ฿{month.income.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className="h-16 px-6 text-right tabular-nums">
                            ฿{month.expense.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell className={`h-16 px-6 text-right font-medium tabular-nums ${month.balance >= 0 ? '' : 'text-destructive'}`}>
                            ฿{month.balance.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Income & Expenses Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Income */}
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">รายรับ</h2>
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  {income.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">ไม่มีข้อมูล</p>
                    </div>
                  ) : (
                    <Table>
                      <TableBody>
                        {income.map((item, index) => (
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
                            ฿{totals.income.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Expenses */}
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-semibold tracking-tight">รายจ่าย</h2>
              </div>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  {expenses.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">ไม่มีข้อมูล</p>
                    </div>
                  ) : (
                    <Table>
                      <TableBody>
                        {expenses.map((item, index) => (
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
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            ข้อมูลการเงินถูกรวมกลุ่มเป็นหมวดหมู่ระดับสูงเพื่อความโปร่งใสและการรักษาความเป็นส่วนตัว
          </p>
        </div>
      </footer>
    </div>
  );
}