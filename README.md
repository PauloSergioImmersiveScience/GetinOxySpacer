# GetinOxySpacer — Web v02

Aplicação estática para GitHub Pages: **não precisa de Python ou servidor próprio**.

## Recursos
- Entrada com a senha demonstrativa solicitada (veja aviso de segurança abaixo).
- `Local DataSet` abre a pasta selecionada pelo usuário, via API File System Access (Chrome/Edge, HTTPS).
- Reprodução de arquivos `.mp4` usando o player HTML5, play/pause/seek e reinício.
- `Enviar Comentário` cria/sobrescreve `Comentarios/<nome-completo-do-video>.txt` na própria pasta selecionada.
- `.getinoxy_analisados.json` registra os arquivos que tiveram comentários salvos. Ao reabrir a pasta, pula os já analisados.
- Botões `Passo Anterior`, `Próximo vídeo`, `Restaurar Início`.
- Lista em ordenação natural: `IAespacO2.mp4` antes de `IAespacO10.mp4`.
- Vídeos e comentários não são enviados ao GitHub: a página acessa arquivos locais só após permissão explícita.

## Uso
1. Abra a URL do GitHub Pages no **Chrome ou Microsoft Edge** atualizado.
2. Digite a senha exibida na especificação do projeto.
3. Clique em `Local DataSet`, selecione a pasta contendo MP4 e **autorize leitura e gravação**.
4. Escreva o comentário e clique em `Enviar Comentário`; use `Próximo vídeo` para avançar.
5. Para substituir um comentário, retorne ao vídeo e salve outra vez.
6. Na próxima sessão selecione novamente a mesma pasta. O estado vem do arquivo `.getinoxy_analisados.json`.

## Publicação no GitHub Pages
1. Envie `index.html`, `styles.css`, `app.js` e `.nojekyll` **na raiz** do repositório.
2. Abra `Settings > Pages`.
3. Escolha `Deploy from a branch`, branch `main`, pasta `/(root)`, depois `Save`.
4. A URL usual de projeto é `https://<usuario>.github.io/<repositorio>/`.

**Repositório privado:** no GitHub Free, o GitHub Pages exige repositório **público**. Para Pages a partir de repositório privado, consulte disponibilidade dos planos GitHub Pro/Team/Enterprise. **Um repositório privado não torna necessariamente o site publicado privado.** Em geral o site Pages continua publicamente acessível. A publicação realmente privada do Pages requer políticas corporativas/Enterprise Cloud adequadas.

## Aviso fundamental de segurança
A senha que está em `app.js` é verificada **somente no navegador**. Ela serve apenas como barreira visual/demonstração: **qualquer visitante que receba o site pode inspecionar o código JavaScript, descobrir a senha e ignorar a tela de login**. Não coloque vídeos, dados pessoais, clínicos ou confidenciais no repositório ou na página. Para autenticação genuína, use um serviço com backend/autorização (por exemplo, autenticação + regras de acesso em um serviço hospedado) ou um ambiente com acesso protegido.

## Limites técnicos
- A File System Access API exige navegador compatível, HTTPS e interação explícita. Firefox e Safari podem não suportar este fluxo de gravação direta.
- O navegador **não pode escolher sozinho** o caminho `C:\Users\...`: o usuário precisa selecionar a pasta via botão.
- Alguns arquivos MP4 podem ter codecs que não são compatíveis com o navegador; use MP4/H.264/AAC para máxima compatibilidade.
- O navegador pode solicitar permissão novamente em sessões futuras.
- O registro de analisados é compartilhado por quem tem acesso **à mesma pasta de arquivos**, não entre computadores distintos via GitHub.
- `Restaurar Início` limpa somente a interface, **não apaga os comentários ou o histórico**.
