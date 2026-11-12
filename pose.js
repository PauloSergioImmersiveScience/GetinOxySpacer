/** GetinOxySpacer v04 - somente detecção e desenho de pose no navegador. */
const video = document.getElementById('player');
const canvas = document.getElementById('poseCanvas');
const ctx = canvas.getContext('2d');
const placeholder = document.getElementById('posePlaceholder');
const tag = document.getElementById('poseTag');
const info = document.getElementById('poseInfo');

const VERSION = '0.10.22';
const PACKAGE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODULE_URL = `${PACKAGE}/vision_bundle.mjs`; // Entrada ES Module oficial do pacote.
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const MIN_INTERVAL_MS = 65; // Reduz bloqueio da interface em máquinas mais lentas.
const MIN_VISIBILITY = 0.35;

let detector = null;
let detectorPromise = null;
let PoseLandmarkerClass = null;
let active = false;
let rafId = 0;
let frameCallbackId = 0;
let lastDetectionAt = -Infinity;
let lastTime = NaN;
let generation = 0;

function setState(message, label = 'Aguardando') {
  tag.textContent = label;
  info.textContent = message;
}
function clearPose(message = 'Carregue um vídeo para detectar as articulações.') {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.display = 'none';
  placeholder.style.display = 'block';
  placeholder.textContent = message;
}
function sizeCanvas() {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 360;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}
async function loadDetector() {
  if (detector) return detector;
  if (detectorPromise) return detectorPromise;
  setState('Baixando o MediaPipe e o modelo de pose (somente na primeira vez)...', 'Carregando');
  placeholder.textContent = 'Carregando modelo de detecção de pose...';
  detectorPromise = (async () => {
    const { FilesetResolver, PoseLandmarker } = await import(MODULE_URL);
    PoseLandmarkerClass = PoseLandmarker;
    const vision = await FilesetResolver.forVisionTasks(`${PACKAGE}/wasm`);
    const options = delegate => ({
      baseOptions: { modelAssetPath: MODEL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    try {
      return await PoseLandmarker.createFromOptions(vision, options('GPU'));
    } catch (gpuError) {
      console.warn('GPU MediaPipe indisponível; usando CPU.', gpuError);
      return await PoseLandmarker.createFromOptions(vision, options('CPU'));
    }
  })();
  try {
    detector = await detectorPromise;
    return detector;
  } catch (err) {
    detectorPromise = null;
    setState('Falha ao iniciar MediaPipe: ' + (err?.message || String(err)), 'Erro');
    clearPose('Falha ao carregar a detecção de pose.');
    console.error('Erro no MediaPipe:', err);
    throw err;
  }
}
function draw(results) {
  sizeCanvas();
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const poses = results.landmarks || [];
  for (const points of poses) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, w / 320);
    ctx.strokeStyle = '#39dacf';
    for (const link of PoseLandmarkerClass.POSE_CONNECTIONS) {
      const a = points[link.start], b = points[link.end];
      if (!a || !b || (a.visibility ?? 1) < MIN_VISIBILITY || (b.visibility ?? 1) < MIN_VISIBILITY) continue;
      ctx.beginPath();
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffce58';
    for (const p of points) {
      if ((p.visibility ?? 1) < MIN_VISIBILITY) continue;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(2.3, w / 240), 0, 2 * Math.PI);
      ctx.fill();
    }
  }
  canvas.style.display = 'block';
  placeholder.style.display = 'none';
  setState(poses.length ? 'Articulações detectadas em paralelo ao vídeo.' : 'Nenhuma pessoa detectada neste quadro.', poses.length ? 'Detectando' : 'Sem pose');
}
function canProcess() {
  return detector && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 && video.videoHeight > 0 && Boolean(video.currentSrc);
}
function processFrame(force = false) {
  if (!canProcess()) return;
  const now = performance.now();
  if (!force && now - lastDetectionAt < MIN_INTERVAL_MS) return;
  if (!force && video.currentTime === lastTime) return;
  lastDetectionAt = now;
  lastTime = video.currentTime;
  try {
    // O relógio monotônico é exigido no modo VIDEO, inclusive após buscas para trás.
    const result = detector.detectForVideo(video, now);
    draw(result);
  } catch (e) {
    console.error('Erro ao detectar pose:', e);
    setState('Não foi possível analisar este quadro.', 'Erro');
  }
}
function cancelFrame() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  if (frameCallbackId && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(frameCallbackId);
  frameCallbackId = 0;
}
function scheduleFrame() {
  cancelFrame();
  if (!active || video.paused || video.ended) return;
  if ('requestVideoFrameCallback' in video) {
    frameCallbackId = video.requestVideoFrameCallback(() => {
      frameCallbackId = 0;
      processFrame();
      scheduleFrame();
    });
  } else {
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      processFrame();
      scheduleFrame();
    });
  }
}
async function prepareVideo() {
  const id = ++generation;
  cancelFrame();
  active = false;
  lastTime = NaN;
  lastDetectionAt = -Infinity;
  if (!video.currentSrc || !video.videoWidth) return;
  sizeCanvas();
  clearPose('Preparando a detecção de pose...');
  try {
    await loadDetector();
    if (id !== generation || !video.currentSrc) return;
    active = true;
    processFrame(true);
    scheduleFrame();
  } catch (_) { /* O erro já foi mostrado. */ }
}
function resetPose() {
  generation++;
  active = false;
  cancelFrame();
  lastTime = NaN;
  lastDetectionAt = -Infinity;
  setState('Pose corporal — articulações e ligações.', 'Aguardando');
  clearPose();
}
window.addEventListener('getinoxy:videochange', resetPose);
video.addEventListener('loadeddata', prepareVideo);
video.addEventListener('play', () => {
  if (active) { processFrame(true); scheduleFrame(); }
});
video.addEventListener('pause', () => { cancelFrame(); if (active) processFrame(true); });
video.addEventListener('seeked', () => { if (active) { processFrame(true); scheduleFrame(); } });
video.addEventListener('ended', () => { cancelFrame(); if (active) processFrame(true); });
video.addEventListener('emptied', resetPose);
window.addEventListener('pagehide', cancelFrame);
