'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MissionsList({ missions }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/missions/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert('Failed to delete mission');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('An error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const getTitle = (mission) => {
    if (typeof mission.title === 'string') return mission.title;
    return mission.title?.th || mission.title?.en || 'Untitled';
  };

  if (missions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-slate-200">
        <p className="text-slate-600">No missions yet. Create your first mission!</p>
        <Link
          href="/admin/missions/new"
          className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
        >
          + New Mission
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
                Mission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {missions.map((mission) => {
              const title = getTitle(mission);
              const theme = typeof mission.theme === 'string'
                ? mission.theme
                : mission.theme?.th || mission.theme?.en || '';

              return (
                <tr key={mission.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-slate-900">{title}</div>
                      {theme && (
                        <div className="text-sm text-primary mt-1">{theme}</div>
                      )}
                      {mission.images?.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1">
                          {mission.images.length} image(s)
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mission.pinned
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {mission.pinned ? 'Pinned' : 'Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {mission.startDate && (
                      <div>Start: {new Date(mission.startDate).toLocaleDateString()}</div>
                    )}
                    {mission.endDate && (
                      <div>End: {new Date(mission.endDate).toLocaleDateString()}</div>
                    )}
                    {!mission.startDate && !mission.endDate && (
                      <span className="text-slate-400">No dates</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/missions/${mission.id}`}
                        className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(mission.id, title)}
                        disabled={deleting === mission.id}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      >
                        {deleting === mission.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
