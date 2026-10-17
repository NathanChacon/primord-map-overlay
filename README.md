# Primord Map Overlay

Aplicativo de sobreposição do mapa do Primord para The Isle: Evrima.

## Instalação

Baixe `PrimordMapSetup.exe` na página **Releases** do GitHub e execute o instalador. O aplicativo precisa de conexão com a internet para abrir o painel do Primord.

Como o instalador ainda não tem assinatura de código, o Windows pode exibir um aviso de editor desconhecido durante a instalação.

## Atalhos

- **F8**: mostrar ou ocultar o mapa.
- **Ctrl+F8**: alternar a interação com o mapa. A interação começa habilitada quando o aplicativo é aberto.
- **F9**: recarregar o mapa.
- **Ctrl+Shift+F8**: apagar os dados salvos da sessão do Primord.

## Desenvolvimento

Requer Node.js 22.12 ou superior.

```powershell
npm ci
npm start
npm run make
```

O instalador do Windows é gerado em `out/make/squirrel.windows/x64`.

Para publicar uma versão pelo GitHub Actions, atualize a versão em `package.json` e `package-lock.json`, envie as alterações e crie uma tag correspondente (por exemplo, versão `1.0.1` com tag `v1.0.1`). O fluxo gera o instalador do Windows e cria uma Release com os arquivos para download.

<img width="442" height="478" alt="Captura de tela 2026-10-17 000821" src="https://github.com/user-attachments/assets/92eed83e-8b84-45e1-a976-9d89afa5436c" />
