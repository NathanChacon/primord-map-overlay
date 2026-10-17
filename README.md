# Primord Map Overlay

Aplicativo de sobreposição do mapa do Primord para The Isle: Evrima.

## Instalação

Baixe `PrimordMapSetup.exe` na página **Releases** do GitHub e execute o instalador. O aplicativo precisa de conexão com a internet para abrir o painel do Primord.

## Atalhos

- **F8**: mostrar ou ocultar o mapa.
- **Ctrl+F8**: ativar ou desativar a interação com o mapa.
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

Para publicar uma versão pelo GitHub Actions, atualize a versão em `package.json`, envie as alterações e crie uma tag correspondente (por exemplo, versão `1.0.0` com tag `v1.0.0`). O fluxo gera o instalador e cria uma Release com os arquivos.
