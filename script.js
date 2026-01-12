Aquí tens el **fitxer complet ja modificat amb la versió PRO**, llest per substituir l’actual.

```js
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
  video.onloadedmetadata = () => {
    video.play();
    analyzeVideo();
  };

  // Quan acabe el vídeo → resum PRO
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

      // -----------------------------
      // 4. Calcular angles base
      // -----------------------------
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

// ======== PRO: Classificar errors en patrons ========
function classificarErrors(errors) {
  const tags = [];

  errors.forEach(e => {
    const t = e.toLowerCase();

    if (t.includes("esquena") && t.includes("corbada")) {
      tags.push("columna_no_neutra");
    }
    if (t.includes("arquejada")) {
      tags.push("hiperextensio_lumbar");
    }
    if (t.includes("colze") && (t.includes("tancat") || t.includes("curt"))) {
      tags.push("rang_recorregut_limitat");
    }
    if (t.includes("colzes massa oberts")) {
      tags.push("colzes_oberts_press");
    }
    if (t.includes("genoll massa endavant")) {
      tags.push("genoll_endavant_sentadilla");
    }
    if (t.includes("baixes poc")) {
      tags.push("poca_profunditat_sentadilla");
    }
    if (t.includes("maluc massa baix")) {
      tags.push("maluc_baix_peso_muerto");
    }
  });

  return tags;
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
    <p><strong>Puntuació (instantània):</strong> ${resultat.score}/100</p>
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
function generarResumenFinalPro() {
  if (scoreFrames.length === 0) {
    resultats.innerHTML += "<p>No hi ha prou dades per generar un resum.</p>";
    return;
  }

  const suma = scoreFrames.reduce((acc, s) => acc + s, 0);
  const mitjana = (suma / scoreFrames.length).toFixed(1);

  const patronsOrdenats = Object.entries(errorTagsCount)
    .sort((a, b) => b[1] - a[1]);

  const rectificacio = generarRectificacioPro(patronsOrdenats, mitjana);

  const html = `
    <hr>
    <h3>Resum PRO de l'exercici</h3>
    <p><strong>Nota global (mitjana):</strong> ${mitjana}/100</p>
    <p><strong>Frames analitzats:</strong> ${scoreFrames.length}</p>

    <h4>Correcció tècnica</h4>
    ${rectificacio}
  `;

  resultats.innerHTML += html;
}

// ===============================
// 10. Text biomecànic avançat
// ===============================
function generarRectificacioPro(patronsOrdenats, mitjana) {
  const blocs = [];

  // Comentari general segons nota
  if (mitjana >= 85) {
    blocs.push("<p>Execució globalment eficient. Pots afinar trajectòries i control del ritme per maximitzar la transferència.</p>");
  } else if (mitjana >= 70) {
    blocs.push("<p>Bona base tècnica, però hi ha patrons d'error que limiten l'eficiència del moviment.</p>");
  } else if (mitjana >= 50) {
    blocs.push("<p>Tècnica inconsistent. Cal corregir punts clau per millorar seguretat i rendiment.</p>");
  } else {
    blocs.push("<p>La prioritat és establir una tècnica sòlida abans d'augmentar càrrega o intensitat.</p>");
  }

  // Comentaris específics per patrons
  for (const [tag, count] of patronsOrdenats) {

    if (tag === "columna_no_neutra") {
      blocs.push(`
        <p><strong>Columna no neutra:</strong> Mantén una lleugera activació abdominal i pensa en “créixer en altura”. 
        Evita flexions innecessàries que carreguen la zona lumbar.</p>
      `);
    }

    if (tag === "hiperextensio_lumbar") {
      blocs.push(`
        <p><strong>Hiperextensió lumbar:</strong> No exageris el “treure pit”. 
        Mantén costelles apilades sobre la pelvis i activa glutis per estabilitzar.</p>
      `);
    }

    if (tag === "rang_recorregut_limitat") {
      blocs.push(`
        <p><strong>Rang de recorregut curt:</strong> Prioritza un ROM complet i controlat. 
        Redueix pes si cal per garantir un estímul muscular òptim.</p>
      `);
    }

    if (tag === "colzes_oberts_press") {
      blocs.push(`
        <p><strong>Colzes massa oberts al press:</strong> Porta els colzes a 45–60° respecte al tronc. 
        Millora l'alineació d’espatlla i redueix estrès articular.</p>
      `);
    }

    if (tag === "genoll_endavant_sentadilla") {
      blocs.push(`
        <p><strong>Genoll massa endavant:</strong> Reparteix càrrega entre maluc i genoll. 
        Mantén el pes sobre tot el peu i pensa en “asseure't enrere”.</p>
      `);
    }

    if (tag === "poca_profunditat_sentadilla") {
      blocs.push(`
        <p><strong>Poca profunditat:</strong> Treballa mobilitat de maluc i turmell. 
        Utilitza alçadors de taló si cal per aconseguir una profunditat funcional.</p>
      `);
    }

    if (tag === "maluc_baix_peso_muerto") {
      blocs.push(`
        <p><strong>Maluc massa baix al peso muerto:</strong> Eleva lleugerament el maluc i mantén la barra a prop del cos. 
        Activa isquios i glutis per una tracció més eficient.</p>
      `);
    }
  }

  if (patronsOrdenats.length === 0) {
    blocs.push("<p>No s'han detectat errors clars. Pots afinar ritme, respiració i control excèntric.</p>");
  }

  return blocs.join("");
}
```

Si després de substituir tot això veus algun comportament estrany (per exemple, no es mostra el resum al final), digues-m’ho i mirem només la part concreta que falla.
