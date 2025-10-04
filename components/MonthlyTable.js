'use client';

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function MonthlyTable({ monthlyData }) {
  const [expandedMonth, setExpandedMonth] = useState(null);

  const toggleMonth = (index) => {
    setExpandedMonth(expandedMonth === index ? null : index);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b">
          <TableHead className="h-14 px-6 text-left font-semibold w-12"></TableHead>
          <TableHead className="h-14 px-6 text-left font-semibold">เดือน</TableHead>
          <TableHead className="h-14 px-6 text-right font-semibold">รายรับ</TableHead>
          <TableHead className="h-14 px-6 text-right font-semibold">รายจ่าย</TableHead>
          <TableHead className="h-14 px-6 text-right font-semibold">คงเหลือ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {monthlyData.filter(m => m.income > 0 || m.expense > 0).map((month, index) => (
          <React.Fragment key={index}>
            <TableRow
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => toggleMonth(index)}
            >
              <TableCell className="h-16 px-6">
                {expandedMonth === index ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell className="h-16 px-6 font-medium">{month.month}</TableCell>
              <TableCell className="h-16 px-6 text-right tabular-nums">
                ฿{month.income.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
              </TableCell>
              <TableCell className="h-16 px-6 text-right tabular-nums">
                ฿{month.expense.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
              </TableCell>
              <TableCell className={`h-16 px-6 text-right font-medium tabular-nums ${month.balance >= 0 ? '' : 'text-destructive'}`}>
                ฿{month.balance.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
              </TableCell>
            </TableRow>
            {expandedMonth === index && (
              <TableRow className="bg-muted/30">
                <TableCell colSpan={5} className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Income Details */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">รายรับ</h4>
                      {month.incomeDetails && month.incomeDetails.length > 0 ? (
                        <div className="space-y-2">
                          {month.incomeDetails.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.category}</span>
                              <span className="font-medium tabular-nums">
                                ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
                      )}
                    </div>

                    {/* Expense Details */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">รายจ่าย</h4>
                      {month.expenseDetails && month.expenseDetails.length > 0 ? (
                        <div className="space-y-2">
                          {month.expenseDetails.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.category}</span>
                              <span className="font-medium tabular-nums">
                                ฿{item.amount.toLocaleString('th-TH', { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  );
}
