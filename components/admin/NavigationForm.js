'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NavigationForm({ item = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = Boolean(item);

  const [formData, setFormData] = useState({
    labelTh: item?.label?.th ?? '',
    labelEn: item?.label?.en ?? '',
    href: item?.href ?? '',
    order: item?.order ?? 0,
    active: item?.active ?? true,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = item ? `/api/admin/navigation/${item.id}` : '/api/admin/navigation';
      const method = item ? 'PATCH' : 'POST';

      const payload = {
        label: { th: formData.labelTh, en: formData.labelEn },
        order: Number(formData.order) || 0,
        active: formData.active,
      };

      if (!isEdit) {
        payload.href = formData.href;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save navigation item');
      }

      router.push('/admin/navigation');
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Label (TH) *
            </label>
            <input
              type="text"
              name="labelTh"
              value={formData.labelTh}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="เช่น พันธกิจ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Label (EN)
            </label>
            <input
              type="text"
              name="labelEn"
              value={formData.labelEn}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. Missions"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isEdit ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Link (href)
              </label>
              <div className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-600">
                <code>{formData.href}</code>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Path is set when the link is created and cannot be changed here.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Link (href) *
              </label>
              <input
                type="text"
                name="href"
                value={formData.href}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="/missions"
              />
              <p className="text-xs text-slate-500 mt-1">
                Use relative paths starting with <code>/</code>.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Order
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Lower numbers appear first
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="active"
            checked={formData.active}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm font-medium text-slate-700">Show in navigation</span>
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : item ? 'Update Link' : 'Create Link'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
