import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch all financial records, ordered by date
    const records = await prisma.financialRecord.findMany({
      orderBy: {
        date: 'asc'
      },
      cacheStrategy: {
        ttl: 60, // Cache for 60 seconds with Prisma Accelerate
      }
    });

    if (!records || records.length === 0) {
      return NextResponse.json({
        income: [],
        expenses: [],
        monthlyData: [],
        year: new Date().getFullYear(),
        totals: {
          income: 0,
          expenses: 0,
          balance: 0
        }
      });
    }

    // Aggregate data by category (we'll just use simple totals for now)
    // In the future, you can add category tracking to the database
    const monthlyData = records.map(record => ({
      month: record.notes || new Date(record.date).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
      income: record.income,
      expense: record.expenses,
      balance: record.balance,
      date: record.date
    }));

    // Calculate totals
    const totalIncome = records.reduce((sum, r) => sum + r.income, 0);
    const totalExpenses = records.reduce((sum, r) => sum + r.expenses, 0);
    const balance = records[records.length - 1]?.balance || (totalIncome - totalExpenses);

    // Get year from most recent record
    const latestRecord = records[records.length - 1];
    const year = latestRecord ? new Date(latestRecord.date).getFullYear() : new Date().getFullYear();

    return NextResponse.json({
      income: [], // Category breakdown can be added later
      expenses: [], // Category breakdown can be added later
      monthlyData,
      year,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance
      }
    });

  } catch (error) {
    console.error('Error fetching financial data from database:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch financial data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
