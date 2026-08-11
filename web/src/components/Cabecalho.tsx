import React from 'react';
import { PlusCircle, Wallet, LogIn, LogOut, User } from 'lucide-react';
import './Cabecalho.css';

interface CabecalhoProps {
  aoClicarNovaTransacao: () => void;
  usuarioEmail?: string | null;
  aoClicarEntrar?: () => void;
  aoClicarSair?: () => void;
}

export const Cabecalho: React.FC<CabecalhoProps> = ({
  aoClicarNovaTransacao,
  usuarioEmail,
  aoClicarEntrar,
  aoClicarSair,
}) => {
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

      <div className="cabecalho-acoes-row">
        {usuarioEmail ? (
          <div className="cabecalho-usuario-box">
            <div className="cabecalho-usuario-info" title={usuarioEmail}>
              <User size={16} />
              <span className="cabecalho-usuario-email">{usuarioEmail}</span>
            </div>
            <button
              className="cabecalho-btn-sair"
              onClick={aoClicarSair}
              title="Sair da Conta"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <button
            className="cabecalho-btn-entrar"
            onClick={aoClicarEntrar}
            title="Entrar ou Cadastrar"
          >
            <LogIn size={16} />
            <span>Entrar / Cadastrar</span>
          </button>
        )}

        <button 
          id="btn-nova-transacao"
          className="cabecalho-btn-adicionar" 
          onClick={aoClicarNovaTransacao}
        >
          <PlusCircle size={20} />
          <span>Nova Transação</span>
        </button>
      </div>
    </header>
  );
};
