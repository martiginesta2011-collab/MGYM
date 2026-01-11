import {
  PoseLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const resultats = document.getElementById("resultats");

let poseLandmarker;

// -----------------------------
// 1. INICIALITZAR MEDIAPIPE
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
}

initPose();

// -----------------------------
// 2. CARREGAR VÍDEO
// -----------------------------
videoInput.addEventListener("change", () => {
  const file = videoInput.files[0];
  if (!file) return;

  video.src = URL.createObjectURL(file);
  video.onloadedmetadata = () => {
    video.play();
    analyzeVideo();
  };
});

// -----------------------------
// 3. ANALITZAR VÍDEO FRAME A FRAME
// -----------------------------
function analyzeVideo() {
  const loop = () => {
    if (video.paused || video.ended) return;

    const results = poseLandmarker.detectForVideo(video, performance.now());

    if (results.landmarks && results.landmarks.length > 0) {
      const lm = results.landmarks[0];

      // -----------------------------
      // 4. CALCULAR ANGLES PER JALÓN
      // -----------------------------
      const angles = {
        colze: calculateAngle(lm[12], lm[14], lm[16]),      // colze dret
        espatlla: calculateAngle(lm[24], lm[12], lm[14]),  // espatlla dreta
        esquena: calculateAngle(lm[12], lm[24], lm[26]),   // tronc
        maluc: calculateAngle(lm[24], lm[26], lm[28])      // estabilitat
      };

      // -----------------------------
      // 5. CORRECCIÓ + SCORE
      // -----------------------------
      const resultat = corregirJalon(angles);
      mostrarFeedback(resultat);
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

// -----------------------------
// 6. FUNCIÓ DE CORRECCIÓ + SCORE
// -----------------------------
function corregirJalon(a) {
  const errors = [];
  let score = 100;

  if (a.colze < 60) {
    errors.push("Flexió de colze excessiva. Estàs tirant amb bíceps.");
    score -= 15;
  }

  if (a.colze > 140) {
    errors.push("Colzes massa oberts. Mantén-los controlats.");
    score -= 15;
  }

  if (a.espatlla > 40) {
    errors.push("Estàs pujant les espatlles. Depressa-les.");
    score -= 15;
  }

  if (a.esquena < 160) {
    errors.push("Esquena arquejada. Mantén el tronc neutre.");
    score -= 15;
  }

  if (a.maluc < 165) {
    errors.push("Estàs tirant el tronc enrere. Evita l’impuls.");
    score -= 15;
  }

  if (score < 0) score = 0;

  if (errors.length === 0) {
    errors.push("Execució correcta. Bona tècnica.");
  }

  return { errors, score };
}

// -----------------------------
// 7. MOSTRAR FEEDBACK + SCORE
// -----------------------------
function mostrarFeedback(resultat) {
  resultats.innerHTML = "";

  const scoreP = document.createElement("p");
  scoreP.textContent = `Puntuació: ${resultat.score}/100`;
  scoreP.style.fontWeight = "bold";
  scoreP.style.fontSize = "18px";
  resultats.appendChild(scoreP);

  resultat.errors.forEach(t => {
    const p = document.createElement("p");
    p.textContent = t;
    resultats.appendChild(p);
  });
}

// -----------------------------
// 8. FUNCIÓ PER CALCULAR ANGLES
// -----------------------------
function calculateAngle(a, b, c) {
  const AB = { x: a.x - b.x, y: a.y - b.y };
  const CB = { x: c.x - b.x, y: c.y - b.y };

  const dot = AB.x * CB.x + AB.y * CB.y;
  const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
  const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);

  return Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
}
