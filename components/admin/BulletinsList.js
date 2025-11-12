'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BulletinsList() {
  const router = useRouter();
  const [bulletins, setBulletins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchBulletins();
  }, [page]);

  const fetchBulletins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/bulletins?page=${page}&limit=20&activeOnly=false`);
      const data = await response.json();

      if (response.ok) {
        setBulletins(data.bulletins);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch bulletins:', data.error);
      }
    } catch (error) {
      console.error('Error fetching bulletins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`ต้องการลบสูจิบัตร "${title}" หรือไม่? / Delete bulletin "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/bulletins/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('ลบสูจิบัตรสำเร็จ! / Bulletin deleted successfully!');
        fetchBulletins();
      } else {
        const data = await response.json();
        alert(`เกิดข้อผิดพลาด: ${data.error} / Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting bulletin:', error);
      alert('เกิดข้อผิดพลาดในการลบ / Delete failed');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const response = await fetch(`/api/admin/bulletins/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchBulletins();
      } else {
        const data = await response.json();
        alert(`เกิดข้อผิดพลาด: ${data.error} / Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating bulletin:', error);
      alert('เกิดข้อผิดพลาดในการอัพเดท / Update failed');
    }
  };

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

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  if (loading && bulletins.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">กำลังโหลด... / Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่ / Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ชื่อ / Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ขนาดไฟล์ / Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การจัดเก็บ / Storage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ / Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                จัดการ / Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bulletins.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  ยังไม่มีสูจิบัตร / No bulletins yet
                </td>
              </tr>
            ) : (
              bulletins.map((bulletin) => {
                const dates = formatDate(bulletin.date);
                return (
                  <tr key={bulletin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{dates.th}</div>
                      <div className="text-sm text-gray-500">{dates.en}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{bulletin.title.th}</div>
                      <div className="text-sm text-gray-500">{bulletin.title.en}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(bulletin.fileSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          📁 Local
                        </span>
                        {bulletin.cloudinaryUrl && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            ☁️ Cloudinary
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(bulletin.id, bulletin.isActive)}
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          bulletin.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {bulletin.isActive ? '✓ เผยแพร่ / Active' : '✗ ซ่อน / Hidden'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/api/bulletins/${bulletin.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          👁️ ดู / View
                        </a>
                        <button
                          onClick={() => handleDelete(bulletin.id, bulletin.title.th)}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️ ลบ / Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            หน้า {pagination.page} จาก {pagination.totalPages} / Page {pagination.page} of {pagination.totalPages}
            {' '}({pagination.total} รายการ / items)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className={`px-4 py-2 text-sm font-medium rounded ${
                page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ← ก่อนหน้า / Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className={`px-4 py-2 text-sm font-medium rounded ${
                page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ถัดไป / Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
