import React, { useState } from 'react';
import { Paperclip, Edit3, Trash2, Inbox } from 'lucide-react';
import type { Transacao } from '../types/transacao';
import { ModalConfirmacaoExclusao } from './ModalConfirmacaoExclusao';
import './ListaTransacoes.css';

interface ListaTransacoesProps {
  transacoes: Transacao[];
  dataSelecionada: Date;
  aoEditarTransacao: (transacao: Transacao) => void;
  aoExcluirTransacao: (id: string) => void;
  aoVisualizarAnexo: (uri: string) => void;
}

export const ListaTransacoes: React.FC<ListaTransacoesProps> = ({
  transacoes,
  dataSelecionada,
  aoEditarTransacao,
  aoExcluirTransacao,
  aoVisualizarAnexo,
}) => {
  const [transacaoParaExcluir, setTransacaoParaExcluir] = useState<Transacao | null>(null);

  const obterTextoParcela = (tx: Transacao) => {
    if (tx.tipoRecorrencia !== 'installment') return '';
    
    const partes = tx.data.split('-');
    if (partes.length < 2) return '';
    const anoTx = parseInt(partes[0], 10);
    const mesTx = parseInt(partes[1], 10) - 1;
    const offsetTx = anoTx * 12 + mesTx;

    const anoAlvo = dataSelecionada.getFullYear();
    const mesAlvo = dataSelecionada.getMonth();
    const offsetAlvo = anoAlvo * 12 + mesAlvo;

    const parcelaAtual = (offsetAlvo - offsetTx) + 1;
    const totalParcelas = tx.quantidadeParcelas || 1;

    return `Parcela ${parcelaAtual}/${totalParcelas}`;
  };

  const tratarConfirmarExclusao = () => {
    if (transacaoParaExcluir) {
      aoExcluirTransacao(transacaoParaExcluir.id);
      setTransacaoParaExcluir(null);
    }
  };

  if (transacoes.length === 0) {
    return (
      <div className="lista-vazia-container">
        <div className="lista-vazia-icone">
          <Inbox size={48} />
        </div>
        <h3 className="lista-vazia-titulo">Nenhuma transação encontrada</h3>
        <p className="lista-vazia-subtitulo">
          Não há lançamentos registrados ou ativos para o mês selecionado.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="lista-transacoes-container" aria-label="Lista de Transações">
        {transacoes.map((tx) => {
          const textoParcela = obterTextoParcela(tx);
          const ehPositivo = tx.tipo === 'income' || tx.tipo === 'withdraw';
          const sinal = ehPositivo ? '+' : '-';

          let classeValor = 'valor-despesa';
          let rotuloTipo = 'Despesa';

          if (tx.tipo === 'income') {
            classeValor = 'valor-receita';
            rotuloTipo = 'Receita';
          } else if (tx.tipo === 'saving') {
            classeValor = 'valor-economias';
            rotuloTipo = 'Guardado';
          } else if (tx.tipo === 'withdraw') {
            classeValor = 'valor-receita';
            rotuloTipo = 'Resgatado';
          }

          const rotuloRecorrencia =
            tx.tipoRecorrencia === 'single'
              ? 'Única'
              : tx.tipoRecorrencia === 'fixed'
              ? 'Fixa'
              : textoParcela;

          return (
            <article key={tx.id} className="card-transacao">
              <div className="transacao-info-principal">
                <div className="transacao-detalhes-top">
                  <h3 className="transacao-nome">{tx.nome}</h3>
                  <span className={`badge-tipo badge-tipo-${tx.tipo}`}>{rotuloTipo}</span>
                </div>

                <div className="transacao-meta">
                  <span>{tx.categoria}</span>
                  <span className="meta-divisor">•</span>
                  <span>{rotuloRecorrencia}</span>
                  <span className="meta-divisor">•</span>
                  <span>Início: {tx.data}</span>
                </div>

                {tx.uriAnexo && (
                  <button
                    className="badge-anexo-item"
                    onClick={() => aoVisualizarAnexo(tx.uriAnexo!)}
                  >
                    <Paperclip size={14} />
                    <span>Ver anexo</span>
                  </button>
                )}
              </div>

              <div className="transacao-acoes-lado">
                <span className={`transacao-valor ${classeValor}`}>
                  {sinal} R$ {tx.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>

                <div className="botoes-acao-row">
                  <button
                    className="btn-acao btn-editar"
                    onClick={() => aoEditarTransacao(tx)}
                    title="Editar Transação"
                  >
                    <Edit3 size={16} />
                    <span>Editar</span>
                  </button>

                  <button
                    className="btn-acao btn-excluir"
                    onClick={() => setTransacaoParaExcluir(tx)}
                    title="Excluir Transação"
                  >
                    <Trash2 size={16} />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {transacaoParaExcluir && (
        <ModalConfirmacaoExclusao
          transacao={transacaoParaExcluir}
          aoConfirmar={tratarConfirmarExclusao}
          aoCancelar={() => setTransacaoParaExcluir(null)}
        />
      )}
    </>
  );
};
