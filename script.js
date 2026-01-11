output.textContent = `
Angles detectats:

- Colze dret: ${angleColzeDret.toFixed(1)}°
- Colze esquerre: ${angleColzeEsq.toFixed(1)}°
- Genoll dret: ${angleGenollDret.toFixed(1)}°
- Genoll esquerre: ${angleGenollEsq.toFixed(1)}°

🔍 Feedback tècnic (to crític i realista):

${angleColzeDret < 90 
    ? "❌ El colze dret està massa tancat. Estàs perdent recorregut i la força no es transmet bé." 
    : "✅ El colze dret manté una obertura decent, però encara pots estabilitzar-lo més."}

${angleColzeEsq < 90 
    ? "❌ El colze esquerre està massa tancat. Tens asimetria clara entre braços." 
    : "✅ El colze esquerre està acceptable, però vigila que no s’òbriga massa en la fase final."}

${angleGenollDret > 130 
    ? "❌ El genoll dret està massa estès. Això indica falta de control i risc de sobreextensió." 
    : "✅ El genoll dret està dins del rang, però pots baixar més amb control."}

${angleGenollEsq > 130 
    ? "❌ El genoll esquerre està massa estès. Estàs compensant amb el maluc." 
    : "✅ El genoll esquerre està correcte, però mantén tensió en la baixada."}

🦵 Estabilitat de maluc:
${Math.abs(angleGenollDret - angleGenollEsq) > 15
    ? "❌ Tens desequilibri entre cames. El maluc està ballant i això fa que el cul tambalege." 
    : "✅ Bona simetria de cames. El maluc es manté prou estable."}

🍑 Control del cul:
${angleGenollDret < 100 && angleGenollEsq < 100
    ? "❌ El cul puja massa ràpid respecte al tronc. Estàs fent 'butt wink' o pujada descompensada." 
    : "⚠️ Control acceptable, però vigila que el cul no avance abans que el pit."}

📏 Línia general del moviment:
${(angleColzeDret + angleColzeEsq) / 2 < 100
    ? "❌ Els colzes estan massa endavant. Perds línia i estabilitat." 
    : "⚠️ Línia decent, però pots mantindre els colzes més pegats al cos."}

🧠 Recomanació general:
- Mantén tensió al core perquè el cul no tambalege.
- Baixa amb control i no deixes que els genolls s’obrin o es tanquen.
- No sacrifiques la tècnica per velocitat.
- Grava’t des del lateral i frontal per comparar simetries.

Copia i enganxa això a Copilot per rebre correccions personalitzades:

"Analitza aquests angles i dona’m correccions de tècnica:
- Colze dret: ${angleColzeDret.toFixed(1)}°
- Colze esquerre: ${angleColzeEsq.toFixed(1)}°
- Genoll dret: ${angleGenollDret.toFixed(1)}°
- Genoll esquerre: ${angleGenollEsq.toFixed(1)}°"
`;
