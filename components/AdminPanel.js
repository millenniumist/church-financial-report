'use client';

import { useState, useEffect } from 'react';
import { getAdminSettings, saveAdminSettings, resetAdminSettings, mergeSettings } from '@/lib/adminSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, RotateCcw } from 'lucide-react';

export default function AdminPanel({ isOpen, onClose }) {
  const [settings, setSettings] = useState({ incomeRows: [], expenseRows: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch available categories from spreadsheet
      const response = await fetch('/api/categories');
      const detectedCategories = await response.json();

      // Get saved settings from localStorage
      const savedSettings = getAdminSettings();

      // Merge detected categories with saved settings
      const merged = mergeSettings(detectedCategories, savedSettings);
      setSettings(merged);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityToggle = (type, id) => {
    const newSettings = { ...settings };
    const row = newSettings[type].find(r => r.id === id);
    if (row) {
      row.visible = !row.visible;
      setSettings(newSettings);
    }
  };

  const handleAggregationChange = (type, id, aggregateInto) => {
    const newSettings = { ...settings };
    const row = newSettings[type].find(r => r.id === id);
    if (row) {
      row.aggregateInto = aggregateInto || null;
      setSettings(newSettings);
    }
  };

  const handleSave = () => {
    saveAdminSettings(settings);
    alert('บันทึกการตั้งค่าเรียบร้อย\nโปรดรีเฟรชหน้าเพื่อดูการเปลี่ยนแปลง');
    onClose();
  };

  const handleReset = async () => {
    if (confirm('คุณต้องการรีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นหรือไม่?')) {
      resetAdminSettings();
      await loadSettings();
      alert('รีเซ็ตการตั้งค่าเรียบร้อย\nโปรดรีเฟรชหน้าเพื่อดูการเปลี่ยนแปลง');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>การตั้งค่าผู้ดูแลระบบ</CardTitle>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-muted-foreground">กำลังโหลดหมวดหมู่...</div>
            </div>
          ) : (
          <div className="space-y-8">
            {/* Income Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">รายรับ</h3>
              <div className="space-y-3">
                {settings.incomeRows.map(row => (
                  <div key={row.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={row.visible}
                      onChange={() => handleVisibilityToggle('incomeRows', row.id)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1">{row.name}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">รวมเข้ากับ:</label>
                      <input
                        type="text"
                        value={row.aggregateInto || ''}
                        onChange={(e) => handleAggregationChange('incomeRows', row.id, e.target.value)}
                        placeholder="ไม่รวม"
                        className="px-2 py-1 border rounded text-sm w-48"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">รายจ่าย</h3>
              <div className="space-y-3">
                {settings.expenseRows.map(row => (
                  <div key={row.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={row.visible}
                      onChange={() => handleVisibilityToggle('expenseRows', row.id)}
                      className="w-4 h-4"
                    />
                    <span className="flex-1">{row.name}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">รวมเข้ากับ:</label>
                      <input
                        type="text"
                        value={row.aggregateInto || ''}
                        onChange={(e) => handleAggregationChange('expenseRows', row.id, e.target.value)}
                        placeholder="ไม่รวม"
                        className="px-2 py-1 border rounded text-sm w-48"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </CardContent>
        <div className="border-t p-4 flex-shrink-0 flex justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            รีเซ็ต
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              บันทึก
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
