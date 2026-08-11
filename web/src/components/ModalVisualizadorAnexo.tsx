import React from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Download, FileText } from 'lucide-react';
import './ModalVisualizadorAnexo.css';

interface ModalVisualizadorAnexoProps {
  uriAnexo: string;
  aoFechar: () => void;
}

export const ModalVisualizadorAnexo: React.FC<ModalVisualizadorAnexoProps> = ({
  uriAnexo,
  aoFechar,
}) => {
  const ehImagem = uriAnexo.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|heic|bmp)(\?.*)?$/i.test(uriAnexo);

  const abrirDocumentoEmNovaAba = () => {
    const novaJanela = window.open();
    if (novaJanela) {
      novaJanela.document.write(
        `<iframe src="${uriAnexo}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={aoFechar}>
      <div className="modal-conteudo modal-anexo-box" onClick={(e) => e.stopPropagation()}>
        <div className="anexo-modal-header">
          <h3 className="anexo-modal-titulo">Visualizador de Anexo</h3>
          <button className="btn-fechar-modal" onClick={aoFechar}>
            <X size={20} />
          </button>
        </div>

        <div className="anexo-body">
          {ehImagem ? (
            <div className="anexo-imagem-container">
              <img src={uriAnexo} alt="Comprovante da Transação" className="anexo-img-full" />
            </div>
          ) : (
            <div className="anexo-documento-card">
              <FileText size={48} className="icone-pdf-doc" />
              <h4 className="doc-titulo">Documento PDF Anexado</h4>
              <p className="doc-subtitulo">Clique abaixo para abrir ou fazer download do arquivo.</p>
              
              <div className="doc-acoes-row">
                <button className="btn-abrir-doc" onClick={abrirDocumentoEmNovaAba}>
                  <ExternalLink size={18} />
                  <span>Abrir Documento</span>
                </button>
                <a href={uriAnexo} download="comprovante.pdf" className="btn-download-doc">
                  <Download size={18} />
                  <span>Baixar</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
