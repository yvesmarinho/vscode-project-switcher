# Use imagem oficial Node.js LTS
FROM node:18-bookworm-slim

# Evita perguntas interativas
ENV DEBIAN_FRONTEND=noninteractive

# Instala dependências básicas (útil para ferramentas nativas)
RUN apt-get update && \
    apt-get install -y git python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

# Define diretório de trabalho
WORKDIR /workspace

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências do projeto
RUN npm install --save-dev @types/better-sqlite3

# Copia o restante do código (ajuste o .dockerignore)
COPY . .

# Compila o projeto TypeScript
RUN npm run compile

# Comando padrão do container (pode ser alterado para bash ou npm run watch)
CMD ["/bin/bash"]