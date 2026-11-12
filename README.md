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

## Correção 04.1 (MediaPipe)

O módulo MediaPipe agora é importado explicitamente de `vision_bundle.mjs`, como recomenda a documentação oficial. A interface apresenta o detalhe da falha de inicialização caso o CDN, WASM ou modelo não estejam acessíveis. Dependência de internet na primeira carga.

## Correção v04.2 (carregamento do MediaPipe)

O Console da versão anterior indicou HTTP 404 ao importar `@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs`. A versão 04.2 utiliza `@mediapipe/tasks-vision@0.10.21` pela entrada principal do pacote e carrega `wasm` da mesma versão. Esta correção elimina o caminho que retornou 404, mas o funcionamento deve ser validado no Chrome com seu vídeo.

Após substituir os arquivos, use Ctrl+Shift+R. Em caso de falha, abra F12 > Console e envie a mensagem completa.

## Atualização v04.3 — Primeiro quadro sem Play

Ao selecionar um vídeo MP4, a janela **Articulações** já analisa e exibe o esqueleto sobre o **primeiro quadro parado**, antes de clicar em Reproduzir. A inicialização começa em `loadedmetadata` e espera que o quadro esteja decodificado (`HAVE_CURRENT_DATA`), até 10 segundos. O quadro inicial é detectado mesmo com `video.paused === true`. Permanecem os tratamentos de Play, Pause, busca temporal e troca de vídeo. O parâmetro `?v=043` no script evita reutilizar uma cópia antiga do `pose.js` do cache do navegador.

Se a detecção do primeiro quadro não localizar uma pessoa (por oclusão ou enquadramento), o sistema mostra **Sem pose**. Isso não é necessariamente falha do MediaPipe.
