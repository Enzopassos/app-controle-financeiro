import type { Transacao } from '../types/transacao';
import type { IRepositorioTransacoes } from './repositorioTransacoes';
import { supabase } from './clienteSupabase';

export class SupabaseRepositorioTransacoes implements IRepositorioTransacoes {

  async obterTodas(): Promise<Transacao[]> {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('data', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transações do Supabase:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        valor: Number(item.valor),
        tipo: item.tipo,
        categoria: item.categoria,
        tipoRecorrencia: item.tipo_recorrencia || item.tipoRecorrencia || 'single',
        quantidadeParcelas: item.quantidade_parcelas || item.quantidadeParcelas,
        data: item.data,
        uriAnexo: item.uri_anexo || item.uriAnexo,
      }));
    } catch (erro) {
      console.error('Exceção ao buscar dados no Supabase:', erro);
      return [];
    }
  }

  async salvar(dadosTransacao: Omit<Transacao, 'id' | 'data'> & { id?: string; data?: string }): Promise<Transacao> {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const usuarioLogado = userResponse?.user;

      if (!usuarioLogado) {
        throw new Error('Usuário não autenticado.');
      }

      const dataFinal = dadosTransacao.data || new Date().toISOString().split('T')[0];

      const payload = {
        usuario_id: usuarioLogado.id,
        nome: dadosTransacao.nome,
        valor: dadosTransacao.valor,
        tipo: dadosTransacao.tipo,
        categoria: dadosTransacao.categoria,
        tipo_recorrencia: dadosTransacao.tipoRecorrencia,
        quantidade_parcelas: dadosTransacao.quantidadeParcelas || null,
        data: dataFinal,
        uri_anexo: dadosTransacao.uriAnexo || null,
      };

      if (dadosTransacao.id) {
        // Atualizar existente
        const { data, error } = await supabase
          .from('transacoes')
          .update(payload)
          .eq('id', dadosTransacao.id)
          .select()
          .single();

        if (error) throw new Error(error.message);

        return {
          id: data.id,
          nome: data.nome,
          valor: Number(data.valor),
          tipo: data.tipo,
          categoria: data.categoria,
          tipoRecorrencia: data.tipo_recorrencia,
          quantidadeParcelas: data.quantidade_parcelas,
          data: data.data,
          uriAnexo: data.uri_anexo,
        };
      } else {
        // Inserir novo
        const { data, error } = await supabase
          .from('transacoes')
          .insert([payload])
          .select()
          .single();

        if (error) throw new Error(error.message);

        return {
          id: data.id,
          nome: data.nome,
          valor: Number(data.valor),
          tipo: data.tipo,
          categoria: data.categoria,
          tipoRecorrencia: data.tipo_recorrencia,
          quantidadeParcelas: data.quantidade_parcelas,
          data: data.data,
          uriAnexo: data.uri_anexo,
        };
      }
    } catch (erro: any) {
      console.error('Erro ao salvar transação no Supabase:', erro);
      throw erro;
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (erro: any) {
      console.error('Erro ao excluir transação no Supabase:', erro);
      throw erro;
    }
  }

  async limparTudo(): Promise<void> {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const usuarioLogado = userResponse?.user;

      if (!usuarioLogado) return;

      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('usuario_id', usuarioLogado.id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (erro: any) {
      console.error('Erro ao limpar transações do usuário no Supabase:', erro);
      throw erro;
    }
  }
}
