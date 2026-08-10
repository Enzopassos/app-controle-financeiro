import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, PiggyBank, Scale } from 'lucide-react';
import { MESES_EM_PORTUGUES } from '../services/servicoProjecao';
import './CardResumo.css';

interface CardResumoProps {
  dataSelecionada: Date;
  receitas: number;
  despesas: number;
  saldo: number;
  economiasAcumuladas: number;
}

export const CardResumo: React.FC<CardResumoProps> = ({
  dataSelecionada,
  receitas,
  despesas,
  saldo,
  economiasAcumuladas,
}) => {
  const nomeMes = MESES_EM_PORTUGUES[dataSelecionada.getMonth()];
  const ehSaldoPositivo = saldo >= 0;

  return (
    <section className="resumo-container">
      {/* Card Principal de Saldo */}
      <div className={`card-saldo-principal ${ehSaldoPositivo ? 'saldo-positivo-bg' : 'saldo-negativo-bg'}`}>
        <div className="card-saldo-header">
          <div className="card-saldo-info">
            <span className="card-saldo-label">Saldo em {nomeMes}</span>
            <h2 className="card-saldo-valor">
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="card-saldo-icone">
            <Scale size={24} />
          </div>
        </div>
      </div>

      {/* Grid de Métricas Secundárias */}
      <div className="resumo-grid">
        <div className="card-metrica card-receita">
          <div className="card-metrica-icone icone-receita">
            <ArrowUpCircle size={20} />
          </div>
          <div>
            <span className="card-metrica-label">Entradas do Mês</span>
            <p className="card-metrica-valor valor-receita">
              + R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="card-metrica card-despesa">
          <div className="card-metrica-icone icone-despesa">
            <ArrowDownCircle size={20} />
          </div>
          <div>
            <span className="card-metrica-label">Saídas do Mês</span>
            <p className="card-metrica-valor valor-despesa">
              - R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="card-metrica card-economias">
          <div className="card-metrica-icone icone-economias">
            <PiggyBank size={20} />
          </div>
          <div>
            <span className="card-metrica-label">Total Guardado</span>
            <p className="card-metrica-valor valor-economias">
              R$ {economiasAcumuladas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
