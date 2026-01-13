// buscador.js
// S'encarrega d'omplir el selector i aplicar filtres de cerca

import { EXERCICIS } from "./exercicis.js";

// Elements del DOM
const selector = document.getElementById("exercici");
const searchInput = document.getElementById("searchInput");

// -----------------------------
// Funció: omplir el selector
// -----------------------------
export function carregarSelector(llista = EXERCICIS) {
  // Netejar opcions actuals
  selector.innerHTML = `<option value="">Selecciona un exercici</option>`;

  // Afegir exercicis
  llista.forEach(ex => {
    const opt = document.createElement("option");
    opt.value = ex.id;
    opt.textContent = ex.nom;
    selector.appendChild(opt);
  });
}

// Carregar tots els exercicis al principi
carregarSelector();

// -----------------------------
// Buscador intel·ligent
// -----------------------------
searchInput.addEventListener("input", () => {
  const text = searchInput.value.toLowerCase();

  const filtrats = EXERCICIS.filter(ex => {
    return (
      ex.nom.toLowerCase().includes(text) ||
      ex.grupMuscular.toLowerCase().includes(text) ||
      ex.patroMoviment.toLowerCase().includes(text) ||
      ex.material.toLowerCase().includes(text)
    );
  });

  carregarSelector(filtrats);
});
