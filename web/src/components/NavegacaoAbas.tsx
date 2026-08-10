import React from 'react';
import { ListFilter, TrendingUp } from 'lucide-react';
import './NavegacaoAbas.css';

export type AbaAtiva = 'transacoes' | 'projecao';

interface NavegacaoAbasProps {
  abaAtiva: AbaAtiva;
  aoMudarAba: (aba: AbaAtiva) => void;
}

export const NavegacaoAbas: React.FC<NavegacaoAbasProps> = ({ abaAtiva, aoMudarAba }) => {
  return (
    <nav className="abas-container" aria-label="Navegação Principal">
      <button
        id="aba-transacoes"
        className={`aba-btn ${abaAtiva === 'transacoes' ? 'aba-btn-ativa' : ''}`}
        onClick={() => aoMudarAba('transacoes')}
      >
        <ListFilter size={18} />
        <span>Transações</span>
      </button>

      <button
        id="aba-projecao"
        className={`aba-btn ${abaAtiva === 'projecao' ? 'aba-btn-ativa' : ''}`}
        onClick={() => aoMudarAba('projecao')}
      >
        <TrendingUp size={18} />
        <span>Projeção Financeira</span>
      </button>
    </nav>
  );
};
