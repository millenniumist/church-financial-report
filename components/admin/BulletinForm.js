'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BulletinForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [titleTh, setTitleTh] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [file, setFile] = useState(null);

  // Get next Sunday as default
  const getNextSunday = () => {
    const date = new Date();
    date.setDate(date.getDate() + ((7 - date.getDay()) % 7));
    if (date.getDay() !== 0) {
      date.setDate(date.getDate() + 7);
    }
    return date.toISOString().split('T')[0];
  };

  // Check if date is Sunday
  const isSunday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 0;
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    
    if (date && !isSunday(date)) {
      setError('กรุณาเลือกวันอาทิตย์เท่านั้น (Please select Sunday only)');
    } else {
      setError('');
      
      // Auto-generate titles based on date
      if (date) {
        const dateObj = new Date(date);
        const thDate = dateObj.toLocaleDateString('th-TH', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const enDate = dateObj.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        setTitleTh(`สูจิบัตร ${thDate}`);
        setTitleEn(`Bulletin ${enDate}`);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('กรุณาอัพโหลดไฟล์ PDF เท่านั้น (Please upload PDF files only)');
        setFile(null);
        e.target.value = '';
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB) / File size too large (max 10MB)');
        setFile(null);
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !file) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน / Please fill in all required fields');
      return;
    }

    if (!isSunday(selectedDate)) {
      setError('กรุณาเลือกวันอาทิตย์เท่านั้น / Please select Sunday only');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('date', selectedDate);
      formData.append('titleTh', titleTh);
      formData.append('titleEn', titleEn);

      const response = await fetch('/api/admin/bulletins', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload bulletin');
      }

      alert('อัพโหลดสูจิบัตรสำเร็จ! / Bulletin uploaded successfully!');
      router.push('/admin/bulletins');
      router.refresh();
    } catch (error) {
      console.error('Error uploading bulletin:', error);
      setError(error.message || 'เกิดข้อผิดพลาดในการอัพโหลด / Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">อัพโหลดสูจิบัตร / Upload Bulletin</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Date Picker - Sundays Only */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          วันอาทิตย์ / Sunday Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          min={new Date().toISOString().split('T')[0]}
        />
        <p className="text-sm text-gray-500 mt-1">
          * เลือกได้เฉพาะวันอาทิตย์เท่านั้น / Only Sundays can be selected
        </p>
      </div>

      {/* Thai Title */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          ชื่อ (ไทย) / Title (Thai)
        </label>
        <input
          type="text"
          value={titleTh}
          onChange={(e) => setTitleTh(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="สูจิบัตร วันอาทิตย์ที่..."
        />
      </div>

      {/* English Title */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          ชื่อ (อังกฤษ) / Title (English)
        </label>
        <input
          type="text"
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Bulletin Sunday..."
        />
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label className="block text-gray-700 font-medium mb-2">
          ไฟล์ PDF / PDF File <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          * ไฟล์ PDF เท่านั้น, ขนาดสูงสุด 10MB / PDF only, max 10MB
        </p>
        {file && (
          <p className="text-sm text-green-600 mt-2">
            ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {/* Storage Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>💾 การจัดเก็บ / Storage:</strong>
        </p>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>✓ หลัก: Raspberry Pi (Local Storage)</li>
          <li>✓ สำรอง: Cloudinary (Backup)</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || !selectedDate || !file}
          className={`flex-1 py-3 px-6 rounded font-medium text-white transition-colors ${
            loading || !selectedDate || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'กำลังอัพโหลด... / Uploading...' : 'อัพโหลด / Upload'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/bulletins')}
          className="px-6 py-3 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ยกเลิก / Cancel
        </button>
      </div>
    </form>
  );
}
