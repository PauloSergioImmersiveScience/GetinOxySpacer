'use strict';
// ATENÇÃO: senha local demonstrativa. Qualquer visitante pode inspecionar o JavaScript
// de uma página pública e descobrir/contornar esta validação. Não é autenticação real.
const DEMO_PASSWORD = '0112358';
const TRACKING_FILE = '.getinoxy_analisados.json';
const COMMENTS_DIR = 'Comentarios';
const $ = id => document.getElementById(id);
const state = {folder:null, videos:[], done:new Set(), current:-1, history:[], objectURL:null};
const sorter = new Intl.Collator('pt-BR', {numeric:true, sensitivity:'base'});

function status(message, kind='') {const el=$('status');el.textContent=message;el.className='status'+(kind?' '+kind:'');}
function clearURL(){if(state.objectURL){URL.revokeObjectURL(state.objectURL);state.objectURL=null;}}
function counters(){ $('datasetName').textContent=state.folder?`Pasta: ${state.folder.name}`:'Nenhuma pasta selecionada';$('counter').textContent=`${state.videos.length} vídeos`;$('completed').textContent=`${state.done.size} analisados`; }
function ensureSupported(){if(!window.showDirectoryPicker){throw new Error('Este navegador não permite selecionar e gravar arquivos em uma pasta. Abra o site no Chrome ou Microsoft Edge atualizado, por HTTPS.');}}
async function readTracking(){try{const file=await (await state.folder.getFileHandle(TRACKING_FILE)).getFile();const data=JSON.parse(await file.text());return Array.isArray(data.analisados)?data.analisados:[];}catch(e){if(e.name==='NotFoundError')return [];throw new Error('Não foi possível ler o registro dos vídeos analisados: '+e.message);}}
async function writeText(handle,content){const writer=await handle.createWritable();try{await writer.write(content);await writer.close();}catch(e){try{await writer.abort();}catch(_e){}throw e;}}
async function writeTracking(){const handle=await state.folder.getFileHandle(TRACKING_FILE,{create:true});await writeText(handle,JSON.stringify({versao:2,atualizadoEm:new Date().toISOString(),analisados:[...state.done].sort(sorter.compare)},null,2)+'\n');}
async function getComment(name){try{const dir=await state.folder.getDirectoryHandle(COMMENTS_DIR);return await (await dir.getFileHandle(name+'.txt')).getFile().then(f=>f.text());}catch(e){if(e.name==='NotFoundError')return '';throw e;}}
async function selectDataset(){try{
 ensureSupported();
 // Solicitação deve acontecer diretamente após o clique (ativação do usuário).
 const folder=await window.showDirectoryPicker({id:'getinoxy-videos',mode:'readwrite'});
 const videos=[];for await(const item of folder.values()){if(item.kind==='file'&&/\.mp4$/i.test(item.name))videos.push(item.name);}
 videos.sort(sorter.compare);
 state.folder=folder;state.videos=videos;state.done=new Set((await readTracking()).filter(x=>videos.includes(x)));state.history=[];state.current=-1;
 counters();if(!videos.length){await showIndex(-1);status('A pasta selecionada não contém vídeos MP4.','bad');return;}
 const first=videos.findIndex(n=>!state.done.has(n));await showIndex(first);
 status(first<0?'Todos os vídeos desta pasta já foram analisados. Você pode selecionar outra pasta ou revisitar arquivos pelo botão Passo Anterior.':`Pasta carregada. ${state.done.size} vídeo(s) já analisado(s).`,'good');
 }catch(e){if(e.name==='AbortError')return;console.error(e);status(e.message||String(e),'bad');}}
function nextPending(from){for(let i=from+1;i<state.videos.length;i++){if(!state.done.has(state.videos[i]))return i;}for(let i=0;i<=from;i++){if(!state.done.has(state.videos[i]))return i;}return -1;}
async function showIndex(index,{remember=false}={}){
 const previous=state.current;if(remember&&previous>=0&&previous!==index)state.history.push(previous);
 $('player').pause();clearURL();state.current=index;
 const available=index>=0&&index<state.videos.length;
 $('previousBtn').disabled=!state.history.length;$('restartBtn').disabled=!available;$('playPauseBtn').disabled=!available;$('nextBtn').disabled=!available;$('saveBtn').disabled=!available;$('comments').disabled=!available;
 $('player').style.display=available?'block':'none';$('playPauseBtn').textContent='▶ Reproduzir';$('videoPlaceholder').classList.toggle('hidden',available);
 if(!available){$('player').removeAttribute('src');$('player').load();$('filename').textContent='Nenhum vídeo pendente';$('position').textContent='—';$('comments').value='';$('savedTag').textContent='—';$('videoPlaceholder').textContent=state.videos.length?'Não há vídeos pendentes.':'Selecione um diretório para visualizar o primeiro vídeo pendente.';return;}
 const name=state.videos[index];$('filename').textContent=name;$('position').textContent=`${index+1} de ${state.videos.length}`;$('savedTag').textContent=state.done.has(name)?'Já analisado':'Não salvo';$('comments').value='Carregando comentário...';
 try{const file=await (await state.folder.getFileHandle(name)).getFile();if(state.current!==index)return;state.objectURL=URL.createObjectURL(file);$('player').src=state.objectURL;$('player').load();const comment=await getComment(name);if(state.current===index)$('comments').value=comment;}
 catch(e){console.error(e);status('Falha ao abrir '+name+': '+e.message,'bad');$('comments').value='';}
}
async function saveComment(){if(state.current<0||!state.folder)return;const index=state.current;const name=state.videos[index];const content=$('comments').value;
 $('saveBtn').disabled=true;try{
 const dir=await state.folder.getDirectoryHandle(COMMENTS_DIR,{create:true});const file=await dir.getFileHandle(name+'.txt',{create:true});await writeText(file,content);
 state.done.add(name);await writeTracking();counters();$('savedTag').textContent='Salvo';status(`Comentário salvo em ${COMMENTS_DIR}/${name}.txt. Você pode editar e salvar novamente, ou seguir para o próximo vídeo.`,'good');
 }catch(e){console.error(e);status('Erro ao salvar comentário ou registro: '+e.message,'bad');}
 finally{if(state.current===index)$('saveBtn').disabled=false;}}
async function goNext(){if(state.current<0)return;const next=nextPending(state.current);if(next<0){await showIndex(-1,{remember:true});status('Todos os vídeos já foram analisados.','good');}else{await showIndex(next,{remember:true});status('Vídeo pendente carregado.');}}
async function goPrevious(){if(!state.history.length)return;const index=state.history.pop();await showIndex(index);status('Retorno ao vídeo anterior.');}
async function reset(){state.history=[];await showIndex(-1);counters();status('Tela inicial restaurada. Clique em Local DataSet para selecionar a pasta e retomar os vídeos pendentes.');}
function logout(){$('appScreen').classList.add('hidden');$('loginScreen').classList.remove('hidden');$('password').value='';$('player').pause();clearURL();window.dispatchEvent(new Event('getinoxy:videochange'));state.folder=null;state.videos=[];state.done=new Set();state.current=-1;state.history=[];$('password').focus();}
$('loginForm').addEventListener('submit',e=>{e.preventDefault();if($('password').value===DEMO_PASSWORD){$('loginError').textContent='';$('loginScreen').classList.add('hidden');$('appScreen').classList.remove('hidden');$('password').value='';}else{$('loginError').textContent='Senha incorreta.';$('password').select();}});
$('datasetBtn').addEventListener('click',selectDataset);
$('previousBtn').addEventListener('click',goPrevious);
$('nextBtn').addEventListener('click',goNext);
$('resetBtn').addEventListener('click',reset);
$('restartBtn').addEventListener('click',()=>{$('player').currentTime=0;$('player').play().catch(()=>{});});
$('playPauseBtn').addEventListener('click',()=>{const video=$('player');if(video.paused){video.play().catch(e=>status('Não foi possível reproduzir: '+e.message,'bad'));}else{video.pause();}});
$('player').addEventListener('play',()=>{$('playPauseBtn').textContent='⏸ Pausar';});
$('player').addEventListener('pause',()=>{$('playPauseBtn').textContent='▶ Reproduzir';});
$('player').addEventListener('ended',()=>{$('playPauseBtn').textContent='▶ Reproduzir';});
$('saveBtn').addEventListener('click',saveComment);
$('logoutBtn').addEventListener('click',logout);
window.addEventListener('beforeunload',clearURL);
