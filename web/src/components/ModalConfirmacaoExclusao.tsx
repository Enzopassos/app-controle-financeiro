import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import type { Transacao } from '../types/transacao';
import './ModalConfirmacaoExclusao.css';

interface ModalConfirmacaoExclusaoProps {
  transacao: Transacao;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

export const ModalConfirmacaoExclusao: React.FC<ModalConfirmacaoExclusaoProps> = ({
  transacao,
  aoConfirmar,
  aoCancelar,
}) => {
  return createPortal(
    <div className="modal-overlay" onClick={aoCancelar}>
      <div className="modal-conteudo modal-confirmacao-box" onClick={(e) => e.stopPropagation()}>
        <button className="btn-fechar-modal-confirmacao" onClick={aoCancelar} title="Fechar">
          <X size={18} />
        </button>

        <div className="confirmacao-header">
          <div className="confirmacao-icone-alerta">
            <AlertTriangle size={32} />
          </div>
          <h3 className="confirmacao-titulo">Excluir Transação?</h3>
        </div>

        <div className="confirmacao-corpo">
          <p className="confirmacao-mensagem">
            Tem certeza que deseja excluir a transação <strong className="destaque-nome-transacao">"{transacao.nome}"</strong>?
          </p>
          <span className="confirmacao-aviso">Esta ação não poderá ser desfeita.</span>
        </div>

        <div className="confirmacao-acoes">
          <button className="btn-cancelar-confirmacao" onClick={aoCancelar}>
            Cancelar
          </button>
          <button className="btn-excluir-confirmacao" onClick={aoConfirmar}>
            Sim, Excluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
