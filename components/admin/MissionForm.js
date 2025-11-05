'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUpload from './ImageUpload';

export default function MissionForm({ mission = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    slug: mission?.slug || '',
    title: typeof mission?.title === 'string' ? mission.title : (mission?.title?.th || ''),
    titleEn: typeof mission?.title === 'object' ? (mission?.title?.en || '') : '',
    theme: typeof mission?.theme === 'string' ? mission.theme : (mission?.theme?.th || ''),
    themeEn: typeof mission?.theme === 'object' ? (mission?.theme?.en || '') : '',
    summary: typeof mission?.summary === 'string' ? mission.summary : (mission?.summary?.th || ''),
    summaryEn: typeof mission?.summary === 'object' ? (mission?.summary?.en || '') : '',
    description: typeof mission?.description === 'string' ? mission.description : (mission?.description?.th || ''),
    descriptionEn: typeof mission?.description === 'object' ? (mission?.description?.en || '') : '',
    focusAreas: Array.isArray(mission?.focusAreas) ? mission.focusAreas.join('\n') : '',
    scriptureText: typeof mission?.scripture === 'object' ? (mission?.scripture?.text || '') : '',
    scriptureReference: typeof mission?.scripture === 'object' ? (mission?.scripture?.reference || '') : '',
    nextSteps: typeof mission?.nextSteps === 'string' ? mission.nextSteps : (mission?.nextSteps?.th || ''),
    nextStepsEn: typeof mission?.nextSteps === 'object' ? (mission?.nextSteps?.en || '') : '',
    pinned: mission?.pinned || false,
    heroImageUrl: mission?.heroImageUrl || '',
    images: mission?.images || [],
    startDate: mission?.startDate ? new Date(mission.startDate).toISOString().split('T')[0] : '',
    endDate: mission?.endDate ? new Date(mission.endDate).toISOString().split('T')[0] : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Build JSON fields
      const data = {
        slug: formData.slug,
        title: { th: formData.title, en: formData.titleEn },
        theme: { th: formData.theme, en: formData.themeEn },
        summary: { th: formData.summary, en: formData.summaryEn },
        description: { th: formData.description, en: formData.descriptionEn },
        focusAreas: formData.focusAreas.split('\n').filter(line => line.trim()),
        scripture: (formData.scriptureText || formData.scriptureReference)
          ? { text: formData.scriptureText, reference: formData.scriptureReference }
          : null,
        nextSteps: { th: formData.nextSteps, en: formData.nextStepsEn },
        pinned: formData.pinned,
        heroImageUrl: formData.heroImageUrl || null,
        images: formData.images,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      };

      const url = mission
        ? `/api/admin/missions/${mission.id}`
        : '/api/admin/missions';

      const method = mission ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/admin/missions');
        router.refresh();
      } else {
        setError(result.error || result.details || 'Failed to save mission');
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-2">
            Slug (URL identifier) *
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            value={formData.slug}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="e.g., youth-ministry"
          />
          <p className="text-xs text-slate-500 mt-1">Used in URLs, must be unique</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
              Title (Thai) *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="titleEn" className="block text-sm font-medium text-slate-700 mb-2">
              Title (English)
            </label>
            <input
              id="titleEn"
              name="titleEn"
              type="text"
              value={formData.titleEn}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-slate-700 mb-2">
              Theme (Thai) *
            </label>
            <input
              id="theme"
              name="theme"
              type="text"
              value={formData.theme}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="themeEn" className="block text-sm font-medium text-slate-700 mb-2">
              Theme (English)
            </label>
            <input
              id="themeEn"
              name="themeEn"
              type="text"
              value={formData.themeEn}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Content</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-slate-700 mb-2">
              Summary (Thai) *
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="summaryEn" className="block text-sm font-medium text-slate-700 mb-2">
              Summary (English)
            </label>
            <textarea
              id="summaryEn"
              name="summaryEn"
              value={formData.summaryEn}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
              Description (Thai) *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="descriptionEn" className="block text-sm font-medium text-slate-700 mb-2">
              Description (English)
            </label>
            <textarea
              id="descriptionEn"
              name="descriptionEn"
              value={formData.descriptionEn}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="focusAreas" className="block text-sm font-medium text-slate-700 mb-2">
            Focus Areas (one per line) *
          </label>
          <textarea
            id="focusAreas"
            name="focusAreas"
            value={formData.focusAreas}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter each focus area on a new line"
          />
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-900">Scripture (Optional)</h4>

          <div>
            <label htmlFor="scriptureText" className="block text-sm font-medium text-slate-700 mb-2">
              Scripture Text
            </label>
            <textarea
              id="scriptureText"
              name="scriptureText"
              value={formData.scriptureText}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder='e.g., "For God so loved the world..."'
            />
          </div>

          <div>
            <label htmlFor="scriptureReference" className="block text-sm font-medium text-slate-700 mb-2">
              Scripture Reference
            </label>
            <input
              id="scriptureReference"
              name="scriptureReference"
              type="text"
              value={formData.scriptureReference}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="e.g., Matthew 28:19-20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nextSteps" className="block text-sm font-medium text-slate-700 mb-2">
              Next Steps (Thai) *
            </label>
            <textarea
              id="nextSteps"
              name="nextSteps"
              value={formData.nextSteps}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="nextStepsEn" className="block text-sm font-medium text-slate-700 mb-2">
              Next Steps (English)
            </label>
            <textarea
              id="nextStepsEn"
              name="nextStepsEn"
              value={formData.nextStepsEn}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <h2 className="text-lg font-semibold text-slate-900">Media & Dates</h2>

        <div>
          <label htmlFor="heroImageUrl" className="block text-sm font-medium text-slate-700 mb-2">
            Hero Image URL
          </label>
          <input
            id="heroImageUrl"
            name="heroImageUrl"
            type="url"
            value={formData.heroImageUrl}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Carousel Images
          </label>
          <ImageUpload
            images={formData.images}
            onChange={(images) => setFormData(prev => ({ ...prev, images }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
              Start Date
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
              End Date
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="pinned"
              checked={formData.pinned}
              onChange={handleChange}
              className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm font-medium text-slate-700">Pin this mission (highlight)</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : mission ? 'Update Mission' : 'Create Mission'}
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
