'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NavigationList({ items }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id, label) => {
    if (!confirm(`Are you sure you want to delete "${label}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/navigation/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete navigation item');
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setDeleting(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
        <p className="text-slate-600">No navigation links yet. Create your first link.</p>
        <Link
          href="/admin/navigation/new"
          className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          + New Link
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
                Label
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Link
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">
                    {item.label?.th || item.label?.en || '(No label)'}
                  </div>
                  {item.label?.en && item.label?.th && (
                    <div className="text-xs text-slate-500 mt-1">
                      EN: {item.label.en}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm bg-slate-100 px-2 py-1 rounded-md">
                    {item.href}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-700">{item.order}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.active ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/navigation/${item.id}`}
                      className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() =>
                        handleDelete(item.id, item.label?.th || item.label?.en || item.href)
                      }
                      disabled={deleting === item.id}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      {deleting === item.id ? 'Deleting...' : 'Delete'}
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
