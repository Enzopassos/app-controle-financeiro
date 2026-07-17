export type TransactionType = 'income' | 'expense'; // Receita ou Despesa

export type RecurrenceType = 'single' | 'fixed' | 'installment';

export type CategoryType = 'Mercado' | 'Eletrônicos' | 'Lazer' | 'Salário' | 'Outros' | string;

export interface Transaction {
  id: string;                  // UUID único (gerado no app)
  name: string;                // Nome da transação (ex: "Energético Monster", "Salário")
  amount: number;              // Valor da transação (valor unitário ou valor de cada parcela)
  type: TransactionType;       // 'income' para Receita ou 'expense' para Despesa
  category: CategoryType;      // Categoria do gasto ou ganho
  recurrenceType: RecurrenceType; // Tipo de recorrência
  date: string;                // Data de registro/início no formato ISO 'YYYY-MM-DD' (ex: '2026-07-16')
  
  // Campos específicos para parcelamento (opcionais):
  installmentsCount?: number;  // Quantidade total de parcelas (ex: 12 se for 12x)
  installmentNumber?: number;  // Qual parcela é esta (ex: 3 se for a 3ª parcela de 12)
  groupId?: string;            // ID que vincula todas as parcelas de um mesmo parcelamento para estornos/edições
  attachmentUri?: string;      // URI da foto anexada (ex: nota fiscal)
}
