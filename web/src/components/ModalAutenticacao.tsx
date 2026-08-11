import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, Lock, LogIn, UserPlus, X, Wallet, AlertCircle } from 'lucide-react';
import { supabase } from '../database/clienteSupabase';
import './ModalAutenticacao.css';

interface ModalAutenticacaoProps {
  aoFechar: () => void;
  aoAutenticarSucesso: () => void;
  obrigatorio?: boolean;
}

export const ModalAutenticacao: React.FC<ModalAutenticacaoProps> = ({
  aoFechar,
  aoAutenticarSucesso,
  obrigatorio = false,
}) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  const tratarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!email.trim() || !senha.trim()) {
      setMensagemErro('Preencha o e-mail e a senha.');
      return;
    }

    if (senha.length < 6) {
      setMensagemErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (modo === 'cadastro' && senha !== confirmarSenha) {
      setMensagemErro('As senhas não coincidem. Digite a mesma senha nos dois campos.');
      return;
    }

    setCarregando(true);

    try {
      if (modo === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setMensagemErro('E-mail ou senha incorretos.');
          } else {
            setMensagemErro(error.message);
          }
        } else {
          aoAutenticarSucesso();
          aoFechar();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
        });

        if (error) {
          setMensagemErro(error.message);
        } else if (data.session) {
          setMensagemSucesso('Conta criada e autenticada com sucesso!');
          setTimeout(() => {
            aoAutenticarSucesso();
            aoFechar();
          }, 1200);
        } else {
          setMensagemSucesso('Conta criada com sucesso! Faça login para acessar seu painel.');
          setModo('login');
          setSenha('');
          setConfirmarSenha('');
        }
      }
    } catch (err: any) {
      setMensagemErro(err?.message || 'Ocorreu um erro ao processar a autenticação.');
    } finally {
      setCarregando(false);
    }
  };

  return createPortal(
    <div 
      className="modal-overlay" 
      onClick={() => {
        if (!obrigatorio) aoFechar();
      }}
    >
      <div className="modal-conteudo modal-autenticacao-box" onClick={(e) => e.stopPropagation()}>
        {!obrigatorio && (
          <button className="btn-fechar-modal-auth" onClick={aoFechar} title="Fechar">
            <X size={18} />
          </button>
        )}

        <div className="auth-header">
          <div className="auth-icone-app">
            <Wallet size={30} />
          </div>
          <h2 className="auth-titulo">
            {modo === 'login' ? 'Acessar sua Conta' : 'Criar Nova Conta'}
          </h2>
          <p className="auth-subtitulo">
            {modo === 'login'
              ? 'Entre com suas credenciais para acessar suas finanças'
              : 'Cadastre-se para sincronizar e proteger seus dados na nuvem'}
          </p>
        </div>

        {/* Abas Alternadoras */}
        <div className="auth-abas-row">
          <button
            type="button"
            className={`auth-aba-item ${modo === 'login' ? 'auth-aba-ativa' : ''}`}
            onClick={() => {
              setModo('login');
              setMensagemErro(null);
              setMensagemSucesso(null);
              setSenha('');
              setConfirmarSenha('');
            }}
          >
            <LogIn size={16} />
            <span>Entrar</span>
          </button>

          <button
            type="button"
            className={`auth-aba-item ${modo === 'cadastro' ? 'auth-aba-ativa' : ''}`}
            onClick={() => {
              setModo('cadastro');
              setMensagemErro(null);
              setMensagemSucesso(null);
              setSenha('');
              setConfirmarSenha('');
            }}
          >
            <UserPlus size={16} />
            <span>Cadastrar</span>
          </button>
        </div>

        {/* Mensagens de Alerta */}
        {mensagemErro && (
          <div className="auth-alerta auth-alerta-erro animar-fade">
            <AlertCircle size={18} />
            <span>{mensagemErro}</span>
          </div>
        )}

        {mensagemSucesso && (
          <div className="auth-alerta auth-alerta-sucesso animar-fade">
            <span>{mensagemSucesso}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={tratarEnvio} className="auth-form">
          <div className="grupo-input">
            <label className="label-input">E-mail</label>
            <div className="input-auth-wrapper">
              <Mail size={18} className="icone-input-auth" />
              <input
                type="email"
                className="input-texto input-auth"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grupo-input">
            <label className="label-input">Senha</label>
            <div className="input-auth-wrapper">
              <Lock size={18} className="icone-input-auth" />
              <input
                type="password"
                className="input-texto input-auth"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
          </div>

          {modo === 'cadastro' && (
            <div className="grupo-input animar-fade">
              <label className="label-input">Confirmar Senha</label>
              <div className="input-auth-wrapper">
                <Lock size={18} className="icone-input-auth" />
                <input
                  type="password"
                  className="input-texto input-auth"
                  placeholder="••••••••"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-submit-auth" disabled={carregando}>
            {carregando ? (
              <span>Processando...</span>
            ) : modo === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Entrar no Sistema</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Criar Conta</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};
