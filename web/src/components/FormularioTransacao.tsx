import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Paperclip, Trash2, ArrowDownCircle, ArrowUpCircle, PiggyBank, Scale } from 'lucide-react';
import type { Transacao, TipoTransacao, TipoRecorrencia, CategoriaTransacao } from '../types/transacao';
import './FormularioTransacao.css';

interface FormularioTransacaoProps {
  aoSalvar: (dados: {
    nome: string;
    valor: number;
    tipo: TipoTransacao;
    categoria: CategoriaTransacao;
    tipoRecorrencia: TipoRecorrencia;
    quantidadeParcelas?: number;
    id?: string;
    data?: string;
    uriAnexo?: string;
  }) => void;
  aoCancelar: () => void;
  dadosIniciais?: Transacao | null;
}

const CATEGORIAS: CategoriaTransacao[] = ['Mercado', 'Eletrônicos', 'Lazer', 'Salário', 'Outros'];

export const FormularioTransacao: React.FC<FormularioTransacaoProps> = ({
  aoSalvar,
  aoCancelar,
  dadosIniciais,
}) => {
  const [nome, setNome] = useState(dadosIniciais ? dadosIniciais.nome : '');
  const [valor, setValor] = useState(dadosIniciais ? dadosIniciais.valor.toString() : '');
  const [tipo, setTipo] = useState<TipoTransacao>(dadosIniciais ? dadosIniciais.tipo : 'expense');
  const [categoria, setCategoria] = useState<CategoriaTransacao>(dadosIniciais ? dadosIniciais.categoria : 'Outros');
  const [tipoRecorrencia, setTipoRecorrencia] = useState<TipoRecorrencia>(
    dadosIniciais ? dadosIniciais.tipoRecorrencia : 'single'
  );
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(
    dadosIniciais?.quantidadeParcelas ? dadosIniciais.quantidadeParcelas.toString() : '2'
  );
  const [opcaoMesInicio, setOpcaoMesInicio] = useState<'current' | 'next'>('current');
  const [uriAnexo, setUriAnexo] = useState<string | undefined>(dadosIniciais?.uriAnexo);

  const [erros, setErros] = useState<{ nome?: string; valor?: string; quantidadeParcelas?: string }>({});

  useEffect(() => {
    if (dadosIniciais) {
      setNome(dadosIniciais.nome);
      setValor(dadosIniciais.valor.toString());
      setTipo(dadosIniciais.tipo);
      setCategoria(dadosIniciais.categoria);
      setTipoRecorrencia(dadosIniciais.tipoRecorrencia);
      setQuantidadeParcelas(dadosIniciais.quantidadeParcelas ? dadosIniciais.quantidadeParcelas.toString() : '2');
      setUriAnexo(dadosIniciais.uriAnexo);
    }
  }, [dadosIniciais]);

  const tratarUploadArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const reader = new FileReader();
    reader.onload = (eventoLeitura) => {
      const resultadoBase64 = eventoLeitura.target?.result as string;
      setUriAnexo(resultadoBase64);
    };
    reader.readAsDataURL(arquivo);
  };

  const removerAnexo = () => {
    setUriAnexo(undefined);
  };

  const validarFormulario = () => {
    const novosErros: typeof erros = {};

    if (!nome.trim()) {
      novosErros.nome = 'O nome da transação é obrigatório.';
    }

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    if (!valor || isNaN(valorNumerico) || valorNumerico <= 0) {
      novosErros.valor = 'Insira um valor válido maior que zero.';
    }

    if (tipoRecorrencia === 'installment') {
      const parcelasNumericas = parseInt(quantidadeParcelas, 10);
      if (!quantidadeParcelas || isNaN(parcelasNumericas) || parcelasNumericas < 2) {
        novosErros.quantidadeParcelas = 'Mínimo de 2 parcelas.';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const tratarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const valorNumerico = parseFloat(valor.replace(',', '.'));
    
    let dataFinal = dadosIniciais?.data;
    if (!dataFinal) {
      const dataBase = new Date();
      if (tipoRecorrencia === 'installment' && opcaoMesInicio === 'next') {
        dataBase.setMonth(dataBase.getMonth() + 1);
      }
      dataFinal = dataBase.toISOString().split('T')[0];
    }

    aoSalvar({
      nome: nome.trim(),
      valor: valorNumerico,
      tipo,
      categoria,
      tipoRecorrencia,
      quantidadeParcelas: tipoRecorrencia === 'installment' ? parseInt(quantidadeParcelas, 10) : undefined,
      id: dadosIniciais?.id,
      data: dataFinal,
      uriAnexo,
    });
  };

  const ehImagemAnexo = uriAnexo ? uriAnexo.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(uriAnexo) : false;

  return createPortal(
    <div className="modal-overlay" onClick={aoCancelar}>
      <div className="modal-conteudo modal-formulario" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2 className="form-titulo">
            {dadosIniciais ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button className="btn-fechar-modal" onClick={aoCancelar}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={tratarEnvio} className="form-body">
          {/* Nome da Transação */}
          <div className="grupo-input">
            <label className="label-input">Descrição</label>
            <input
              type="text"
              className={`input-texto ${erros.nome ? 'input-com-erro' : ''}`}
              placeholder="Ex: Energético Monster, Notebook, Salário"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (erros.nome) setErros((prev) => ({ ...prev, nome: undefined }));
              }}
            />
            {erros.nome && <span className="mensagem-erro">{erros.nome}</span>}
          </div>

          {/* Valor (R$) */}
          <div className="grupo-input">
            <label className="label-input">Valor (R$)</label>
            <div className="input-moeda-wrapper">
              <span className="prefixo-moeda">R$</span>
              <input
                type="text"
                className={`input-texto input-moeda ${erros.valor ? 'input-com-erro' : ''}`}
                placeholder="0,00"
                value={valor}
                onChange={(e) => {
                  setValor(e.target.value);
                  if (erros.valor) setErros((prev) => ({ ...prev, valor: undefined }));
                }}
              />
            </div>
            {erros.valor && <span className="mensagem-erro">{erros.valor}</span>}
          </div>

          {/* Tipo de Transação */}
          <div className="grupo-input">
            <label className="label-input">Tipo de Transação</label>
            <div className="grid-tipos-transacao">
              <button
                type="button"
                className={`btn-opcao-tipo ${tipo === 'income' ? 'tipo-income-ativo' : ''}`}
                onClick={() => setTipo('income')}
              >
                <ArrowUpCircle size={18} />
                <span>Receita</span>
              </button>

              <button
                type="button"
                className={`btn-opcao-tipo ${tipo === 'expense' ? 'tipo-expense-ativo' : ''}`}
                onClick={() => setTipo('expense')}
              >
                <ArrowDownCircle size={18} />
                <span>Despesa</span>
              </button>

              <button
                type="button"
                className={`btn-opcao-tipo ${tipo === 'saving' ? 'tipo-saving-ativo' : ''}`}
                onClick={() => setTipo('saving')}
              >
                <PiggyBank size={18} />
                <span>Guardar</span>
              </button>

              <button
                type="button"
                className={`btn-opcao-tipo ${tipo === 'withdraw' ? 'tipo-withdraw-ativo' : ''}`}
                onClick={() => setTipo('withdraw')}
              >
                <Scale size={18} />
                <span>Resgatar</span>
              </button>
            </div>
          </div>

          {/* Categoria */}
          <div className="grupo-input">
            <label className="label-input">Categoria</label>
            <div className="flex-categorias">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`btn-categoria-item ${categoria === cat ? 'btn-categoria-ativo' : ''}`}
                  onClick={() => setCategoria(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Recorrência */}
          <div className="grupo-input">
            <label className="label-input">Recorrência</label>
            <div className="grid-recorrencias">
              <button
                type="button"
                className={`btn-recorrencia ${tipoRecorrencia === 'single' ? 'btn-recorrencia-ativo' : ''}`}
                onClick={() => setTipoRecorrencia('single')}
              >
                Única (Avulsa)
              </button>

              <button
                type="button"
                className={`btn-recorrencia ${tipoRecorrencia === 'fixed' ? 'btn-recorrencia-ativo' : ''}`}
                onClick={() => setTipoRecorrencia('fixed')}
              >
                Fixa (Mensal)
              </button>

              <button
                type="button"
                className={`btn-recorrencia ${tipoRecorrencia === 'installment' ? 'btn-recorrencia-ativo' : ''}`}
                onClick={() => setTipoRecorrencia('installment')}
              >
                Parcelada
              </button>
            </div>
          </div>

          {/* Opções de Parcelamento */}
          {tipoRecorrencia === 'installment' && (
            <div className="caixa-parcelamento animar-fade">
              <div className="grupo-input">
                <label className="label-input">Número de Parcelas</label>
                <input
                  type="number"
                  min="2"
                  max="120"
                  className={`input-texto ${erros.quantidadeParcelas ? 'input-com-erro' : ''}`}
                  value={quantidadeParcelas}
                  onChange={(e) => {
                    setQuantidadeParcelas(e.target.value);
                    if (erros.quantidadeParcelas)
                      setErros((prev) => ({ ...prev, quantidadeParcelas: undefined }));
                  }}
                />
                {erros.quantidadeParcelas && (
                  <span className="mensagem-erro">{erros.quantidadeParcelas}</span>
                )}
              </div>

              {!dadosIniciais && (
                <div className="grupo-input">
                  <label className="label-input">Início da 1ª Parcela</label>
                  <div className="flex-mes-inicio">
                    <button
                      type="button"
                      className={`btn-mes-inicio ${opcaoMesInicio === 'current' ? 'btn-mes-inicio-ativo' : ''}`}
                      onClick={() => setOpcaoMesInicio('current')}
                    >
                      Mês Atual
                    </button>
                    <button
                      type="button"
                      className={`btn-mes-inicio ${opcaoMesInicio === 'next' ? 'btn-mes-inicio-ativo' : ''}`}
                      onClick={() => setOpcaoMesInicio('next')}
                    >
                      Próximo Mês
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Anexo de Nota ou Comprovante */}
          <div className="grupo-input">
            <label className="label-input">Anexo (Nota Fiscal / Foto / PDF)</label>
            {!uriAnexo ? (
              <label className="area-upload-arquivo">
                <Paperclip size={20} />
                <span>Selecionar Foto ou Documento PDF</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={tratarUploadArquivo}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div className="preview-anexo-box">
                {ehImagemAnexo ? (
                  <img src={uriAnexo} alt="Preview do Anexo" className="img-preview" />
                ) : (
                  <div className="pdf-preview-icon">
                    <Paperclip size={24} />
                    <span>Documento Anexado (PDF)</span>
                  </div>
                )}
                <button type="button" className="btn-remover-anexo" onClick={removerAnexo}>
                  <Trash2 size={16} />
                  <span>Remover Anexo</span>
                </button>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="form-acoes">
            <button type="button" className="btn-cancelar-form" onClick={aoCancelar}>
              Cancelar
            </button>
            <button type="submit" className="btn-salvar-form">
              {dadosIniciais ? 'Atualizar Transação' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
