import { Transaction } from '../types/transaction';

export interface MonthlyProjection {
  month: string;             // Format: "YYYY-MM" (e.g., "2026-07")
  monthName: string;         // Month name in Portuguese (e.g., "Julho")
  estimatedIncomes: number;  // Sum of predictable incomes
  estimatedExpenses: number; // Sum of predictable expenses
  monthlyBalance: number;    // estimatedIncomes - estimatedExpenses for this month only
  details: {
    transaction: Transaction;
    currentInstallmentNumber?: number;
  }[];
}

const PORTUGUESE_MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Calculates a month-by-month financial projection from a start date (typically today)
 * to December of the selected target year. It only counts predictable transactions:
 * 1. Fixed (fixed) transactions that started on or before the projected month.
 * 2. Active installments (installment) that fall within the projected month's range.
 * 
 * Single (single) transactions are ignored in the projection as they are not predictable.
 *
 * @param transactions List of all transactions from database
 * @param referenceDate The date to start projection from (usually current date)
 * @param targetYear The year to calculate projections for
 * @returns Array of MonthlyProjection objects for targetYear
 */
export function calculateFinancialProjection(
  transactions: Transaction[],
  referenceDate: Date,
  targetYear: number
): MonthlyProjection[] {
  const currentYear = referenceDate.getFullYear();
  const currentMonthIndex = referenceDate.getMonth(); // 0 = Jan, 11 = Dec
  
  const projections: MonthlyProjection[] = [];

  // If the targetYear is the current year, start from the current month.
  // Otherwise (future year), project from January (0) to December (11).
  const startMonthIndex = targetYear === currentYear ? currentMonthIndex : 0;

  for (let monthIndex = startMonthIndex; monthIndex <= 11; monthIndex++) {
    const projectedYear = targetYear;
    const projectedMonth = monthIndex;
    
    // Format Month String: "YYYY-MM" (months are 1-indexed in string format)
    const monthString = `${projectedYear}-${String(projectedMonth + 1).padStart(2, '0')}`;
    const monthName = PORTUGUESE_MONTHS[projectedMonth];

    let estimatedIncomes = 0;
    let estimatedExpenses = 0;
    const details: { transaction: Transaction; currentInstallmentNumber?: number }[] = [];

    // Cumulative month index helper for comparing installment dates
    const projectedOffset = projectedYear * 12 + projectedMonth;

    for (const tx of transactions) {
      // Parse transaction date safely without timezone offsets
      const parts = tx.date.split('-');
      if (parts.length < 2) continue; // Invalid date format protection
      
      const txYear = parseInt(parts[0], 10);
      const txMonth = parseInt(parts[1], 10) - 1; // Convert to 0-indexed month
      const txOffset = txYear * 12 + txMonth;

      let isActive = false;
      let currentInstallmentNumber: number | undefined = undefined;

      if (tx.recurrenceType === 'single') {
        // Single transactions appear only in the exact month they were registered
        isActive = projectedOffset === txOffset;
      } else if (tx.recurrenceType === 'fixed') {
        // Fixed transactions are active if they started in or before the projected month
        isActive = projectedOffset >= txOffset;
      } else if (tx.recurrenceType === 'installment') {
        // Installment transactions are active if the projected month is within the range
        // of start month and (start month + count of installments - 1)
        const count = tx.installmentsCount || 1;
        const startOffset = txOffset;
        const endOffset = startOffset + count - 1;

        isActive = projectedOffset >= startOffset && projectedOffset <= endOffset;
        if (isActive) {
          currentInstallmentNumber = (projectedOffset - startOffset) + 1;
        }
      }

      if (isActive) {
        if (tx.type === 'income' || tx.type === 'withdraw') {
          estimatedIncomes += tx.amount;
        } else {
          estimatedExpenses += tx.amount;
        }
        details.push({
          transaction: tx,
          currentInstallmentNumber,
        });
      }
    }

    const monthlyBalance = estimatedIncomes - estimatedExpenses;

    projections.push({
      month: monthString,
      monthName,
      estimatedIncomes,
      estimatedExpenses,
      monthlyBalance,
      details,
    });
  }

  return projections;
}
