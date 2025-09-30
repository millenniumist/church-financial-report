import { getProjectData } from '@/lib/sheets';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatCurrency(amount) {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function ProjectsPage() {
  let data;

  try {
    data = await getProjectData();
  } catch (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div data-slot="card" className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold text-destructive">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  const { projects } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
              โครงการในอนาคต
            </h1>
            <p className="text-lg text-muted-foreground">
              ความคืบหน้าการระดมทุนสำหรับโครงการพัฒนาคริสตจักร
            </p>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div
                key={index}
                data-slot="card"
                className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl p-8 border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold tracking-tight">
                    {project.name}
                  </h3>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ความคืบหน้า</span>
                      <span className="font-medium">{project.percentage}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.min(project.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        เงินถวายปัจจุบัน
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        ฿{formatCurrency(project.current)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        เป้าหมาย
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        ฿{formatCurrency(project.goal)}
                      </p>
                    </div>
                  </div>

                  {/* Remaining Amount */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      เหลืออีก{' '}
                      <span className="font-medium text-foreground">
                        ฿{formatCurrency(project.goal - project.current)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            href="/"
            className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← กลับไปหน้ารายงานการเงิน
          </Link>
        </div>
      </section>
    </div>
  );
}