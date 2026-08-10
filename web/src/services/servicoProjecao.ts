import type { Transacao } from '../types/transacao';

export interface ProjecaoMensal {
  mes: string;                  // Formato: "YYYY-MM" (ex: "2026-07")
  nomeMes: string;              // Nome do mês em Português (ex: "Julho")
  receitasEstimadas: number;   // Soma de receitas previsíveis
  despesasEstimadas: number;   // Soma de despesas previsíveis
  saldoMensal: number;         // receitasEstimadas - despesasEstimadas para o mês
  detalhes: {
    transacao: Transacao;
    numeroParcelaAtual?: number;
  }[];
}

export const MESES_EM_PORTUGUES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Calcula a projeção financeira mês a mês a partir de uma data de referência
 * até dezembro do ano alvo selecionado.
 *
 * @param transacoes Lista de todas as transações cadastradas
 * @param dataReferencia Data base inicial da projeção (geralmente hoje)
 * @param anoAlvo Ano selecionado para a projeção
 * @returns Array de ProjecaoMensal para o ano selecionado
 */
export function calcularProjecaoFinanceira(
  transacoes: Transacao[],
  dataReferencia: Date,
  anoAlvo: number
): ProjecaoMensal[] {
  const anoAtual = dataReferencia.getFullYear();
  const indiceMesAtual = dataReferencia.getMonth(); // 0 = Jan, 11 = Dez
  
  const projecoes: ProjecaoMensal[] = [];
  const indiceMesInicio = anoAlvo === anoAtual ? indiceMesAtual : 0;

  for (let indiceMes = indiceMesInicio; indiceMes <= 11; indiceMes++) {
    const anoProjetado = anoAlvo;
    const mesProjetado = indiceMes;
    
    const mesString = `${anoProjetado}-${String(mesProjetado + 1).padStart(2, '0')}`;
    const nomeMes = MESES_EM_PORTUGUES[mesProjetado];

    let receitasEstimadas = 0;
    let despesasEstimadas = 0;
    const detalhes: { transacao: Transacao; numeroParcelaAtual?: number }[] = [];

    const offsetProjetado = anoProjetado * 12 + mesProjetado;

    for (const tx of transacoes) {
      const partes = tx.data.split('-');
      if (partes.length < 2) continue;
      
      const anoTx = parseInt(partes[0], 10);
      const mesTx = parseInt(partes[1], 10) - 1;
      const offsetTx = anoTx * 12 + mesTx;

      let estaAtiva = false;
      let numeroParcelaAtual: number | undefined = undefined;

      if (tx.tipoRecorrencia === 'single') {
        estaAtiva = offsetProjetado === offsetTx;
      } else if (tx.tipoRecorrencia === 'fixed') {
        estaAtiva = offsetProjetado >= offsetTx;
      } else if (tx.tipoRecorrencia === 'installment') {
        const quantidade = tx.quantidadeParcelas || 1;
        const offsetFim = offsetTx + quantidade - 1;

        estaAtiva = offsetProjetado >= offsetTx && offsetProjetado <= offsetFim;
        if (estaAtiva) {
          numeroParcelaAtual = (offsetProjetado - offsetTx) + 1;
        }
      }

      if (estaAtiva) {
        if (tx.tipo === 'income' || tx.tipo === 'withdraw') {
          receitasEstimadas += tx.valor;
        } else {
          despesasEstimadas += tx.valor;
        }
        detalhes.push({
          transacao: tx,
          numeroParcelaAtual,
        });
      }
    }

    const saldoMensal = receitasEstimadas - despesasEstimadas;

    projecoes.push({
      mes: mesString,
      nomeMes,
      receitasEstimadas,
      despesasEstimadas,
      saldoMensal,
      detalhes,
    });
  }

  return projecoes;
}

/**
 * Calcula o total acumulado de valores guardados em economias até uma data específica.
 */
export function calcularEconomiasAcumuladas(transacoes: Transacao[], ateData: Date): number {
  let totalEconomias = 0;
  const anoLimite = ateData.getFullYear();
  const mesLimite = ateData.getMonth();
  const offsetLimite = anoLimite * 12 + mesLimite;

  transacoes.forEach((tx) => {
    const partes = tx.data.split('-');
    if (partes.length < 2) return;
    const anoTx = parseInt(partes[0], 10);
    const mesTx = parseInt(partes[1], 10) - 1;
    const offsetTx = anoTx * 12 + mesTx;

    if (offsetTx > offsetLimite) return;

    let ocorrencias = 0;
    if (tx.tipoRecorrencia === 'single') {
      ocorrencias = offsetTx <= offsetLimite ? 1 : 0;
    } else if (tx.tipoRecorrencia === 'fixed') {
      ocorrencias = Math.max(0, offsetLimite - offsetTx + 1);
    } else if (tx.tipoRecorrencia === 'installment') {
      const quantidade = tx.quantidadeParcelas || 1;
      const offsetFim = offsetTx + quantidade - 1;
      const fimAtivo = Math.min(offsetLimite, offsetFim);
      ocorrencias = Math.max(0, fimAtivo - offsetTx + 1);
    }

    if (tx.tipo === 'saving') {
      totalEconomias += tx.valor * ocorrencias;
    } else if (tx.tipo === 'withdraw') {
      totalEconomias -= tx.valor * ocorrencias;
    }
  });

  return totalEconomias;
}

/**
 * Retorna o resumo financeiro (Receitas, Despesas e Saldo) para um mês selecionado.
 */
export function obterResumoMesSelecionado(transacoes: Transacao[], dataSelecionada: Date) {
  let receitas = 0;
  let despesas = 0;
  let economiasMensais = 0;
  let resgatesMensais = 0;
  
  const anoAlvo = dataSelecionada.getFullYear();
  const mesAlvo = dataSelecionada.getMonth();
  const offsetAlvo = anoAlvo * 12 + mesAlvo;

  transacoes.forEach((tx) => {
    const partes = tx.data.split('-');
    if (partes.length < 2) return;
    const anoTx = parseInt(partes[0], 10);
    const mesTx = parseInt(partes[1], 10) - 1;
    const offsetTx = anoTx * 12 + mesTx;

    let estaAtiva = false;

    if (tx.tipoRecorrencia === 'single') {
      estaAtiva = offsetTx === offsetAlvo;
    } else if (tx.tipoRecorrencia === 'fixed') {
      estaAtiva = offsetAlvo >= offsetTx;
    } else if (tx.tipoRecorrencia === 'installment') {
      const quantidade = tx.quantidadeParcelas || 1;
      estaAtiva = offsetAlvo >= offsetTx && offsetAlvo < offsetTx + quantidade;
    }

    if (estaAtiva) {
      if (tx.tipo === 'income') {
        receitas += tx.valor;
      } else if (tx.tipo === 'expense') {
        despesas += tx.valor;
      } else if (tx.tipo === 'saving') {
        economiasMensais += tx.valor;
      } else if (tx.tipo === 'withdraw') {
        resgatesMensais += tx.valor;
      }
    }
  });

  return {
    receitas,
    despesas,
    economiasMensais,
    resgatesMensais,
    saldo: receitas + resgatesMensais - despesas - economiasMensais,
  };
}
