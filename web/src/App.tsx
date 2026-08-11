import { useState, useEffect } from 'react';
import type { Transacao } from './types/transacao';
import { LocalStorageRepositorioTransacoes } from './database/repositorioTransacoes';
import { SupabaseRepositorioTransacoes } from './database/SupabaseRepositorioTransacoes';
import { supabase } from './database/clienteSupabase';
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
import { ModalAutenticacao } from './components/ModalAutenticacao';
import { Rodape } from './components/Rodape';

const repositorioLocal = new LocalStorageRepositorioTransacoes();
const repositorioSupabase = new SupabaseRepositorioTransacoes();

export default function App() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('transacoes');
  
  const [modalFormularioAberto, setModalFormularioAberto] = useState(false);
  const [modalAuthAberto, setModalAuthAberto] = useState(false);
  const [transacaoEmEdicao, setTransacaoEmEdicao] = useState<Transacao | null>(null);
  const [uriAnexoEmVisualizacao, setUriAnexoEmVisualizacao] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<any | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(true);

  const obterRepositorioAtivo = () => {
    return usuario ? repositorioSupabase : repositorioLocal;
  };

  const carregarDados = async () => {
    try {
      const repo = obterRepositorioAtivo();
      const todas = await repo.obterTodas();
      const ordenadas = [...todas].sort((a, b) => b.data.localeCompare(a.data));
      setTransacoes(ordenadas);
    } catch (erro) {
      console.error('Erro ao carregar dados:', erro);
    }
  };

  useEffect(() => {
    // Verificar sessão inicial do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      setCarregandoSessao(false);
    });

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null);
      setCarregandoSessao(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [usuario]);

  const tratarSalvarTransacao = async (dados: any) => {
    try {
      const repo = obterRepositorioAtivo();
      await repo.salvar(dados);
      await carregarDados();
      setModalFormularioAberto(false);
      setTransacaoEmEdicao(null);
    } catch (erro: any) {
      alert(erro?.message || 'Não foi possível salvar a transação.');
    }
  };

  const tratarExcluirTransacao = async (id: string) => {
    try {
      const repo = obterRepositorioAtivo();
      await repo.excluir(id);
      await carregarDados();
    } catch (erro: any) {
      alert(erro?.message || 'Não foi possível excluir a transação.');
    }
  };

  const tratarSair = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
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

  // 1. Enquanto carrega a sessão do Supabase
  if (carregandoSessao) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--texto-secundario)' }}>
          <p style={{ fontWeight: 600 }}>Carregando sistema...</p>
        </div>
      </div>
    );
  }

  // 2. Se não houver usuário autenticado, exibe a tela de login/cadastro obrigatória
  if (!usuario) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ModalAutenticacao
          obrigatorio={true}
          aoFechar={() => {}}
          aoAutenticarSucesso={() => {
            carregarDados();
          }}
        />
        <Rodape />
      </div>
    );
  }

  // 3. Usuário autenticado -> Redirecionado para a Home / Dashboard
  return (
    <div className="app-container">
      {/* Cartão de Conteúdo Principal */}
      <div className="cartao-conteudo-principal">
        {/* Cabeçalho Principal */}
        <Cabecalho 
          aoClicarNovaTransacao={() => {
            setTransacaoEmEdicao(null);
            setModalFormularioAberto(true);
          }}
          usuarioEmail={usuario?.email}
          aoClicarEntrar={() => setModalAuthAberto(true)}
          aoClicarSair={tratarSair}
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
      </div>

      {/* Rodapé Isolado */}
      <Rodape />

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

      {/* Modal de Autenticação Opcional (quando já logado e clica para gerenciar) */}
      {modalAuthAberto && (
        <ModalAutenticacao
          aoFechar={() => setModalAuthAberto(false)}
          aoAutenticarSucesso={() => {
            carregarDados();
          }}
        />
      )}
    </div>
  );
}
