import { Card } from '@/components/ui/card';
import { generateMetadata as genMetadata } from '@/lib/seo';

export const metadata = genMetadata({
  title: 'กิจกรรม',
  description: 'กิจกรรมและการรับใช้ที่คริสตจักรชลบุรี ภาค7 - กลุ่มเซลล์ กิจการต่างๆ และการเข้าร่วม',
  path: '/ministries',
  keywords: ['กิจกรรม', 'กลุ่มเซลล์', 'การรับใช้'],
});

export default function MinistriesPage() {
  const ministries = [
    { title: "กลุ่มครอบครัว", schedule: "เดือนละ 1 ครั้ง • เสาร์ 16:00 น.", description: "กิจกรรมสำหรับครอบครัวคริสเตียน เพื่อสร้างความสัมพันธ์ที่แข็งแกร่ง" },
    { title: "โรงเรียนวันอาทิตย์", schedule: "ทุกวันอาทิตย์ • 09:00 น.", description: "สำหรับเด็กและเยาวชน เรียนรู้พระวจนะผ่านกิจกรรมสนุกสนาน" },
    { title: "กลุ่มเยาวชน", schedule: "ทุกวันศุกร์ • 19:00 น.", description: "สำหรับวัยรุ่นและเยาวชน พัฒนาความเชื่อและสร้างมิตรภาพ" },
    { title: "กลุ่มผู้ใหญ่", schedule: "ทุกวันพุธ • 19:00 น.", description: "แบ่งปันความเชื่อ อธิษฐานร่วมกัน และเติบโตในพระคริสต์" },
    { title: "กลุ่มผู้สูงอายุ", schedule: "ทุกวันอังคาร • 10:00 น.", description: "พบปะพี่น้องผู้สูงอายุ อธิษฐานและเสริมกำลังใจกัน" },
    { title: "กลุ่มนักสรรเสริญ", schedule: "ทุกวันเสาร์ • 17:00 น.", description: "สำหรับผู้ที่มีใจรักในการนมัสการและสรรเสริญพระเจ้าด้วยดนตรี" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-4">
            <div className="inline-block"><div className="h-px w-16 bg-primary mx-auto mb-6" /></div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">กิจกรรมและกลุ่มเซลล์</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">ร่วมสร้างชุมชนแห่งความเชื่อและการรับใช้</p>
          </div>
        </div>
      </section>

      {/* Main Ministries */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block"><div className="h-px w-12 bg-primary mx-auto mb-4" /></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">กิจกรรมหลัก</h2>
            <p className="text-muted-foreground text-lg">หลากหลายกิจกรรมที่คุณสามารถเข้าร่วมได้</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ministries.map((ministry, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">{ministry.title}</h3>
                  <div className="text-sm text-primary font-medium">{ministry.schedule}</div>
                  <p className="text-muted-foreground">{ministry.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Cell Groups */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block"><div className="h-px w-12 bg-primary mx-auto mb-4" /></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">กลุ่มเซลล์</h2>
            <p className="text-muted-foreground text-lg">กลุ่มเล็กที่พบปะกันเป็นประจำเพื่อแบ่งปันชีวิตและเติบโตในความเชื่อ</p>
          </div>

          <div className="space-y-6">
            <Card className="p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">กลุ่มเซลล์คืออะไร?</h3>
                  <p className="text-muted-foreground">กลุ่มเซลล์เป็นการประชุมเล็กๆ ที่บ้านสมาชิก เพื่อแบ่งปันชีวิต ศึกษาพระคัมภีร์ อธิษฐานร่วมกัน และสร้างความสัมพันธ์ที่ลึกซึ้งกับพระเจ้าและพี่น้อง</p>
                </div>
              </div>
            </Card>

            <Card className="p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">สถานที่</h3>
                  <p className="text-muted-foreground">กลุ่มเซลล์พบปะกันที่บ้านของสมาชิกในพื้นที่ต่างๆ ของจังหวัดชลบุรี</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Outreach */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-block"><div className="h-px w-12 bg-primary mx-auto mb-4" /></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">การรับใช้สังคม</h2>
            <p className="text-muted-foreground text-lg">เราเชื่อในการรับใช้สังคมด้วยความรักของพระเจ้า</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3">งานการกุศล</h3>
              <p className="text-muted-foreground">ช่วยเหลือผู้ยากไร้และผู้ที่ต้องการความช่วยเหลือในชุมชน</p>
            </Card>
            <Card className="p-8 hover:shadow-lg transition-all duration-300">
              <h3 className="text-xl font-semibold mb-3">งานประกาศข่าวประเสริฐ</h3>
              <p className="text-muted-foreground">แบ่งปันความรักของพระเจ้ากับคนในชุมชนและพื้นที่ใกล้เคียง</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">© 2025 คริสตจักรชลบุรี ภาค7 - สงวนลิขสิทธิ์</p>
            <p className="text-xs text-muted-foreground">Chonburi Presbyterian Church - Region 7</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
