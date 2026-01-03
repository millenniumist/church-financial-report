'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackForm() {
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">ส่งข้อความเรียบร้อยแล้ว</h3>
            <p className="text-slate-600">ขอบคุณสำหรับความคิดเห็นของท่าน เราจะนำไปปรับปรุงให้ดียิ่งขึ้น</p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-primary font-medium hover:underline"
            >
              ส่งอีกหนึ่งข้อความ
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700 ml-1">
                  ชื่อ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="นิรนาม"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 ml-1">
                  อีเมล (ถ้ามี)
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium text-slate-700 ml-1">
                ข้อความ <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="แสดงความคิดเห็นของท่านที่นี่..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
              />
            </div>

            {status === 'error' && (
              <p className="text-sm text-rose-500 font-medium">
                เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  กำลังส่ง...
                </>
              ) : (
                'ส่งความคิดเห็น'
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
