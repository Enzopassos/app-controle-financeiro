# App de Controle Financeiro & Projeção 📊

Monorepo contendo a aplicação **Mobile** (React Native / Expo) e a nova versão **Web** (React + Vite + TypeScript) para controle de finanças pessoais e projeção financeira futura.

---

## 📂 Estrutura do Repositório

```text
.
├── app/                        # Aplicativo Mobile (React Native / Expo)
│   ├── App.tsx                 # Entrada e telas do aplicativo mobile
│   ├── assets/                 # Imagens e recursos visuais
│   ├── src/                    # Componentes, repositório e serviços mobile
│   └── package.json            # Dependências da versão Mobile
│
├── web/                        # Aplicação Web (React + Vite + TypeScript)
│   ├── index.html              # HTML5 Semântico com SEO
│   ├── src/
│   │   ├── components/         # Componentes Web (Cabecalho, SeletorMes, CardResumo, etc.)
│   │   ├── database/           # Persistência via LocalStorage (repositorioTransacoes.ts)
│   │   ├── services/           # Regra de negócio e projeção matemática (servicoProjecao.ts)
│   │   ├── types/              # Tipos TypeScript em Português (transacao.ts)
│   │   ├── App.tsx             # Aplicação Web principal
│   │   └── index.css           # Design System Vanilla CSS (Estética premium)
│   └── package.json            # Dependências da versão Web
│
└── README.md                   # Documentação do projeto
```

---

## 🚀 Como Executar

### Pré-requisitos
Certifique-se de ter o **Node.js** (v18+) e o **npm** instalados em sua máquina.

---

### 🌐 1. Executar a Aplicação Web (`web/`)

1. Navegue até a pasta da aplicação Web:
   ```bash
   cd web
   ```

2. Instale as dependências (caso ainda não tenha instalado):
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
   *Acesse a aplicação no navegador em: `http://localhost:5173`*

4. Para gerar o build final de produção da Web:
   ```bash
   npm run build
   ```

---

### ☁️ 3. Deploy no Vercel (`web/`)

O repositório já conta com o arquivo de configuração `vercel.json` na raiz pronto para deploy automático da pasta `web/`:

1. Conecte o repositório GitHub à sua conta do [Vercel](https://vercel.com).
2. O Vercel detectará automaticamente as configurações de build a partir do `vercel.json` (`cd web && npm run build` e pasta de saída `web/dist`).
3. Clique em **Deploy**!


---

### 📱 2. Executar o Aplicativo Mobile (`app/`)

1. Navegue até a pasta do aplicativo Mobile:
   ```bash
   cd app
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o servidor do Expo:
   ```bash
   npx expo start
   ```

4. Para abrir o app:
   * Pressione `a` para abrir no emulador Android.
   * Pressione `i` para abrir no simulador iOS (necessita macOS).
   * Escaneie o código QR com o app **Expo Go** no celular.

---

## 🧪 Verificação de Tipos TypeScript

- **Web**:
  ```bash
  cd web && npx tsc --noEmit
  ```

- **Mobile**:
  ```bash
  cd app && npm run ts:check
  ```
