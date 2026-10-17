# Primord Map Overlay

Aplicativo de sobreposição do mapa do Primord para The Isle: Evrima.

<img width="1919" height="1079" alt="Captura de tela 2026-10-17 014629" src="https://github.com/user-attachments/assets/0a3688d9-2865-4d24-a29d-8cb6cfd63085" />


## Instalação

Baixe `PrimordMapSetup.exe` na página [Releases](https://github.com/NathanChacon/primord-map-overlay/releases) do GitHub e execute o instalador. O aplicativo precisa de conexão com a internet para abrir o painel do Primord.

### Aviso do Microsoft Defender SmartScreen

Este aplicativo ainda não tem assinatura de código. Por isso, o Windows pode exibir a mensagem **“O Windows protegeu o computador”** e indicar **“Fornecedor desconhecido”** ao abrir o instalador. Isso acontece porque o Windows não consegue confirmar a identidade do editor; não significa, por si só, que o arquivo contenha um vírus.

Se você baixou `PrimordMapSetup.exe` diretamente da página oficial de [Releases](https://github.com/NathanChacon/primord-map-overlay/releases) e deseja continuar, na tela do SmartScreen clique em **Mais informações** e depois em **Executar assim mesmo**. Se o arquivo veio de outro lugar, não o execute.

Uma assinatura de código permitiria identificar o editor e ajudaria o Windows a construir reputação para as versões do aplicativo. Mesmo com assinatura, o SmartScreen ainda pode avisar sobre versões novas até que elas ganhem reputação. No momento, o instalador não é assinado.

## Atalhos

- **F8**: mostrar ou ocultar o mapa.
- **Ctrl+F8**: alternar a interação com o mapa. A interação começa habilitada quando o aplicativo é aberto.
- **F9**: recarregar o mapa.
- **Ctrl+Shift+F8**: apagar os dados salvos da sessão do Primord.

## Acompanhar o jogador

Para centralizar o mapa na sua posição atual, clique no botão com o ícone de jogador na barra superior do mapa. O mapa atualiza em tempo real

## Desenvolvimento

Requer Node.js 22.12 ou superior.

```powershell
npm ci
npm start
npm run make
```

O instalador do Windows é gerado em `out/make/squirrel.windows/x64`.

Para publicar uma versão pelo GitHub Actions, atualize a versão em `package.json` e `package-lock.json`, envie as alterações e crie uma tag correspondente (por exemplo, versão `1.0.2` com tag `v1.0.2`). O fluxo gera o instalador do Windows e cria uma Release com os arquivos para download.

<img width="442" height="478" alt="Captura de tela 2026-10-17 000821" src="https://github.com/user-attachments/assets/92eed83e-8b84-45e1-a976-9d89afa5436c" />
