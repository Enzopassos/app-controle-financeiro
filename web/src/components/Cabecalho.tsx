import React from 'react';
import { PlusCircle, Wallet } from 'lucide-react';
import './Cabecalho.css';

interface CabecalhoProps {
  aoClicarNovaTransacao: () => void;
}

export const Cabecalho: React.FC<CabecalhoProps> = ({ aoClicarNovaTransacao }) => {
  return (
    <header className="cabecalho-container">
      <div className="cabecalho-marca">
        <div className="cabecalho-icone">
          <Wallet size={28} />
        </div>
        <div>
          <h1 className="cabecalho-titulo">App Financeiro</h1>
          <p className="cabecalho-subtitulo">Controle & Projeção Simplificada</p>
        </div>
      </div>
      <button 
        id="btn-nova-transacao"
        className="cabecalho-btn-adicionar" 
        onClick={aoClicarNovaTransacao}
      >
        <PlusCircle size={20} />
        <span>Nova Transação</span>
      </button>
    </header>
  );
};
