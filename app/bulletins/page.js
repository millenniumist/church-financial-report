import { getBulletins } from '@/lib/bulletins';
import Link from 'next/link';

export const metadata = {
  title: 'สูจิบัตร | คริสตจักรชลบุรี ภาค 7',
  description: 'สูจิบัตรประจำสัปดาห์ของคริสตจักรชลบุรี ภาค 7 / Weekly Church Bulletins',
};

export default async function BulletinsPage({ searchParams }) {
  // Await searchParams as required by Next.js 15
  const params = await searchParams;
  const page = parseInt(params.page) || 1;
  const { bulletins, pagination } = await getBulletins({ page, limit: 12, activeOnly: true });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      th: date.toLocaleDateString('th-TH', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      }),
      en: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      })
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            สูจิบัตรประจำสัปดาห์
          </h1>
          <p className="text-xl text-blue-100">
            Weekly Church Bulletins
          </p>
          <p className="mt-4 text-blue-100">
            ดาวน์โหลดสูจิบัตรประจำการนมัสการของเราได้ที่นี่
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {bulletins.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ยังไม่มีสูจิบัตร
            </h2>
            <p className="text-gray-600">
              No bulletins available yet
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bulletins.map((bulletin) => {
                const dates = formatDate(bulletin.date);
                const fileSize = bulletin.fileSize 
                  ? (bulletin.fileSize / 1024 / 1024).toFixed(2) + ' MB'
                  : 'N/A';

                return (
                  <div
                    key={bulletin.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                  >
                    {/* PDF Icon Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
                      <div className="text-6xl mb-2">📄</div>
                      <div className="text-white text-sm font-medium">PDF Document</div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Date Badge */}
                      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-4">
                        {dates.th.split(' ')[0]} {/* Day of week in Thai */}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {bulletin.title.th}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {bulletin.title.en}
                      </p>

                      {/* Date */}
                      <div className="text-gray-700 mb-4">
                        <p className="font-medium">{dates.th}</p>
                        <p className="text-sm text-gray-500">{dates.en}</p>
                      </div>

                      {/* File Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                        <span>📊 {fileSize}</span>
                        <span>📅 {new Date(bulletin.createdAt).toLocaleDateString('th-TH')}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <a
                          href={`/api/bulletins/${bulletin.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          👁️ ดู / View
                        </a>
                        <a
                          href={`/api/bulletins/${bulletin.id}`}
                          download
                          className="flex-1 text-center px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                        >
                          💾 ดาวน์โหลด / Download
                        </a>
                      </div>

                      {/* Storage Info */}
                      <div className="mt-4 flex gap-2 justify-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          📁 Local
                        </span>
                        {bulletin.cloudinaryUrl && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            ☁️ Backup
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-4">
                {page > 1 && (
                  <Link
                    href={`/bulletins?page=${page - 1}`}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    ← หน้าก่อนหน้า / Previous
                  </Link>
                )}
                
                <div className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium">
                  หน้า {page} / {pagination.totalPages}
                </div>

                {page < pagination.totalPages && (
                  <Link
                    href={`/bulletins?page=${page + 1}`}
                    className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    หน้าถัดไป / Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">เกี่ยวกับสูจิบัตร / About Bulletins</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">📄 ไฟล์ PDF คุณภาพสูง</h3>
              <p className="text-blue-100">
                สามารถดูหรือดาวน์โหลดเพื่อพิมพ์ได้ / High-quality PDF files for viewing or printing
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">💾 ระบบสำรอง / Backup System</h3>
              <p className="text-blue-100">
                จัดเก็บทั้งในเซิร์ฟเวอร์หลักและคลาวด์ / Stored on main server with cloud backup
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📅 อัพเดททุกสัปดาห์ / Weekly Updates</h3>
              <p className="text-blue-100">
                สูจิบัตรใหม่ทุกวันอาทิตย์ / New bulletin every Sunday
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📱 เข้าถึงง่าย / Easy Access</h3>
              <p className="text-blue-100">
                ดูได้บนทุกอุปกรณ์ / Accessible on all devices
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
