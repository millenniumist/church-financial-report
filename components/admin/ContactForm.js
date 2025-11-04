'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function createEmptyWorshipTime() {
  return {
    day: { th: '', en: '' },
    event: { th: '', en: '' },
    time: '',
  };
}

export default function ContactForm({ initialData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const [formData, setFormData] = useState(() => {
    const base = {
      name: { th: '', en: '' },
      phone: '',
      email: '',
      address: { th: '', en: '' },
      social: {
        facebook: '',
        facebookLive: '',
        youtube: '',
        line: '',
        instagram: '',
        website: '',
      },
      mapEmbedUrl: '',
      coordinates: { latitude: '', longitude: '' },
      worshipTimes: [createEmptyWorshipTime()],
    };

    const merged = {
      ...base,
      ...initialData,
      name: { ...base.name, ...(initialData?.name ?? {}) },
      address: { ...base.address, ...(initialData?.address ?? {}) },
      social: { ...base.social, ...(initialData?.social ?? {}) },
      coordinates: {
        ...base.coordinates,
        ...(initialData?.coordinates ?? {}),
      },
    };

    merged.worshipTimes =
      initialData?.worshipTimes?.length > 0
        ? initialData.worshipTimes.map((entry) => ({
            day: { th: entry.day?.th ?? '', en: entry.day?.en ?? '' },
            event: { th: entry.event?.th ?? '', en: entry.event?.en ?? '' },
            time: entry.time ?? '',
          }))
        : [createEmptyWorshipTime()];

    return merged;
  });

  const setLocalizedField = (group, locale, value) => {
    setFormData((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [locale]: value,
      },
    }));
  };

  const setSimpleField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const setSocialField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      social: {
        ...prev.social,
        [field]: value,
      },
    }));
  };

  const setCoordinateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [field]: value,
      },
    }));
  };

  const updateWorshipEntry = (index, field, locale, value) => {
    setFormData((prev) => {
      const entries = [...prev.worshipTimes];
      const target = { ...entries[index] };
      if (field === 'time') {
        target.time = value;
      } else if (field === 'day' || field === 'event') {
        target[field] = { ...target[field], [locale]: value };
      }
      entries[index] = target;
      return { ...prev, worshipTimes: entries };
    });
  };

  const addWorshipTime = () => {
    setFormData((prev) => ({
      ...prev,
      worshipTimes: [...prev.worshipTimes, createEmptyWorshipTime()],
    }));
  };

  const removeWorshipTime = (index) => {
    setFormData((prev) => {
      if (prev.worshipTimes.length === 1) return prev;
      const entries = prev.worshipTimes.filter((_, i) => i !== index);
      return { ...prev, worshipTimes: entries.length ? entries : [createEmptyWorshipTime()] };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/admin/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save contact info');
      }

      setStatus({ type: 'success', message: 'Contact information updated successfully.' });
      router.refresh();
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {status && (
        <div
          className={`p-4 rounded-lg border ${
            status.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {status.message}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">General Details</h2>
          <p className="text-sm text-slate-500">Primary contact information shown on the site.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Church Name (TH)
            </label>
            <input
              type="text"
              value={formData.name.th}
              onChange={(e) => setLocalizedField('name', 'th', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="คริสตจักร..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Church Name (EN)
            </label>
            <input
              type="text"
              value={formData.name.en}
              onChange={(e) => setLocalizedField('name', 'en', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Church..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setSimpleField('phone', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="02-123-4567, 081-234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setSimpleField('email', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="office@example.org"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Address</h2>
          <p className="text-sm text-slate-500">Displayed on the contact page.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Address (TH)
          </label>
          <textarea
            rows={3}
            value={formData.address.th}
            onChange={(e) => setLocalizedField('address', 'th', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="ที่อยู่ภาษาไทย"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Address (EN)
          </label>
          <textarea
            rows={3}
            value={formData.address.en}
            onChange={(e) => setLocalizedField('address', 'en', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Address in English"
          />
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Online Presence</h2>
          <p className="text-sm text-slate-500">
            Social links and map embed used throughout the site.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { key: 'facebook', label: 'Facebook Page' },
            { key: 'facebookLive', label: 'Facebook Live' },
            { key: 'youtube', label: 'YouTube Channel' },
            { key: 'line', label: 'LINE' },
            { key: 'instagram', label: 'Instagram' },
            { key: 'website', label: 'Website' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
              <input
                type="url"
                value={formData.social[key]}
                onChange={(e) => setSocialField(key, e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://..."
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Google Maps Embed URL
          </label>
          <input
            type="url"
            value={formData.mapEmbedUrl}
            onChange={(e) => setSimpleField('mapEmbedUrl', e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="https://www.google.com/maps/embed?..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={formData.coordinates.latitude}
              onChange={(e) => setCoordinateField('latitude', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="13.7367"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={formData.coordinates.longitude}
              onChange={(e) => setCoordinateField('longitude', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="100.5231"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Worship Schedule</h2>
            <p className="text-sm text-slate-500">
              Specify the regular services or gatherings.
            </p>
          </div>
          <button
            type="button"
            onClick={addWorshipTime}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm font-medium"
          >
            + Add Entry
          </button>
        </div>

        <div className="space-y-6">
          {formData.worshipTimes.map((entry, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg p-4 space-y-4 bg-slate-50/60"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">
                  Entry {index + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => removeWorshipTime(index)}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  disabled={formData.worshipTimes.length === 1}
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Day (TH)
                  </label>
                  <input
                    type="text"
                    value={entry.day.th}
                    onChange={(e) => updateWorshipEntry(index, 'day', 'th', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="อาทิตย์"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Day (EN)
                  </label>
                  <input
                    type="text"
                    value={entry.day.en}
                    onChange={(e) => updateWorshipEntry(index, 'day', 'en', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="Sunday"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Event (TH)
                  </label>
                  <input
                    type="text"
                    value={entry.event.th}
                    onChange={(e) => updateWorshipEntry(index, 'event', 'th', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="นมัสการภาษาไทย"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Event (EN)
                  </label>
                  <input
                    type="text"
                    value={entry.event.en}
                    onChange={(e) => updateWorshipEntry(index, 'event', 'en', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    placeholder="Thai Service"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={entry.time}
                  onChange={(e) => updateWorshipEntry(index, 'time', null, e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="09:30"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition font-medium"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
