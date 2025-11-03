import { getFinancialOverview } from './financial';

export async function getFinancialDataFromDB() {
  try {
    return await getFinancialOverview();
  } catch (error) {
    console.error('Error fetching financial data from database:', error);
    throw new Error(`Failed to fetch financial data: ${error.message}`);
  }
}
