import Link from 'next/link';
import BulletinsList from '@/components/admin/BulletinsList';

export const metadata = {
  title: 'จัดการสูจิบัตร / Manage Bulletins - Admin',
};

export default function BulletinsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            จัดการสูจิบัตร
          </h1>
          <p className="text-gray-600 mt-2">
            Manage Church Bulletins
          </p>
        </div>
        <Link
          href="/admin/bulletins/new"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + อัพโหลดสูจิบัตรใหม่ / Upload New Bulletin
        </Link>
      </div>

      <BulletinsList />
    </div>
  );
}
