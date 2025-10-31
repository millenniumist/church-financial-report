import { prisma } from './prisma';

export async function getFinancialDataFromDB() {
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
      return {
        income: [],
        expenses: [],
        monthlyData: [],
        year: new Date().getFullYear(),
        totals: {
          income: 0,
          expenses: 0,
          balance: 0
        }
      };
    }

    // Transform monthly data for compatibility with existing UI
    const monthlyData = records.map(record => ({
      month: record.notes || new Date(record.date).toLocaleDateString('th-TH', {
        month: 'short',
        year: 'numeric'
      }),
      income: record.income,
      expense: record.expenses,
      balance: record.balance,
      date: record.date,
      // Add empty category details for now (can be enhanced later)
      incomeDetails: [],
      expenseDetails: []
    }));

    // Calculate totals
    const totalIncome = records.reduce((sum, r) => sum + r.income, 0);
    const totalExpenses = records.reduce((sum, r) => sum + r.expenses, 0);
    const balance = records[records.length - 1]?.balance || (totalIncome - totalExpenses);

    // Get year from most recent record
    const latestRecord = records[records.length - 1];
    const year = latestRecord ? new Date(latestRecord.date).getFullYear() : new Date().getFullYear();

    return {
      income: [], // Category breakdown can be added later
      expenses: [], // Category breakdown can be added later
      monthlyData,
      year,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance
      }
    };

  } catch (error) {
    console.error('Error fetching financial data from database:', error);
    throw new Error(`Failed to fetch financial data: ${error.message}`);
  }
}
