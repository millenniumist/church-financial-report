'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PageContentForm({ section = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    page: section?.page ?? '',
    section: section?.section ?? '',
    titleTh: section?.title?.th ?? '',
    titleEn: section?.title?.en ?? '',
    subtitleTh: section?.subtitle?.th ?? '',
    subtitleEn: section?.subtitle?.en ?? '',
    descriptionTh: section?.description?.th ?? '',
    descriptionEn: section?.description?.en ?? '',
    body: section?.body ? JSON.stringify(section.body, null, 2) : '',
    metadata: section?.metadata ? JSON.stringify(section.metadata, null, 2) : '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = section ? `/api/admin/page-content/${section.id}` : '/api/admin/page-content';
      const method = section ? 'PATCH' : 'POST';

      const payload = {
        page: formData.page,
        section: formData.section,
        title: { th: formData.titleTh, en: formData.titleEn },
        subtitle: { th: formData.subtitleTh, en: formData.subtitleEn },
        description: { th: formData.descriptionTh, en: formData.descriptionEn },
        body: formData.body,
        metadata: formData.metadata,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save page content');
      }

      router.push('/admin/page-content');
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
              Page *
            </label>
            <input
              type="text"
              name="page"
              value={formData.page}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. landing"
            />
            <p className="text-xs text-slate-500 mt-1">
              Identifier for the page (e.g., landing, about, contact)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Section *
            </label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g. hero, highlights"
            />
            <p className="text-xs text-slate-500 mt-1">
              Unique key per page section (combined with page must be unique)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title (TH)
            </label>
            <input
              type="text"
              name="titleTh"
              value={formData.titleTh}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title (EN)
            </label>
            <input
              type="text"
              name="titleEn"
              value={formData.titleEn}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subtitle (TH)
            </label>
            <input
              type="text"
              name="subtitleTh"
              value={formData.subtitleTh}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subtitle (EN)
            </label>
            <input
              type="text"
              name="subtitleEn"
              value={formData.subtitleEn}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (TH)
            </label>
            <textarea
              name="descriptionTh"
              value={formData.descriptionTh}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (EN)
            </label>
            <textarea
              name="descriptionEn"
              value={formData.descriptionEn}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Structured Content</h2>
          <p className="text-sm text-slate-500">
            Provide JSON payloads for complex layouts. Leave blank to skip.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Body (JSON)
          </label>
          <textarea
            name="body"
            value={formData.body}
            onChange={handleChange}
            rows={8}
            className="w-full font-mono text-sm px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder='e.g. { "ctaLabel": "Join Us", "ctaHref": "/contact" }'
          />
          <p className="text-xs text-slate-500 mt-1">
            JSON object or array. If invalid JSON, the raw text will be stored as-is.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Metadata (JSON)
          </label>
          <textarea
            name="metadata"
            value={formData.metadata}
            onChange={handleChange}
            rows={6}
            className="w-full font-mono text-sm px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder='e.g. { "background": "sunrise" }'
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : section ? 'Update Section' : 'Create Section'}
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
