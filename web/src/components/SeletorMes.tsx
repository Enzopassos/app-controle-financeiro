import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MESES_EM_PORTUGUES } from '../services/servicoProjecao';
import './SeletorMes.css';

interface SeletorMesProps {
  dataSelecionada: Date;
  aoMudarData: (novaData: Date) => void;
}

export const SeletorMes: React.FC<SeletorMesProps> = ({ dataSelecionada, aoMudarData }) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [anoTemporario, setAnoTemporario] = useState(dataSelecionada.getFullYear());

  const tratarMesAnterior = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setMonth(novaData.getMonth() - 1);
    aoMudarData(novaData);
  };

  const tratarProximoMes = () => {
    const novaData = new Date(dataSelecionada);
    novaData.setMonth(novaData.getMonth() + 1);
    aoMudarData(novaData);
  };

  const ehMesAtual = () => {
    const hoje = new Date();
    return (
      dataSelecionada.getFullYear() === hoje.getFullYear() &&
      dataSelecionada.getMonth() === hoje.getMonth()
    );
  };

  const resetarParaMesAtual = () => {
    aoMudarData(new Date());
  };

  const selecionarMesEAno = (indiceMes: number) => {
    const novaData = new Date(anoTemporario, indiceMes, 1);
    aoMudarData(novaData);
    setModalAberto(false);
  };

  const textoMesAno = `${MESES_EM_PORTUGUES[dataSelecionada.getMonth()]} de ${dataSelecionada.getFullYear()}`;

  const anoHoje = new Date().getFullYear();
  const anosDisponiveis = [anoHoje - 1, anoHoje, anoHoje + 1, anoHoje + 2];

  return (
    <div className="seletor-mes-card">
      <button 
        id="btn-mes-anterior"
        className="seletor-btn-navegacao" 
        onClick={tratarMesAnterior}
        title="Mês Anterior"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="seletor-display">
        <button 
          id="btn-abrir-seletor-mes"
          className="seletor-display-btn" 
          onClick={() => {
            setAnoTemporario(dataSelecionada.getFullYear());
            setModalAberto(true);
          }}
        >
          <Calendar size={18} />
          <span>{textoMesAno}</span>
        </button>

        {!ehMesAtual() && (
          <button 
            id="btn-resetar-mes-atual"
            className="seletor-btn-hoje" 
            onClick={resetarParaMesAtual}
          >
            Mês Atual
          </button>
        )}
      </div>

      <button 
        id="btn-proximo-mes"
        className="seletor-btn-navegacao" 
        onClick={tratarProximoMes}
        title="Próximo Mês"
      >
        <ChevronRight size={20} />
      </button>

      {modalAberto &&
        createPortal(
          <div className="modal-overlay" onClick={() => setModalAberto(false)}>
            <div className="modal-conteudo modal-seletor-data" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-seletor-titulo">Escolha o Mês e Ano</h3>

              <div className="seletor-anos-row">
                {anosDisponiveis.map((ano) => (
                  <button
                    key={ano}
                    className={`btn-ano ${anoTemporario === ano ? 'btn-ano-ativo' : ''}`}
                    onClick={() => setAnoTemporario(ano)}
                  >
                    {ano}
                  </button>
                ))}
              </div>

              <div className="grid-meses">
                {MESES_EM_PORTUGUES.map((nomeMes, idx) => {
                  const ehMesSelecionado =
                    dataSelecionada.getFullYear() === anoTemporario &&
                    dataSelecionada.getMonth() === idx;

                  return (
                    <button
                      key={nomeMes}
                      className={`btn-mes-item ${ehMesSelecionado ? 'btn-mes-ativo' : ''}`}
                      onClick={() => selecionarMesEAno(idx)}
                    >
                      {nomeMes.substring(0, 3)}
                    </button>
                  );
                })}
              </div>

              <div className="modal-seletor-acoes">
                <button className="btn-cancelar" onClick={() => setModalAberto(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
