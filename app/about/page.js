import { Card } from '@/components/ui/card';
import { generateMetadata as genMetadata } from '@/lib/seo';

export const metadata = genMetadata({
  title: 'เกี่ยวกับเรา',
  description: 'ประวัติความเชื่อและผู้นำของคริสตจักรชลบุรี ภาค7 - พันธกิจในการเผยแพร่ข่าวประเสริฐและสร้างชุมชนแห่งความเชื่อ',
  path: '/about',
  keywords: ['ประวัติคริสตจักร', 'ความเชื่อ', 'ผู้นำคริสตจักร', 'พันธกิจ'],
});

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4">
            <div className="inline-block">
              <div className="h-px w-16 bg-primary mx-auto mb-6" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              เกี่ยวกับเรา
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ประวัติและความเชื่อของคริสตจักรชลบุรี ภาค7
            </p>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 sm:p-12 border-0 shadow-lg">
            <div className="space-y-6">
              <div>
                <div className="inline-block">
                  <div className="h-px w-12 bg-primary mb-4" />
                </div>
                <h2 className="text-3xl font-bold mb-6">ประวัติคริสตจักร</h2>
              </div>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  คริสตจักรชลบุรี ภาค7 เป็นส่วนหนึ่งของคริสตจักรเพรสไบทีเรียนในประเทศไทย
                  ที่มุ่งเน้นในการเผยแพร่ข่าวประเสริฐและสร้างชุมชนแห่งความเชื่อ
                </p>
                <p>
                  เราเชื่อในการนมัสการพระเจ้าด้วยความจริงใจ
                  การศึกษาพระคัมภีร์อย่างลึกซึ้ง
                  และการรับใช้สังคมด้วยความรักและความเมตตา
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Our Beliefs */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">ความเชื่อของเรา</h2>
            <p className="text-muted-foreground text-lg">
              หลักคำสอนที่เราเชื่อถือและประกาศ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">พระเจ้าตรีเอกานุภาพ</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    เราเชื่อในพระเจ้าผู้เดียว ประกอบด้วยพระบิดา พระบุตร และพระวิญญาณบริสุทธิ์
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">พระคัมภีร์</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    เราเชื่อว่าพระคัมภีร์ไบเบิลเป็นพระวจนะของพระเจ้าที่สมบูรณ์และเที่ยงแท้
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">ความรอด</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    เราได้รับความรอดโดยพระคุณของพระเจ้า ผ่านความเชื่อในพระเยซูคริสต์
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">คริสตจักร</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    คริสตจักรคือชุมชนของผู้เชื่อที่ร่วมกันนมัสการและรับใช้พระเจ้า
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">ผู้นำคริสตจักร</h2>
            <p className="text-muted-foreground text-lg">
              ผู้รับใช้ที่พระเจ้าทรงเรียกให้เลี้ยงดูฝูงแกะของพระองค์
            </p>
          </div>

          <Card className="p-8 sm:p-12 bg-primary/5 border-primary/20">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">ผู้นำอาวุโส</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  คณะผู้นำและอาจารย์ของคริสตจักรพร้อมรับใช้และอภิบาลคริสตจักร
                </p>
                <p className="text-sm text-muted-foreground italic">
                  สามารถติดต่อผู้นำคริสตจักรได้ที่หน้าติดต่อเรา
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              © 2025 คริสตจักรชลบุรี ภาค7 - สงวนลิขสิทธิ์
            </p>
            <p className="text-xs text-muted-foreground">
              Chonburi Presbyterian Church - Region 7
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
