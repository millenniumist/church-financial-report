'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackManager() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stats, setStats] = useState({ NEW: 0, READ: 0, ARCHIVED: 0 });

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback?status=${statusFilter}`);
      const data = await res.json();
      if (data.items) {
        setFeedback(data.items);
        // Basic stats calculation (ideally from backend)
        const newStats = data.items.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, { NEW: 0, READ: 0, ARCHIVED: 0 });
        setStats(newStats);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [statusFilter]);

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'bg-blue-500';
      case 'READ': return 'bg-emerald-500';
      case 'ARCHIVED': return 'bg-slate-400';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs / Filters */}
      <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        {['ALL', 'NEW', 'READ', 'ARCHIVED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              statusFilter === tab
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab === 'ALL' ? 'ทั้งหมด' : tab === 'NEW' ? 'ใหม่' : tab === 'READ' ? 'อ่านแล้ว' : 'เก็บถาวร'}
            {tab !== 'ALL' && stats[tab] > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] text-white ${getStatusColor(tab)}`}>
                {stats[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 italic">กำลังโหลด...</div>
        ) : feedback.length === 0 ? (
          <div className="py-20 text-center text-slate-400 italic">ไม่มีข้อมูลความคิดเห็น</div>
        ) : (
          <AnimatePresence mode="popLayout">
            {feedback.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(item.status)}`} />
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900">{item.name || 'นิรนาม'}</h3>
                      {item.email && (
                        <span className="text-xs text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                          {item.email}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.message}</p>
                  </div>

                  <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.status === 'NEW' && (
                      <button
                        onClick={() => updateStatus(item.id, 'READ')}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors title='Mark as Read'"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    {item.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => updateStatus(item.id, 'ARCHIVED')}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors title='Archive'"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Badge (visible even if not hovered) */}
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  {item.status === 'ARCHIVED' && (
                     <button
                        onClick={() => updateStatus(item.id, 'NEW')}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        RECOVERY TO NEW
                      </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
