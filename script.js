import {
  PoseLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const resultats = document.getElementById("resultats");
const exercici = document.getElementById("exercici");

let poseLandmarker;

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

  video.src = URL.createObjectURL(file);
  video.onloadedmetadata = () => {
    video.play();
    analyzeVideo();
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

      // -----------------------------
      // 4. Calcular angles base
      // (frontal, costat dret)
// -----------------------------
      const angles = {
        // Jalón / Press / Remo
        colze: calculateAngle(lm[12], lm[14], lm[16]),        // espatlla dreta - colze dret - canell dret
        espatlla: calculateAngle(lm[24], lm[12], lm[14]),     // maluc dret - espatlla dreta - colze dret

        // Esquena / tronc (per tots)
        esquena: calculateAngle(lm[12], lm[24], lm[26]),      // espatlla dreta - maluc dret - genoll dret

        // Maluc / genoll (sentadilla, peso muerto)
        maluc: calculateAngle(lm[24], lm[26], lm[28]),        // maluc dret - genoll dret - turmell dret
        genoll: calculateAngle(lm[12], lm[24], lm[26])        // espatlla dreta - maluc dret - genoll dret
      };

      const resultat = corregir(angles);
      mostrarFeedback(resultat);
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
// (versions simples però funcionals)
// -----------------------------
function corregirJalon(a) {
  const errors = [];
  let score = 100;

  // Colze massa tancat (tirar massa de bíceps)
  if (a.colze < 70) {
    errors.push("Colze massa tancat. Estàs tirant massa amb bíceps.");
    score -= 20;
  }

  // Espatlla pujada
  if (a.espatlla > 40) {
    errors.push("Estàs pujant les espatlles. Mantén-les avall.");
    score -= 20;
  }

  // Esquena arquejada
  if (a.esquena < 160) {
    errors.push("Esquena massa arquejada. Mantén el tronc neutre.");
    score -= 20;
  }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del jalón.");

  return { errors, score };
}

function corregirSentadilla(a) {
  const errors = [];
  let score = 100;

  // Profunditat (maluc)
  if (a.maluc > 120) {
    errors.push("Baixes poc a la sentadilla. Intenta arribar més avall.");
    score -= 25;
  }

  // Genoll molt avançat / alineació
  if (a.genoll < 150) {
    errors.push("Controla la posició del genoll. Evita plegar-te massa endavant.");
    score -= 25;
  }

  // Esquena
  if (a.esquena < 160) {
    errors.push("Esquena corbada a la sentadilla. Mantén l'esquena més neutra.");
    score -= 25;
  }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta de la sentadilla.");

  return { errors, score };
}

function corregirRemo(a) {
  const errors = [];
  let score = 100;

  // Esquena
  if (a.esquena < 165) {
    errors.push("Esquena massa corbada al remo. Mantén el tronc ferm.");
    score -= 30;
  }

  // Colze
  if (a.colze < 70) {
    errors.push("Recorregut curt de colze al remo. Estira més enrere.");
    score -= 30;
  }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del remo.");

  return { errors, score };
}

function corregirPress(a) {
  const errors = [];
  let score = 100;

  // Colzes molt oberts
  if (a.colze > 140) {
    errors.push("Colzes massa oberts al press. Tanca una mica per protegir espatlles.");
    score -= 30;
  }

  // Esquena exageradament arquejada
  if (a.esquena < 160) {
    errors.push("Arqueig excessiu de l'esquena al press.");
    score -= 30;
  }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del press banca.");

  return { errors, score };
}

function corregirPesoMuerto(a) {
  const errors = [];
  let score = 100;

  // Esquena
  if (a.esquena < 170) {
    errors.push("Esquena corbada al peso muerto. Mantén la columna més neutra.");
    score -= 30;
  }

  // Maluc (punt de partida massa baix)
  if (a.maluc < 150) {
    errors.push("Estàs baixant massa el maluc al peso muerto. No ho converteixis en sentadilla.");
    score -= 30;
  }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del peso muerto.");

  return { errors, score };
}

// -----------------------------
// 7. Mostrar feedback
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
  const clamped = Math.min(Math.max(cos, -1), 1); // evitar NaN
  return Math.acos(clamped) * (180 / Math.PI);
}
