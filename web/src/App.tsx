import { useState, useEffect } from 'react';
import type { Transacao } from './types/transacao';
import { LocalStorageRepositorioTransacoes } from './database/repositorioTransacoes';
import { obterResumoMesSelecionado, calcularEconomiasAcumuladas } from './services/servicoProjecao';
import { Cabecalho } from './components/Cabecalho';
import { SeletorMes } from './components/SeletorMes';
import { CardResumo } from './components/CardResumo';
import { NavegacaoAbas } from './components/NavegacaoAbas';
import type { AbaAtiva } from './components/NavegacaoAbas';
import { ListaTransacoes } from './components/ListaTransacoes';
import { ProjecaoAnual } from './components/ProjecaoAnual';
import { FormularioTransacao } from './components/FormularioTransacao';
import { ModalVisualizadorAnexo } from './components/ModalVisualizadorAnexo';

const repositorio = new LocalStorageRepositorioTransacoes();

export default function App() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('transacoes');
  
  const [modalFormularioAberto, setModalFormularioAberto] = useState(false);
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transacao | null>(null);
  const [uriAnexoEmVisualizacao, setUriAnexoEmVisualizacao] = useState<string | null>(null);

  const carregarDados = async () => {
    try {
      const todas = await repositorio.obterTodas();
      const ordenadas = [...todas].sort((a, b) => b.data.localeCompare(a.data));
      setTransacoes(ordenadas);
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const tratarSalvarTransacao = async (dados: any) => {
    try {
      await repositorio.salvar(dados);
      await carregarDados();
      setModalFormularioAberto(false);
      setTransacaoEmEdicao(null);
    } catch (erro) {
      alert('Não foi possível salvar a transação.');
    }
  };

  const tratarExcluirTransacao = async (id: string) => {
    try {
      await repositorio.excluir(id);
      await carregarDados();
    } catch (erro) {
      alert('Não foi possível excluir a transação.');
    }
  };

  const tratarAbrirEdicao = (tx: Transacao) => {
    setTransacaoEmEdicao(tx);
    setModalFormularioAberto(true);
  };

  const tratarFecharFormulario = () => {
    setModalFormularioAberto(false);
    setTransacaoEmEdicao(null);
  };

  // Filtrar transações vigentes para o mês selecionado
  const obterTransacoesFiltradas = () => {
    const anoAlvo = dataSelecionada.getFullYear();
    const mesAlvo = dataSelecionada.getMonth();
    const offsetAlvo = anoAlvo * 12 + mesAlvo;

    return transacoes.filter((tx) => {
      const partes = tx.data.split('-');
      if (partes.length < 2) return false;
      const anoTx = parseInt(partes[0], 10);
      const mesTx = parseInt(partes[1], 10) - 1;
      const offsetTx = anoTx * 12 + mesTx;

      if (tx.tipoRecorrencia === 'single') {
        return offsetTx === offsetAlvo;
      } else if (tx.tipoRecorrencia === 'fixed') {
        return offsetAlvo >= offsetTx;
      } else if (tx.tipoRecorrencia === 'installment') {
        const quantidade = tx.quantidadeParcelas || 1;
        return offsetAlvo >= offsetTx && offsetAlvo < offsetTx + quantidade;
      }
      return false;
    });
  };

  const transacoesFiltradas = obterTransacoesFiltradas();
  const resumoMes = obterResumoMesSelecionado(transacoes, dataSelecionada);
  const economiasAcumuladas = calcularEconomiasAcumuladas(transacoes, dataSelecionada);

  return (
    <div className="app-container">
      {/* Cabeçalho Principal */}
      <Cabecalho 
        aoClicarNovaTransacao={() => {
          setTransacaoEmEdicao(null);
          setModalFormularioAberto(true);
        }} 
      />

      {/* Navegação entre Abas */}
      <NavegacaoAbas 
        abaAtiva={abaAtiva} 
        aoMudarAba={(aba) => setAbaAtiva(aba)} 
      />

      {/* Conteúdo da Aba Transações */}
      {abaAtiva === 'transacoes' && (
        <main className="animar-fade">
          <div className="conteudo-dashboard-grid">
            <aside className="coluna-painel-lateral">
              <SeletorMes 
                dataSelecionada={dataSelecionada} 
                aoMudarData={(novaData) => setDataSelecionada(novaData)} 
              />

              <CardResumo 
                dataSelecionada={dataSelecionada}
                receitas={resumoMes.receitas + resumoMes.resgatesMensais}
                despesas={resumoMes.despesas + resumoMes.economiasMensais}
                saldo={resumoMes.saldo}
                economiasAcumuladas={economiasAcumuladas}
              />
            </aside>

            <section className="coluna-principal-lista">
              <ListaTransacoes 
                transacoes={transacoesFiltradas}
                dataSelecionada={dataSelecionada}
                aoEditarTransacao={tratarAbrirEdicao}
                aoExcluirTransacao={tratarExcluirTransacao}
                aoVisualizarAnexo={(uri) => setUriAnexoEmVisualizacao(uri)}
              />
            </section>
          </div>
        </main>
      )}

      {/* Conteúdo da Aba Projeções */}
      {abaAtiva === 'projecao' && (
        <main className="animar-fade">
          <ProjecaoAnual transacoes={transacoes} />
        </main>
      )}

      {/* Rodapé Semântico */}
      <footer style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--texto-suave)', fontSize: '0.8rem' }}>
        <p>App de Controle Financeiro & Projeção Simplificada • Versão Web 1.0</p>
      </footer>

      {/* Modal Formulário (Novo / Editar) */}
      {modalFormularioAberto && (
        <FormularioTransacao 
          aoSalvar={tratarSalvarTransacao}
          aoCancelar={tratarFecharFormulario}
          dadosIniciais={transacaoEmEdicao}
        />
      )}

      {/* Modal Visualizador de Anexo */}
      {uriAnexoEmVisualizacao && (
        <ModalVisualizadorAnexo 
          uriAnexo={uriAnexoEmVisualizacao}
          aoFechar={() => setUriAnexoEmVisualizacao(null)}
        />
      )}
    </div>
  );
}
