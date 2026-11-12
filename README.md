# GetinOxySpacer — Web v04 (Articulações)

Esta atualização adiciona uma segunda janela **Articulações**, das mesmas dimensões da janela **Vídeo Analisado**, com a estimativa de até uma pose corporal e desenho das ligações entre articulações sobre fundo escuro. A reprodução permanece controlada pelo vídeo original: play, pause, reiniciar e alteração de tempo também atualizam o esqueleto.

## Instalação no GitHub Pages

Substitua na raiz do repositório os arquivos `index.html`, `styles.css`, `app.js`, `README.md` e **adicione o novo arquivo `pose.js`**. Preserve `.nojekyll`, se existir. Publique pelo processo normal de GitHub Pages e atualize o navegador com `Ctrl+F5`.

## Notas

- O MediaPipe Pose Landmarker (modelo *lite*) é baixado da internet na primeira utilização. A detecção é executada **localmente no navegador**, sem envio de vídeos ao servidor.
- A detecção é feita nos quadros do próprio vídeo com `requestVideoFrameCallback` (ou `requestAnimationFrame` como alternativa), com limite aproximado de 15 análises por segundo para preservar fluidez; isso **não é uma garantia de processamento de todos os frames nem de sincronização temporal perfeita** sob carga elevada.
- O processamento no navegador pode exigir aceleração gráfica; há tentativa automática de usar CPU caso a GPU não esteja disponível.
- Esta etapa detecta corpo e conexões, **não classifica movimentos** nem avalia a técnica de utilização do espaçador.
- A senha no JavaScript continua sendo **somente demonstrativa**; não protege conteúdo privado contra quem inspecione o código publicado.
- Utilizar Chrome ou Edge atualizado em HTTPS para acesso aos vídeos locais via seletor de diretório.
