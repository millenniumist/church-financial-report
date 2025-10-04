import { getFinancialData } from '@/lib/sheets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import FinancialDisplay from '@/components/FinancialDisplay';

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

  return (
    <PageWrapper>
    <div className="min-h-screen bg-background">
      <FinancialDisplay initialData={data} />

      {/* Navigation */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/projects"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ดูโครงการในอนาคต →
          </Link>
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
    </PageWrapper>
  );
}