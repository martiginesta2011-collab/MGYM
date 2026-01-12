import {
  PoseLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const resultats = document.getElementById("resultats");
const exercici = document.getElementById("exercici");

let poseLandmarker;

// ======== PRO: Historial ========
let scoreFrames = [];
let errorTagsCount = {};

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

  // Reiniciar PRO
  scoreFrames = [];
  errorTagsCount = {};

  video.src = URL.createObjectURL(file);
  video.muted = true;
  video.playsInline = true;

  video.onloadedmetadata = () => {
    video.play().catch(err => console.error("Error play:", err));

    video.onplay = () => {
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      analyzeVideo();
    };
  };

  video.onended = () => {
    generarResumenFinalPro();
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

      // ======== PRO: Registrar dades ========
      scoreFrames.push(resultat.score);
      const tags = classificarErrors(resultat.errors);
      tags.forEach(tag => {
        errorTagsCount[tag] = (errorTagsCount[tag] || 0) + 1;
      });

    } else {
      resultats.innerHTML = "<p>No s'ha detectat cap persona.</p>";
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}

// -----------------------------
// 4. Motor universal de correcció
// -----------------------------
function corregir(angles) {
  switch (exercici.value) {
    case "jalon": return corregirJalon(angles);
    case "sentadilla": return corregirSentadilla(angles);
    case "remo": return corregirRemo(angles);
    case "press": return corregirPress(angles);
    case "pesoMuerto": return corregirPesoMuerto(angles);
    default: return { errors: ["Exercici no reconegut."], score: 0 };
  }
}

// -----------------------------
// 5. Classificador PRO de patrons biomecànics
// -----------------------------
function classificarErrors(errors) {
  const tags = [];
  errors.forEach(e => {
    const t = e.toLowerCase();

    if (t.includes("esquena") && t.includes("corbada")) tags.push("columna_no_neutra");
    if (t.includes("arqueig")) tags.push("hiperextensio_lumbar");
    if (t.includes("colze") && t.includes("tancat")) tags.push("colze_tancat");
    if (t.includes("colzes massa oberts")) tags.push("colzes_oberts_press");
    if (t.includes("genoll massa endavant")) tags.push("genoll_endavant");
    if (t.includes("baixes poc")) tags.push("poca_profunditat");
    if (t.includes("maluc massa baix")) tags.push("maluc_baix");
  });
  return tags;
}

// -----------------------------
// 6. Regles PRO realistes per exercici
// -----------------------------

// Jalón
function corregirJalon(a) {
  const errors = [];
  let score = 100;

  if (a.colze < 50) { errors.push("Colze massa tancat."); score -= 5; }
  if (a.espatlla > 45) { errors.push("Espatlla pujada."); score -= 10; }
  if (a.esquena < 145) { errors.push("Esquena arquejada."); score -= 15; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del jalón.");
  return { errors, score };
}

// Sentadilla
function corregirSentadilla(a) {
  const errors = [];
  let score = 100;

  if (a.maluc > 130) { errors.push("Baixes poc."); score -= 10; }
  if (a.genoll < 130) { errors.push("Genoll massa endavant."); score -= 5; }
  if (a.esquena < 145) { errors.push("Esquena corbada."); score -= 15; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta de la sentadilla.");
  return { errors, score };
}

// Remo
function corregirRemo(a) {
  const errors = [];
  let score = 100;

  if (a.esquena < 150) { errors.push("Esquena corbada."); score -= 15; }
  if (a.colze < 50) { errors.push("Recorregut curt de colze."); score -= 5; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del remo.");
  return { errors, score };
}

// Press banca
function corregirPress(a) {
  const errors = [];
  let score = 100;

  if (a.colze > 150) { errors.push("Colzes massa oberts."); score -= 10; }
  if (a.esquena < 145) { errors.push("Arqueig excessiu."); score -= 15; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del press banca.");
  return { errors, score };
}

// Peso muerto
function corregirPesoMuerto(a) {
  const errors = [];
  let score = 100;

  if (a.esquena < 150) { errors.push("Esquena corbada."); score -= 15; }
  if (a.maluc < 140) { errors.push("Maluc massa baix."); score -= 10; }

  if (score < 0) score = 0;
  if (errors.length === 0) errors.push("Execució correcta del peso muerto.");
  return { errors, score };
}

// -----------------------------
// 7. Mostrar feedback instantani
// -----------------------------
function mostrarFeedback(resultat) {
  resultats.innerHTML = `
    <p><strong>Puntuació instantània:</strong> ${resultat.score}/100</p>
    ${resultat.errors.map(e => `<p>${e}</p>`).join("")}
  `;
}

// -----------------------------
// 8. Càlcul angles
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

// -----------------------------
// 9. RESUM FINAL PRO (mitjana ponderada)
// -----------------------------
function generarResumenFinalPro() {
  if (scoreFrames.length === 0) {
    resultats.innerHTML += "<p>No hi ha prou dades per generar un resum.</p>";
    return;
  }

  const ordenades = [...scoreFrames].sort((a, b) => a - b);
  const n = ordenades.length;
  const tall = Math.floor(n * 0.05);

  const centrals = ordenades.slice(tall, n - tall);

  const suma = centrals.reduce((acc, s) => acc + s, 0);
  const mitjana = (suma / centrals.length).toFixed(1);

  const patronsOrdenats = Object.entries(errorTagsCount)
    .sort((a, b) => b[1] - a[1]);

  const rectificacio = generarRectificacioPro(patronsOrdenats, mitjana);

  resultats.innerHTML += `
    <hr>
    <h3>Resum PRO de l'exercici</h3>
    <p><strong>Nota global (ponderada):</strong> ${mitjana}/100</p>
    <p><strong>Frames analitzats:</strong> ${scoreFrames.length}</p>
    <h4>Correcció tècnica</h4>
    ${rectificacio}
  `;
}

// -----------------------------
// 10. Text biomecànic PRO
// -----------------------------
function generarRectificacioPro(patronsOrdenats, mitjana) {
  const blocs = [];

  if (mitjana >= 85) blocs.push("<p>Execució eficient i estable. Pots afinar trajectòries i ritme.</p>");
  else if (mitjana >= 70) blocs.push("<p>Bona base tècnica, però hi ha patrons a corregir.</p>");
  else if (mitjana >= 50) blocs.push("<p>Tècnica inconsistent. Cal reforçar punts clau.</p>");
  else blocs.push("<p>Prioritza estabilitat i control abans d'augmentar càrrega.</p>");

  for (const [tag] of patronsOrdenats) {

    if (tag === "columna_no_neutra") blocs.push(`
      <p><strong>Columna no neutra:</strong> Mantén activació abdominal i pensa en créixer en altura.</p>
    `);

    if (tag === "hiperextensio_lumbar") blocs.push(`
      <p><strong>Hiperextensió lumbar:</strong> Evita treure pit exageradament. Costelles sobre pelvis.</p>
    `);

    if (tag === "colze_tancat") blocs.push(`
      <p><strong>Colze massa tancat:</strong> Obre lleugerament el colze per millorar la línia de tracció.</p>
    `);

    if (tag === "colzes_oberts_press") blocs.push(`
      <p><strong>Colzes massa oberts:</strong> Mantén-los a 45–60° per protegir l'espatlla.</p>
    `);

    if (tag === "genoll_endavant") blocs.push(`
      <p><strong>Genoll massa endavant:</strong> Reparteix càrrega entre maluc i genoll.</p>
    `);

    if (tag === "poca_profunditat") blocs.push(`
      <p><strong>Poca profunditat:</strong> Treballa mobilitat de maluc i turmell.</p>
    `);

    if (tag === "maluc_baix") blocs.push(`
      <p><strong>Maluc massa baix:</strong> Eleva lleugerament el maluc i mantén la barra a prop del cos.</p>
    `);
  }

  if (patronsOrdenats.length === 0)
    blocs.push("<p>No s'han detectat errors clars. Bona execució global.</p>");

  return blocs.join("");
}
