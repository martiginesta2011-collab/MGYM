import {
  PoseLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const output = document.getElementById("output");

let poseLandmarker;

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

      const angleColzeDret = calculateAngle(lm[12], lm[14], lm[16]);
      const angleColzeEsq = calculateAngle(lm[11], lm[13], lm[15]);
      const angleGenollDret = calculateAngle(lm[24], lm[26], lm[28]);
      const angleGenollEsq = calculateAngle(lm[23], lm[25], lm[27]);

      output.textContent = `
Angles detectats:

- Colze dret: ${angleColzeDret.toFixed(1)}°
- Colze esquerre: ${angleColzeEsq.toFixed(1)}°
- Genoll dret: ${angleGenollDret.toFixed(1)}°
- Genoll esquerre: ${angleGenollEsq.toFixed(1)}°

Feedback crític:

${angleColzeDret < 90 ? "❌ El colze dret està massa tancat. Perds força i estabilitat." : "✅ Colze dret acceptable."}
${angleColzeEsq < 90 ? "❌ El colze esquerre està massa tancat. Tens asimetria." : "✅ Colze esquerre estable."}
${angleGenollDret > 130 ? "❌ Genoll dret massa estès. El cul tambaleja i el maluc balla." : "✅ Genoll dret controlat."}
${angleGenollEsq > 130 ? "❌ Genoll esquerre massa estès. Falta tensió al core." : "✅ Genoll esquerre estable."}

🍑 Cul i maluc:
${Math.abs(angleGenollDret - angleGenollEsq) > 15
        ? "❌ Tens desequilibri clar. El cul es mou lateralment i perds línia."
        : "✅ Bona simetria. El maluc no balla."}

🧠 Recomanació:
Mantén tensió al core, controla el cul i no deixes que els genolls s’obrin o es tanquen.
`;
    }

    requestAnimationFrame(processFrame);
  };

  requestAnimationFrame(processFrame);
}

function calculateAngle(a, b, c) {
  const AB = { x: a.x - b.x, y: a.y - b.y };
  const CB = { x: c.x - b.x, y: c.y - b.y };

  const dot = AB.x * CB.x + AB.y * CB.y;
  const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
  const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);

  if (magAB === 0 || magCB === 0) return 0;

  return Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
}
