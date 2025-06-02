# VS Code Project Switcher

**Facilite a troca e gestão de projetos no VS Code por categorias.**

Esta extensão permite que você gerencie categorias e projetos, agrupando-os e facilitando a troca rápida entre diferentes projetos sem recorrer ao menu "Open Folder" do VS Code. Os dados são armazenados em um banco SQLite local, permitindo operações CRUD em categorias e projetos.

## Funcionalidades

- **Agrupamento por Categoria**: Organize projetos em categorias customizadas.
- **Menu Rápido**: Selecione e abra projetos diretamente via um menu interativo.
- **Gestão Completa**: Adicione, edite e remova categorias e projetos.
- **Banco de Dados Local**: Armazena informações de maneira eficiente e persistente usando SQLite.

## Comandos Disponíveis

- `Project Switcher: Abrir Menu de Projetos`
- `Project Switcher: Adicionar Categoria`
- `Project Switcher: Adicionar Projeto`
- `Project Switcher: Editar Projeto`
- `Project Switcher: Remover Projeto`
- `Project Switcher: Remover Categoria`

## Estrutura dos Dados

- **Projeto**
  - Nome do projeto
  - Linguagem
  - Caminho (path)
  - Usa virtual env? (bool)
  - Gerenciador do virtual env
  - Categoria

- **Categoria**
  - Nome

## Instalação e Uso

1. Execute `npm install` para instalar as dependências.
2. Compile com `npm run compile`.
3. Pressione F5 para rodar e depurar a extensão.
4. Use `Ctrl+Shift+P` e procure por "Project Switcher" para acessar as funcionalidades.

## Requisitos

- VS Code 1.80+
- Node.js 18+
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) como dependência para manipulação do banco de dados local.

## Detalhes Técnicos Avançados

- Toda manipulação de banco e lógica de menu utiliza tratamento de erros robusto e validação de parâmetros.
- Os métodos e classes são documentados em reStructuredText e incluem exemplos de uso.
- O código está preparado para facilitar extensões futuras, como atalhos e integração com outros sistemas.

---

**Desenvolvido por usuários avançados para usuários avançados.**