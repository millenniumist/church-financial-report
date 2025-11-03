import Image from "next/image";
import Link from "next/link";

export default function LandingFeatured() {
  return (
    <section className="px-6 py-12 bg-white">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-2 lg:gap-16 items-center">
        <div className="relative h-[320px] sm:h-[420px] lg:h-[500px] w-full overflow-hidden rounded-3xl shadow-xl">
          <Image
            src="/images/woman-horse.jpg"
            alt="Church community"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        </div>

        <div className="space-y-6 text-left">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
              กิจกรรมและการนมัสการ
            </span>
            <h2 className="text-3xl lg:text-5xl font-bold leading-tight text-neutral-900">
              เข้าร่วมนมัสการและสามัคคีธรรมกับเรา
            </h2>
          </div>
          <p className="text-base lg:text-lg text-neutral-600 leading-relaxed max-w-xl">
            ร่วมนมัสการทุกวันอาทิตย์ เวลา 09:00 น. และเข้าร่วมกิจกรรมต่างๆ ของคริสตจักร
            เพื่อเติบโตในความเชื่อและสร้างความสัมพันธ์ที่มั่นคงในพระคริสต์
          </p>
          <ul className="space-y-3 text-sm text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
              <span>การนมัสการประจำสัปดาห์ พร้อมบทเรียนพระคัมภีร์สำหรับทุกวัย</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
              <span>กลุ่มสามัคคีธรรมและกิจกรรมพิเศษสำหรับครอบครัวและเยาวชน</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" />
              <span>กิจกรรมบริการสังคมและพันธกิจชุมชนตลอดปี</span>
            </li>
          </ul>
          <Link
            href="/worship"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary"
          >
            ดูตารางกิจกรรม <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
