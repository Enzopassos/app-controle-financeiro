export type TipoTransacao = 'income' | 'expense' | 'saving' | 'withdraw';
export type TipoRecorrencia = 'single' | 'fixed' | 'installment';
export type CategoriaTransacao = 'Mercado' | 'Eletrônicos' | 'Lazer' | 'Salário' | 'Outros' | string;

export interface Transacao {
  id: string;                      // UUID único da transação
  nome: string;                    // Descrição/Nome da transação (ex: "Energético Monster", "Salário")
  valor: number;                   // Valor da transação em Reais
  tipo: TipoTransacao;             // 'income' (Receita), 'expense' (Despesa), 'saving' (Guardado), 'withdraw' (Resgatado)
  categoria: CategoriaTransacao;   // Categoria do gasto/ganho
  tipoRecorrencia: TipoRecorrencia; // 'single' (Única), 'fixed' (Fixa), 'installment' (Parcelada)
  data: string;                    // Data ISO 'YYYY-MM-DD'
  
  // Campos para parcelamento e anexos:
  quantidadeParcelas?: number;     // Total de parcelas
  numeroParcela?: number;          // Número da parcela
  idGrupo?: string;                // Grupo de parcelamento
  uriAnexo?: string;               // URI da foto ou documento (Base64/DataURL na Web)
}
