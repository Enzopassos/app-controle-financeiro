# App Financeiro 📊

Um aplicativo mobile moderno para controle de finanças pessoais e projeção financeira simplificada, desenvolvido em **React Native** com **Expo** e **TypeScript**.

O foco deste aplicativo é permitir que você gerencie suas receitas e despesas cotidianas, visualizando a evolução do seu saldo atual e projetando sua saúde financeira para até 2 anos à frente com dados previsíveis (gastos fixos e parcelados).

---

## 🚀 Funcionalidades Principais

*   **Controle de Transações**:
    *   Criação de receitas (`income`) e despesas (`expense`) divididas por categorias.
    *   Suporte a recorrências: **Única** (avulsa), **Fixa** (mensal) ou **Parcelada**.
    *   Edição de transações existentes (mantendo o histórico e dados originais) ou exclusão.
*   **Anexos em Transações (Fotos e PDFs) 📎**:
    *   Upload de anexos durante a criação ou edição de transações.
    *   **Bottom Sheet personalizado** para escolha entre selecionar foto da galeria ou documento PDF.
    *   Visualizador nativo de imagem em tela cheia para fotos.
    *   Suporte para **abrir e compartilhar arquivos PDF** diretamente em leitores externos do sistema operacional.
*   **Histórico de Navegação Mensal**:
    *   Navegação intuitiva de meses através de botões rápidos `◀` e `▶`.
    *   **Seletor de Calendário Personalizado**: Escolha direta de qualquer mês/ano com dois cliques.
    *   Botão "Mês Atual" para retornar rapidamente ao período corrente.
*   **Projeção Anual & Multi-Anual**:
    *   Cálculo automático de estimativa de saldo, receitas e despesas mês a mês.
    *   Visualização estendida para o ano corrente, **+1 ano** ou **+2 anos** subsequentes.
    *   **Design Colapsado**: Cards mensais de projeção que podem ser expandidos para listar exatamente quais transações (e parcelas específicas) estão ativas naquele mês.
    *   Cálculo inteligente de parcelas vigentes (ex: exibe `Parcela 2/6` no mês correspondente).

---

## 🛠️ Stack Tecnológica

*   **Core**: React Native (Expo SDK 51)
*   **Linguagem**: TypeScript
*   **Armazenamento**: AsyncStorage (para persistência de dados offline local no dispositivo)
*   **Seletores de Arquivos**: `expo-image-picker` e `expo-document-picker`
*   **Integração com o Sistema**: `expo-sharing` (para visualização externa de documentos)

---

## 📂 Estrutura do Projeto

```text
├── App.tsx                    # Ponto de entrada e gerenciamento de estado principal
├── app.json                   # Configurações do Expo
├── package.json               # Dependências do projeto
├── src
│   ├── components
│   │   └── TransactionForm.tsx # Formulário customizado para criar/editar transações e anexos
│   ├── database
│   │   └── repository.ts       # Repositório de persistência usando AsyncStorage
│   ├── services
│   │   └── projection.ts       # Lógica matemática de projeções e parcelamentos
│   ├── theme
│   │   └── colors.ts           # Paleta de cores, tipografia e estilos globais (Aesthetics)
│   └── types
│       └── transaction.ts      # Interfaces e definições de tipo TypeScript
└── tsconfig.json              # Configurações do compilador TypeScript
```

---

## ⚙️ Instalação e Execução

### Pré-requisitos
Certifique-se de ter o **Node.js** e o gerenciador de pacotes **npm** instalados.

1.  **Instale as dependências do projeto**:
    ```bash
    npm install
    ```

2.  **Execute o servidor de desenvolvimento do Expo**:
    ```bash
    npx expo start
    ```

3.  **Abra o aplicativo**:
    *   Pressione `a` para abrir no emulador Android.
    *   Pressione `i` para abrir no simulador iOS (necessário macOS).
    *   Escaneie o código QR exibido no terminal utilizando o aplicativo **Expo Go** em seu dispositivo móvel (Android ou iOS).

---

## 🧪 Verificação de Tipagem TypeScript

Para rodar a checagem estática de tipos no projeto e garantir integridade de código:
```bash
npx tsc --noEmit
```
