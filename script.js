import {
  PoseLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const resultats = document.getElementById("resultats");
const exercici = document.getElementById("exercici");

let poseLandmarker;

// ===============================
// RESUMEN FINAL PRO – VARIABLES
// ===============================
let historialErrores = [];
let historialAciertos = 0;
let historialFrames = 0;

// -----------------------------
// 1. Inicialitzar MediaPipe Tasks Vision
// -----------------------------
async function initPose() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });

  console.log("PoseLandmarker carregat");
}

initPose();

// -----------------------------
// 2. Carregar vídeo
// -----------------------------
videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;

  // Reiniciar estadístiques PRO
  historialErrores = [];
  historialAciertos = 0;
  historialFrames = 0;

  video.src = URL.createObjectURL(file);
  video.onloadedmetadata = () => {
    video.play();
    analyzeVideo();
  };

  // Quan el vídeo acabi → RESUM FINAL PRO
  video.onended = () => {
    generarResumenFinal();
  };
});

// -----------------------------
// 3. Analitzar vídeo frame a frame
// -----------------------------
function analyzeVideo() {
  const loop = () => {
    if (video.paused || video.ended || !poseLandmarker) {
      requestAnimationFrame(loop);
      return;
    }

    const results = poseLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const lm = results.landmarks[0];

      const angles = {
        colze: calculateAngle(lm[12], lm[14], lm[16]),
        espatlla: calculateAngle(lm[24], lm[12], lm[14]),
        esquena: calculateAngle(lm[12], lm[24], lm[26]),
        maluc: calculateAngle(lm[24], lm[26], lm[28]),
        genoll: calculateAngle(lm[12], lm[24], lm[26])
      };

      const resultat = corregir(angles);
      mostrarFeedback(resultat);

      // ===============================
      // REGISTRE PRO PER FRAME
      // ===============================
      historialFrames++;
      if (resultat.errors.length > 0 && !resultat.errors[0].includes("Execució correcta")) {
        historialErrores.push(...resultat.errors);
      } else {
        historialAciertos++;
      }

    } else {
      resultats.innerHTML = "<p>No s'ha detectat cap persona.</p>";
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

// -----------------------------
// 5. Motor universal de correcció
// -----------------------------
function corregir(angles) {
  switch (exercici.value) {
    case "jalon":
      return corregirJalon(angles);
    case "sentadilla":
      return corregirSentadilla(angles);
    case "remo":
      return corregirRemo(angles);
    case "press":
      return corregirPress(angles);
    case "pesoMuerto":
      return corregirPesoMuerto(angles);
    default:
      return { errors: ["Exercici no reconegut."], score: 0 };
  }
}

// -----------------------------
// 6. Regles per a cada exercici
// -----------------------------
function corregirJalon(a) {
  const errors = [];
  let score = 100;

  if (a.colze < 70) { errors.push("Colze massa tancat."); score -= 20; }
  if (a.espatlla > 40) { errors.push("Espatlla pujada."); score -= 20; }
  if (a.esquena < 160) { errors.push("Esquena arquejada."); score -= 20; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del jalón.");

  return { errors, score };
}

function corregirSentadilla(a) {
  const errors = [];
  let score = 100;

  if (a.maluc > 120) { errors.push("Baixes poc."); score -= 25; }
  if (a.genoll < 150) { errors.push("Genoll massa endavant."); score -= 25; }
  if (a.esquena < 160) { errors.push("Esquena corbada."); score -= 25; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta de la sentadilla.");

  return { errors, score };
}

function corregirRemo(a) {
  const errors = [];
  let score = 100;

  if (a.esquena < 165) { errors.push("Esquena corbada."); score -= 30; }
  if (a.colze < 70) { errors.push("Recorregut curt de colze."); score -= 30; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del remo.");

  return { errors, score };
}

function corregirPress(a) {
  const errors = [];
  let score = 100;

  if (a.colze > 140) { errors.push("Colzes massa oberts."); score -= 30; }
  if (a.esquena < 160) { errors.push("Arqueig excessiu."); score -= 30; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del press banca.");

  return { errors, score };
}

function corregirPesoMuerto(a) {
  const errors = [];
  let score = 100;

  if (a.esquena < 170) { errors.push("Esquena corbada."); score -= 30; }
  if (a.maluc < 150) { errors.push("Maluc massa baix."); score -= 30; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del peso muerto.");

  return { errors, score };
}

// -----------------------------
// 7. Mostrar feedback instantani
// -----------------------------
function mostrarFeedback(resultat) {
  resultats.innerHTML = `
    <p><strong>Puntuació:</strong> ${resultat.score}/100</p>
    ${resultat.errors.map(e => `<p>${e}</p>`).join("")}
  `;
}

// -----------------------------
// 8. Funció per calcular angles
// -----------------------------
function calculateAngle(a, b, c) {
  const AB = { x: a.x - b.x, y: a.y - b.y };
  const CB = { x: c.x - b.x, y: c.y - b.y };

  const dot = AB.x * CB.x + AB.y * CB.y;
  const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
  const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);

  const cos = dot / (magAB * magCB);
  const clamped = Math.min(Math.max(cos, -1), 1);

  return Math.acos(clamped) * (180 / Math.PI);
}

// ===============================
// 9. RESUM FINAL PRO
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
    .map(([error, veces]) => `• ${error} (${veces} vegades)`);

  const resumen = `
    <h3>Resum final del exercici</h3>
    <p><strong>Puntuació global:</strong> ${porcentajeAcierto}/100</p>
    <p><strong>Frames analitzats:</strong> ${totalFrames}</p>
    <p><strong>Errors totals:</strong> ${totalErrores}</p>

    <h4>Errors més freqüents:</h4>
    ${erroresOrdenados.length > 0 ? erroresOrdenados.join("<br>") : "Cap error detectat"}

    <h4>Punts forts:</h4>
    <p>${generarPuntsForts(porcentajeAcierto)}</p>

    <h4>Recomanació final:</h4>
    <p>${generarRecomendacion(porcentajeAcierto)}</p>
  `;

  resultats.innerHTML = resumen;
}

function generarPuntsForts(score) {
  if (score > 85) return "Execució molt sòlida i estable.";
  if (score > 70) return "Bona base tècnica amb petits detalls a millorar.";
  if (score > 50) return "Tècnica acceptable però amb errors repetits.";
  return "Cal reforçar la tècnica bàsica abans d’augmentar càrrega.";
}

function generarRecomendacion(score) {
  if (score > 85) return "Mantén la tècnica i augmenta la càrrega de forma progressiva.";
  if (score > 70) return "Ajusta petits detalls per millorar l’eficiència del moviment.";
  if (score > 50) return "Controla la postura i el rang de moviment.";
  return "Redueix la càrrega i centra’t en la tècnica fonamental.";
}
