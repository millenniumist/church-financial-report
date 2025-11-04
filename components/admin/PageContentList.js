'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PageContentList({ sections }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id, page, section) => {
    if (!confirm(`Delete section "${section}" on page "${page}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/page-content/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete page section');
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setDeleting(null);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
        <p className="text-slate-600">No page sections yet. Create your first section.</p>
        <Link
          href="/admin/page-content/new"
          className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          + New Page Section
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Page
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Section
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sections.map((section) => (
              <tr key={section.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{section.page}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{section.section}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900">
                    {section.title.th || section.title.en || '(No title)'}
                  </div>
                  {section.subtitle?.th && (
                    <div className="text-xs text-slate-500 mt-1">
                      {section.subtitle.th}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {section.updatedAt
                    ? new Date(section.updatedAt).toLocaleString('th-TH')
                    : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/page-content/${section.id}`}
                      className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(section.id, section.page, section.section)}
                      disabled={deleting === section.id}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      {deleting === section.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
