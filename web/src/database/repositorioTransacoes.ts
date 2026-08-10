import type { Transacao } from '../types/transacao';

const CHAVE_ARMAZENAMENTO = '@app_financeiro:transacoes';

export interface IRepositorioTransacoes {
  /**
   * Obtém todas as transações cadastradas.
   */
  obterTodas(): Promise<Transacao[]>;

  /**
   * Salva uma nova transação ou atualiza uma existente.
   * Se a data for omitida, utiliza a data atual local.
   */
  salvar(dadosTransacao: Omit<Transacao, 'id' | 'data'> & { id?: string; data?: string }): Promise<Transacao>;

  /**
   * Exclui uma transação pelo seu ID único.
   */
  excluir(id: string): Promise<void>;

  /**
   * Limpa todo o repositório de dados local.
   */
  limparTudo(): Promise<void>;
}

export class LocalStorageRepositorioTransacoes implements IRepositorioTransacoes {
  
  async obterTodas(): Promise<Transacao[]> {
    try {
      const dados = localStorage.getItem(CHAVE_ARMAZENAMENTO);
      return dados ? JSON.parse(dados) : [];
    } catch (erro) {
      console.error('Erro ao buscar transações do LocalStorage:', erro);
      return [];
    }
  }

  async salvar(dadosTransacao: Omit<Transacao, 'id' | 'data'> & { id?: string; data?: string }): Promise<Transacao> {
    try {
      const transacoes = await this.obterTodas();
      
      const novaTransacao: Transacao = {
        ...dadosTransacao,
        id: dadosTransacao.id || this.gerarUUID(),
        data: dadosTransacao.data || new Date().toISOString().split('T')[0],
      };

      const indiceExistente = transacoes.findIndex(t => t.id === novaTransacao.id);
      
      if (indiceExistente > -1) {
        transacoes[indiceExistente] = novaTransacao;
      } else {
        transacoes.push(novaTransacao);
      }
      
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(transacoes));
      return novaTransacao;
    } catch (erro) {
      console.error('Erro ao salvar transação no LocalStorage:', erro);
      throw erro;
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      const transacoes = await this.obterTodas();
      const listaAtualizada = transacoes.filter(t => t.id !== id);
      localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(listaAtualizada));
    } catch (erro) {
      console.error('Erro ao excluir transação do LocalStorage:', erro);
      throw erro;
    }
  }

  async limparTudo(): Promise<void> {
    try {
      localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    } catch (erro) {
      console.error('Erro ao limpar LocalStorage:', erro);
      throw erro;
    }
  }

  /**
   * Gerador de UUID v4 para ambiente web.
   */
  private gerarUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
