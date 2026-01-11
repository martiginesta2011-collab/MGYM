// MGym'S (español)
// Requiere: tf.min.js y @tensorflow-models/pose-detection (incluir via CDN en index.html)

let video = document.getElementById('video');
let canvas = document.getElementById('overlay');
let ctx = canvas.getContext('2d');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const exerciseSelect = document.getElementById('exercise');

const statusEl = document.getElementById('status');
const anglesEl = document.getElementById('angles');
const repsEl = document.getElementById('reps');
const feedbackEl = document.getElementById('feedback');

let detector = null;
let rafId = null;
let running = false;
let detectionInterval = 100;
let lastDetection = 0;

// Estado sentadillas
let squatState = 'top';
let squatReps = 0;

// Ajustes
const SQUAT = {
  kneeTop: 150,
  kneeBottom: 100
};
const PLANK = {
  torsoMinAngle: 160
};

// Conexiones esqueleto
const connections = [
  [0,1],[0,2],[1,3],[2,4],
  [5,6],[5,7],[7,9],[6,8],[8,10],
  [11,12],[5,11],[6,12],[11,13],[13,15],[12,14],[14,16]
];

// ===============================
// RESUMEN FINAL PRO – VARIABLES
// ===============================
let historialErrores = [];
let historialAciertos = 0;
let historialFrames = 0;

// ===============================
// CÁMARA
// ===============================
async function setupCamera(){
  const stream = await navigator.mediaDevices.getUserMedia({
    audio:false,
    video:{facingMode:'user'}
  });
  video.srcObject = stream;
  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  video.width = video.videoWidth;
  video.height = video.videoHeight;
}

// ===============================
// MODELO MOVENET
// ===============================
async function createDetector(){
  statusEl.textContent = 'Cargando modelo...';
  const model = poseDetection.SupportedModels.MoveNet;
  const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING};
  detector = await poseDetection.createDetector(model, detectorConfig);
  statusEl.textContent = 'Modelo cargado';
}

// ===============================
// ÁNGULO ENTRE 3 PUNTOS
// ===============================
function angleBetween(A,B,C){
  const BAx = A.x - B.x, BAy = A.y - B.y;
  const BCx = C.x - B.x, BCy = C.y - B.y;
  const dot = BAx*BCx + BAy*BCy;
  const magBA = Math.hypot(BAx, BAy);
  const magBC = Math.hypot(BCx, BCy);
  if(magBA === 0 || magBC === 0) return null;
  const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.acos(cos) * (180/Math.PI);
}

// ===============================
// DIBUJAR POSE
// ===============================
function drawPose(keypoints){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00C853';

  for(const [i,j] of connections){
    const a = keypoints[i], b = keypoints[j];
    if(a && b && a.score > 0.25 && b.score > 0.25){
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  for(const p of keypoints){
    if(p && p.score > 0.25){
      ctx.beginPath();
      ctx.fillStyle = '#00C853';
      ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

function kpByName(keypoints, name){
  return keypoints.find(k=>k.name===name) || null;
}

// ===============================
// PROCESAR POSE
// ===============================
function processPose(pose){
  if(!pose || !pose.keypoints) return;

  const k = pose.keypoints;

  const leftShoulder = kpByName(k,'left_shoulder');
  const rightShoulder = kpByName(k,'right_shoulder');
  const leftHip = kpByName(k,'left_hip');
  const rightHip = kpByName(k,'right_hip');
  const leftKnee = kpByName(k,'left_knee');
  const rightKnee = kpByName(k,'right_knee');
  const leftAnkle = kpByName(k,'left_ankle');
  const rightAnkle = kpByName(k,'right_ankle');

  const leftKneeAngle = (leftHip && leftKnee && leftAnkle) ? angleBetween(leftHip,leftKnee,leftAnkle) : null;
  const rightKneeAngle = (rightHip && rightKnee && rightAnkle) ? angleBetween(rightHip,rightKnee,rightAnkle) : null;

  const leftHipAngle = (leftShoulder && leftHip && leftKnee) ? angleBetween(leftShoulder,leftHip,leftKnee) : null;
  const rightHipAngle = (rightShoulder && rightHip && rightKnee) ? angleBetween(rightShoulder,rightHip,rightKnee) : null;

  let torsoAngle = null;
  if(leftShoulder && leftHip && leftAnkle){
    torsoAngle = angleBetween(leftShoulder,leftHip,leftAnkle);
  } else if(rightShoulder && rightHip && rightAnkle){
    torsoAngle = angleBetween(rightShoulder,rightHip,rightAnkle);
  }

  anglesEl.children[0].textContent = `Rodilla izq: ${leftKneeAngle ? leftKneeAngle.toFixed(0)+'°' : '—'}`;
  anglesEl.children[1].textContent = `Rodilla der: ${rightKneeAngle ? rightKneeAngle.toFixed(0)+'°' : '—'}`;
  anglesEl.children[2].textContent = `Cadera izq: ${leftHipAngle ? leftHipAngle.toFixed(0)+'°' : '—'}`;
  anglesEl.children[3].textContent = `Cadera der: ${rightHipAngle ? rightHipAngle.toFixed(0)+'°' : '—'}`;
  anglesEl.children[4].textContent = `Torso (plank): ${torsoAngle ? torsoAngle.toFixed(0)+'°' : '—'}`;

  const exercise = exerciseSelect.value;
  let fb = [];

  if(exercise === 'squat'){
    const kneeAvg = (leftKneeAngle && rightKneeAngle)
      ? (leftKneeAngle + rightKneeAngle)/2
      : (leftKneeAngle || rightKneeAngle || null);

    if(kneeAvg){
      if(squatState === 'top' && kneeAvg <= SQUAT.kneeBottom){
        squatState = 'bottom';
        statusEl.textContent = 'Abajo';
      } else if(squatState === 'bottom' && kneeAvg >= SQUAT.kneeTop){
        squatState = 'top';
        squatReps++;
        repsEl.textContent = squatReps;
        statusEl.textContent = 'Arriba';
      }
    }

    if(kneeAvg){
      if(kneeAvg > 160) fb.push('Extiende piernas completamente.');
      else if(kneeAvg < 80) fb.push('Profundidad alta — controla la espalda.');
    } else {
      fb.push('Posición no detectada.');
    }

    const hipAvg = (leftHipAngle && rightHipAngle)
      ? (leftHipAngle + rightHipAngle)/2
      : (leftHipAngle || rightHipAngle || null);

    if(hipAvg && hipAvg < 70) fb.push('Flexión de cadera excesiva.');

  } else if(exercise === 'plank'){
    if(torsoAngle){
      if(torsoAngle >= PLANK.torsoMinAngle){
        statusEl.textContent = 'Buena línea';
      } else {
        statusEl.textContent = 'Cadera baja/alta';
        fb.push('Ajusta la cadera.');
      }
    } else {
      fb.push('No se detecta torso.');
    }
  }

  feedbackEl.textContent = fb.join(' ');

  // Registro PRO
  historialFrames++;
  if(fb.length > 0){
    historialErrores.push(...fb);
  } else {
    historialAciertos++;
  }
}

// ===============================
// LOOP PRINCIPAL
// ===============================
async function renderLoop(){
  if(!running) return;
  const now = performance.now();
  if(now - lastDetection >= detectionInterval){
    lastDetection = now;
    try{
      const poses = await detector.estimatePoses(video, {flipHorizontal: true});
      const pose = poses && poses[0] ? poses[0] : null;
      if(pose) drawPose(pose.keypoints);
      processPose(pose);
    }catch(e){
      console.error('Error en estimación', e);
    }
  }
  rafId = requestAnimationFrame(renderLoop);
}

// ===============================
// START / STOP
// ===============================
async function start(){
  startBtn.disabled = true;
  stopBtn.disabled = false;

  historialErrores = [];
  historialAciertos = 0;
  historialFrames = 0;

  try{
    if(!video.srcObject){
      await setupCamera();
    }
    if(!detector){
      await createDetector();
    }
    running = true;
    squatReps = 0;
    repsEl.textContent = '0';
    statusEl.textContent = 'En ejecución';
    lastDetection = 0;
    renderLoop();
  }catch(err){
    console.error('Error al iniciar:', err);
    statusEl.textContent = 'Error al iniciar';
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

function stop(){
  startBtn.disabled = false;
  stopBtn.disabled = true;
  running = false;
  statusEl.textContent = 'Detenido';

  if(rafId) cancelAnimationFrame(rafId);

  if(video.srcObject){
    const tracks = video.srcObject.getTracks();
    tracks.forEach(t=>t.stop());
    video.srcObject = null;
  }

  generarResumenFinal();
}

// ===============================
// EVENTOS
// ===============================
startBtn.addEventListener('click', ()=>{ start().catch(console.error); });
stopBtn.addEventListener('click', stop);

video.addEventListener('loadeddata', ()=>{
  if(video.videoWidth){
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
});

window.addEventListener('resize', ()=>{
  if(video.videoWidth){
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
});

// ===============================
// RESUMEN FINAL PRO
// ===============================
function generarResumenFinal() {
    const totalErrores = historialErrores.length;
    const totalFrames = historialFrames;
    const porcentajeAcierto = totalFrames > 0 
        ? ((historialAciertos / totalFrames) * 100).toFixed(1)
        : 0;

    const contador = {};
    historialErrores.forEach(err => {
        contador[err] = (contador[err] || 0) + 1;
    });

    const erroresOrdenados = Object.entries(contador)
        .sort((a, b) => b[1] - a[1])
        .map(([error, veces]) => `• ${error} (${veces} veces)`);

    const resumen = `
        <h3>Resumen final del ejercicio</h3>
        <p><strong>Puntuación global:</strong> ${porcentajeAcierto}/100</p>
        <p><strong>Frames analizados:</strong> ${totalFrames}</p>
        <p><strong>Errores totales:</strong> ${totalErrores}</p>

        <h4>Errores más frecuentes:</h4>
        ${erroresOrdenados.length > 0 ? erroresOrdenados.join("<br>") : "Ningún error detectado"}

        <h4>Puntos fuertes:</h4>
        <p>${generarPuntosFuertes(porcentajeAcierto)}</p>

        <h4>Recomendación final:</h4>
        <p>${generarRecomendacion(porcentajeAcierto)}</p>
    `;

    feedbackEl.innerHTML = resumen;
}

function generarPuntosFuertes(score) {
    if (score > 85) return "Técnica muy sólida y estable.";
    if (score > 70) return "Buena base técnica con detalles a mejorar.";
    if (score > 50) return "Técnica aceptable pero con errores repetidos.";
    return "Refuerza la técnica básica antes de aumentar carga.";
}

function generarRecomendacion(score) {
    if (score > 85) return "Mantén la técnica y aumenta la carga progresivamente.";
    if (score > 70) return "Ajusta pequeños detalles para mejorar la eficiencia.";
    if (score > 50) return "Controla la postura y el rango de movimiento.";
    return "Reduce la carga y céntrate en la técnica fundamental.";
}
