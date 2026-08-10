import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CalendarRange } from 'lucide-react';
import type { Transacao } from '../types/transacao';
import { calcularProjecaoFinanceira } from '../services/servicoProjecao';
import './ProjecaoAnual.css';

interface ProjecaoAnualProps {
  transacoes: Transacao[];
}

export const ProjecaoAnual: React.FC<ProjecaoAnualProps> = ({ transacoes }) => {
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [mesesExpandidos, setMesesExpandidos] = useState<Record<string, boolean>>({});

  const anosDisponiveis = [anoAtual, anoAtual + 1, anoAtual + 2];
  const projecoes = calcularProjecaoFinanceira(transacoes, new Date(), anoSelecionado);

  const alternarExpansaoMes = (mes: string) => {
    setMesesExpandidos((prev) => ({
      ...prev,
      [mes]: !prev[mes],
    }));
  };

  return (
    <section className="projecao-container" aria-label="Projeção Financeira">
      <div className="projecao-header-bar">
        <div className="projecao-titulo-group">
          <CalendarRange size={20} className="projecao-icone-header" />
          <h2 className="projecao-titulo">Projeção de Saldo Futuro</h2>
        </div>

        <div className="seletor-anos-projecao">
          {anosDisponiveis.map((ano) => (
            <button
              key={ano}
              className={`btn-ano-projecao ${anoSelecionado === ano ? 'btn-ano-projecao-ativo' : ''}`}
              onClick={() => setAnoSelecionado(ano)}
            >
              {ano}
            </button>
          ))}
        </div>
      </div>

      <div className="projecao-lista-meses">
        {projecoes.map((item) => {
          const ehExpandido = !!mesesExpandidos[item.mes];
          const ehSaldoPositivo = item.saldoMensal >= 0;

          return (
            <article key={item.mes} className="card-mes-projecao">
              <div 
                className="card-mes-projecao-header" 
                onClick={() => alternarExpansaoMes(item.mes)}
              >
                <div className="mes-projecao-info">
                  <h3 className="mes-projecao-nome">{item.nomeMes}</h3>
                  <span className="mes-projecao-quantidade">
                    {item.detalhes.length} {item.detalhes.length === 1 ? 'transação' : 'transações'}
                  </span>
                </div>

                <div className="mes-projecao-valores">
                  <div className="coluna-valor-estimado">
                    <span className="label-estimado">Receitas</span>
                    <span className="valor-estimado valor-receita">
                      R$ {item.receitasEstimadas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="coluna-valor-estimado">
                    <span className="label-estimado">Despesas</span>
                    <span className="valor-estimado valor-despesa">
                      R$ {item.despesasEstimadas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="coluna-valor-estimado">
                    <span className="label-estimado">Saldo Mês</span>
                    <span className={`valor-estimado ${ehSaldoPositivo ? 'valor-positivo' : 'valor-negativo'}`}>
                      R$ {item.saldoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button className="btn-toggle-detalhes" aria-label="Expandir detalhes">
                    {ehExpandido ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {ehExpandido && (
                <div className="card-mes-projecao-detalhes">
                  <h4 className="detalhes-titulo">Detalhamento dos lançamentos vigentes:</h4>
                  {item.detalhes.length === 0 ? (
                    <p className="detalhes-vazio">Nenhuma transação previsível para este mês.</p>
                  ) : (
                    <ul className="lista-detalhes-itens">
                      {item.detalhes.map((det, idx) => {
                        const tx = det.transacao;
                        const ehPositivo = tx.tipo === 'income' || tx.tipo === 'withdraw';
                        const sinal = ehPositivo ? '+' : '-';

                        let classeValor = 'valor-despesa';
                        if (tx.tipo === 'income' || tx.tipo === 'withdraw') classeValor = 'valor-receita';
                        if (tx.tipo === 'saving') classeValor = 'valor-economias';

                        const textoRecorrencia =
                          tx.tipoRecorrencia === 'single'
                            ? 'Avulsa'
                            : tx.tipoRecorrencia === 'fixed'
                            ? 'Fixa'
                            : `Parcela ${det.numeroParcelaAtual}/${tx.quantidadeParcelas}`;

                        return (
                          <li key={`${tx.id}-${idx}`} className="item-detalhe-projecao">
                            <div className="item-detalhe-info">
                              <span className="item-detalhe-nome">{tx.nome}</span>
                              <span className="item-detalhe-sub">{tx.categoria} • {textoRecorrencia}</span>
                            </div>
                            <span className={`item-detalhe-valor ${classeValor}`}>
                              {sinal} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
