
import {
  PoseLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const output = document.getElementById("output");

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
videoInput.addEventListener("change", async function () {
  const file = this.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  video.src = url;

  video.onloadedmetadata = () => {
    video.play();
    analyzeVideo();
  };
});

// -----------------------------
// 3. ANALITZAR VÍDEO FRAME A FRAME
// -----------------------------
async function analyzeVideo() {
  if (!poseLandmarker) {
    output.textContent = "Carregant model...";
    return;
  }

  const processFrame = () => {
    if (video.paused || video.ended) return;

    const results = poseLandmarker.detectForVideo(video, performance.now());

    if (!results.landmarks || results.landmarks.length === 0) {
      output.textContent = "No s'ha detectat cap persona.";
    } else {
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
      // 5. CORRECCIÓ AUTOMÀTICA
      // -----------------------------
      const feedback = corregirAnglesJalon(angles);
      mostrarFeedback(feedback);
    }

    requestAnimationFrame(processFrame);
  };

  requestAnimationFrame(processFrame);
}

// -----------------------------
// 6. FUNCIÓ DE CORRECCIÓ JALÓN
// -----------------------------
function corregirAnglesJalon(angles) {
  const errors = [];

  const colze = angles.colze;
  const espatlla = angles.espatlla;
  const esquena = angles.esquena;
  const maluc = angles.maluc;

  if (colze < 60) {
    errors.push("Flexió de colze excessiva. Estàs tirant massa amb bíceps.");
  }

  if (colze > 140) {
    errors.push("Colzes massa oberts. Mantén-los lleugerament flexionats.");
  }

  if (espatlla > 40) {
    errors.push("Estàs pujant les espatlles. Depressa-les i activa dorsals.");
  }

  if (esquena < 160) {
    errors.push("Esquena arquejada. Mantén el tronc neutre i estable.");
  }

  if (maluc < 165) {
    errors.push("Estàs tirant el tronc enrere. Evita l’impuls.");
  }

  if (errors.length === 0) {
    return ["Execució correcta. Bona tècnica en el jalón al pit."];
  }

  return errors;
}

// -----------------------------
// 7. MOSTRAR FEEDBACK A LA WEB
// -----------------------------
function mostrarFeedback(llista) {
  output.innerHTML = "";

  llista.forEach(text => {
    const p = document.createElement("p");
    p.textContent = text;
    output.appendChild(p);
  });
}

// -----------------------------
//
