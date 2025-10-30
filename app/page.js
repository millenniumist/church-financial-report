import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { AnimatedSection } from '@/components/AnimatedSection';
import { generateMetadata as genMetadata, siteConfig } from '@/lib/seo';

export const metadata = genMetadata({
  title: 'หน้าแรก',
  description: siteConfig.description,
  path: '/',
  keywords: ['หน้าแรก', 'ยินดีต้อนรับ'],
});

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      
      <AnimatedSection>
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-block">
                <div className="h-px w-16 bg-primary mx-auto mb-6" />
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                ยินดีต้อนรับสู่
                <span className="block mt-2 text-primary">คริสตจักรชลบุรี</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                ร่วมนมัสการและสรรเสริญพระเจ้ากับเรา<br />
                สร้างชุมชนแห่งความเชื่อและความรัก
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/worship"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                เข้าร่วมนมัสการ
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground font-medium transition-colors"
              >
                เรียนรู้เพิ่มเติม
              </Link>
            </div>
          </div>
        </div>
        </section>
      </AnimatedSection>

      {/* Service Times */}
      <AnimatedSection delay={0.1}>
        <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              เวลานมัสการ
            </h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              เชิญชวนทุกท่านมาร่วมนมัสการพระเจ้า
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative p-8">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    ทุกสัปดาห์
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-2">นมัสการวันอาทิตย์</h4>
                    <p className="text-4xl font-bold text-primary mb-3">09:00 น.</p>
                    <p className="text-muted-foreground">
                      การนมัสการร่วมกัน สรรเสริญพระเจ้า และฟังพระวจนะ
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="relative p-8">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    ทุกสัปดาห์
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-2">ประชุมอธิษฐาน</h4>
                    <p className="text-4xl font-bold text-primary mb-3">19:00 น.</p>
                    <p className="text-muted-foreground">
                      การอธิษฐานร่วมกัน แบ่งปันพระวจนะ และสามัคคีธรรม
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
        </section>
      </AnimatedSection>

      {/* Mission Statement */}
      <AnimatedSection delay={0.2}>
        <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-6">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">
              พันธกิจของเรา
            </h3>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              เราเชื่อในการเผยแพร่ข่าวประเสริฐของพระเยซูคริสต์
              สร้างชุมชนที่เข้มแข็งในความเชื่อ
              และรับใช้สังคมด้วยความรักและความเมตตาของพระเจ้า
            </p>
          </div>
        </div>
        </section>
      </AnimatedSection>

      {/* Quick Links */}
      <AnimatedSection delay={0.3}>
        <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block">
              <div className="h-px w-12 bg-primary mx-auto mb-4" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              สำรวจคริสตจักร
            </h3>
            <p className="text-muted-foreground text-lg">
              ค้นหาข้อมูลเพิ่มเติมเกี่ยวกับคริสตจักรของเรา
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/about" className="group">
              <Card className="relative h-full p-8 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform origin-left scale-x-0 transition-transform group-hover:scale-x-100" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      เกี่ยวกับเรา
                    </h4>
                    <p className="text-muted-foreground">
                      ประวัติ ความเชื่อ และผู้นำของคริสตจักร
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/ministries" className="group">
              <Card className="relative h-full p-8 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform origin-left scale-x-0 transition-transform group-hover:scale-x-100" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      กิจกรรม
                    </h4>
                    <p className="text-muted-foreground">
                      กลุ่มเซลล์ กิจกรรมต่างๆ และการรับใช้
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/contact" className="group">
              <Card className="relative h-full p-8 overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 transform origin-left scale-x-0 transition-transform group-hover:scale-x-100" />
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      ติดต่อเรา
                    </h4>
                    <p className="text-muted-foreground">
                      ที่อยู่ เวลาทำการ และช่องทางติดต่อ
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
        </section>
      </AnimatedSection>

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