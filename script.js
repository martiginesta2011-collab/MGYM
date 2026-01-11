const videoInput = document.getElementById("videoInput");
const video = document.getElementById("video");
const output = document.getElementById("output");

let pose;
let camera;

videoInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    video.src = url;

    // iPad-friendly event
    video.onloadedmetadata = () => {
        video.play();
        startAnalysis();
    };
});

function startAnalysis() {
    if (!pose) {
        pose = new Pose.Pose({
            locateFile: (file) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);
    }

    if (camera) camera.stop();

    camera = new Camera(video, {
        onFrame: async () => {
            await pose.send({ image: video });
        },
        width: 640,
        height: 480
    });

    camera.start();
}

function onResults(results) {
    if (!results.poseLandmarks) {
        output.textContent = "No s'ha detectat cap persona.";
        return;
    }

    const lm = results.poseLandmarks;

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

Copia i enganxa això a Copilot:

"Analitza aquests angles i dona’m correccions de tècnica:
- Colze dret: ${angleColzeDret.toFixed(1)}°
- Colze esquerre: ${angleColzeEsq.toFixed(1)}°
- Genoll dret: ${angleGenollDret.toFixed(1)}°
- Genoll esquerre: ${angleGenollEsq.toFixed(1)}°"
`;
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
