# Primord Map Overlay

Aplicativo de sobreposição do mapa do Primord para The Isle: Evrima.

<img width="1919" height="1079" alt="Captura de tela 2026-10-17 014629" src="https://github.com/user-attachments/assets/0a3688d9-2865-4d24-a29d-8cb6cfd63085" />


## Instalação

Baixe `PrimordMapSetup.exe` na página [Releases](https://github.com/NathanChacon/primord-map-overlay/releases) do GitHub e execute o instalador. O aplicativo precisa de conexão com a internet para abrir o painel do Primord.

### Primeiro acesso e login

Ao abrir o aplicativo pela primeira vez, faça login na página do Primord que aparece dentro da janela. O app carrega o painel hospedado em `https://painel.primord-oficial.com`; a autenticação da conta é feita pelo próprio site do Primord e, quando necessário, pelo Steam. O Primord Map Overlay não tem um sistema de login próprio nem solicita sua senha separadamente.

O aplicativo funciona como um overlay integrado ao jogo: exibe o mapa do Primord dentro de uma janela circular e adiciona controles como mostrar/ocultar o mapa, interagir com ele e centralizar na posição do jogador.

### Aviso do Microsoft Defender SmartScreen

Este aplicativo ainda não tem assinatura de código. Por isso, o Windows pode exibir a mensagem **“O Windows protegeu o computador”** e indicar **“Fornecedor desconhecido”** ao abrir o instalador. Isso acontece porque o Windows não consegue confirmar a identidade do editor; não significa, por si só, que o arquivo contenha um vírus.

Se você baixou `PrimordMapSetup.exe` diretamente da página oficial de [Releases](https://github.com/NathanChacon/primord-map-overlay/releases) e deseja continuar, na tela do SmartScreen clique em **Mais informações** e depois em **Executar assim mesmo**. Se o arquivo veio de outro lugar, não o execute.

Uma assinatura de código permitiria identificar o editor e ajudaria o Windows a construir reputação para as versões do aplicativo. Mesmo com assinatura, o SmartScreen ainda pode avisar sobre versões novas até que elas ganhem reputação. No momento, o instalador não é assinado.

## Atalhos

- **F8**: minimizar o overlay para a barra de tarefas ou restaurá-lo.
- **Ctrl+F8**: alternar a interação com o mapa. A interação começa habilitada quando o aplicativo é aberto.
- **F9**: recarregar o mapa.
- **Ctrl+Shift+F8**: apagar os dados salvos da sessão do Primord.

## Acompanhar o jogador

Para centralizar o mapa na sua posição atual, clique no botão com o ícone de jogador na barra superior do mapa. O mapa atualiza em tempo real.

## Mostrar ou ocultar a barra

Clique no botão de olho riscado, à direita da barra, para ocultá-la e deixar mais espaço livre sobre o jogo. Para mostrar os controles novamente, clique no botão de olho no canto superior direito, fora do círculo do mapa. O mapa continua visível enquanto a barra está recolhida.

## Estrutura do projeto

- `main.js`: inicialização do Electron, criação da janela e ciclo de vida do aplicativo.
- `preload.js`: ponte segura entre os controles da página e o processo principal do Electron.
- `overlay-page.js`: controles inseridos na página do Primord, detecção do mapa e foco no jogador.
- `overlay-styles.js`: estilos injetados para o mapa, a barra e os controles do overlay.
- `ipc-handlers.js`: listeners IPC e validação de quem pode solicitar ações da janela.
- `navigation-rules.js`: regras de navegação, redirecionamento e login pelo Steam.
- `shortcuts.js`: registro e limpeza dos atalhos globais.

## Desenvolvimento

Requer Node.js 22.12 ou superior.

```powershell
npm ci
npm start
npm run make
```

O instalador do Windows é gerado em `out/make/squirrel.windows/x64`.

Para publicar uma versão pelo GitHub Actions, atualize a versão em `package.json` e `package-lock.json`, atualize `CHANGELOG.md`, envie as alterações e crie uma tag correspondente (por exemplo, versão `1.1.0` com tag `v1.1.0`). O fluxo gera o instalador do Windows e cria uma Release com os arquivos para download. Use as notas de `CHANGELOG.md` como base para a descrição da Release no GitHub.

<img width="442" height="478" alt="Captura de tela 2026-10-17 000821" src="https://github.com/user-attachments/assets/92eed83e-8b84-45e1-a976-9d89afa5436c" />
