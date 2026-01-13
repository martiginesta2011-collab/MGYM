// exercicis.js
// Base de dades d'exercicis MGym’S PRO
// Cada exercici està pensat per treballar amb:
// - angles
// - fases (excèntrica / concèntrica / isomètrica)
// - velocitat
// - estabilitat
// - simetria

// Estructura general per a cada exercici:
//
// {
//   id: "jalon_pit",
//   nom: "Jaló al pit",
//   grupMuscular: "Esquena",
//   patroMoviment: "Pull vertical",
//   material: "Polea",
//   costatPrincipal: "bilateral", // o "esquerra" / "dreta"
//
//   // Landmarks clau que utilitzarem
//   puntsClau: {
//     espatllaEsq: 11,
//     colzeEsq: 13,
//     canellEsq: 15,
//     espatllaDre: 12,
//     colzeDre: 14,
//     canellDre: 16,
//     malucEsq: 23,
//     malucDre: 24
//   },
//
//   // Regles d'angles per a postura correcta
//   angles: {
//     // Exemple: angle colze en fase concèntrica
//     colzeConc: {
//       puntA: "espatllaEsq",
//       puntB: "colzeEsq",
//       puntC: "canellEsq",
//       rangOptim: [45, 70],     // graus
//       toleranciaLleu: 10,      // ± respecte rang
//       toleranciaModerada: 20,
//       pes: 1.0                 // importància relativa
//     },
//     // ... afegirem més angles rellevants
//   },
//
//   // Definició de fases segons angles + velocitat
//   fases: {
//     // excèntrica: el pes baixa / el cos controla la tornada
//     excentrica: {
//       condicio: {
//         angleReferencia: "colzeConc",
//         sentit: "obri",          // obri/tanca
//         minimVelocitat: -999,
//         maximVelocitat: 999
//       }
//     },
//     // concèntrica: el pes puja / tracció activa
//     concentrica: {
//       condicio: {
//         angleReferencia: "colzeConc",
//         sentit: "tanca",
//         minimVelocitat: -999,
//         maximVelocitat: 999
//       }
//     }
//   },
//
//   // Límits de velocitat recomanats (graus/segon o píxels/segon normalitzats)
//   velocitat: {
//     minima: 0.1,   // massa lent = compensacions
//     maxima: 3.0    // massa ràpid = pèrdua control
//   },
//
//   // Estabilitat: variació permesa en punts clau durant la fase
//   estabilitat: {
//     tronc: {
//       punts: ["malucEsq", "malucDre"],
//       variacioMaximaGraus: 10
//     }
//   },
//
//   // Simetria: diferència màxima permesa entre costat esquerra/dreta
//   simetria: {
//     colze: {
//       angleEsq: "colzeConc",
//       angleDre: "colzeConc",
//       diferenciaMaxima: 10
//     }
//   },
//
//   // Penalitzacions PRO (lleu / moderat / greu)
//   penalitzacions: {
//     lleu: 5,
//     moderat: 10,
//     greu: 15
//   },
//
//   // Patrons d'error típics amb condicions i text de feedback
//   errorsTipics: [
//     {
//       id: "tirar_de_braços_massa",
//       severitat: "moderat",
//       condicio: {
//         angle: "colzeConc",
//         foraRang: true
//       },
//       missatge: "Estàs tirant massa de braços. Prioritza l'espatlla i la musculatura d'esquena, pensa en portar el colze cap avall i enrere."
//     }
//   ]
// }

// -------------------------
// 1r exercici: Jaló al pit
// -------------------------

export const EXERCICIS = [
  {
    id: "jalon_pit",
    nom: "Jaló al pit",
    grupMuscular: "Esquena",
    patroMoviment: "Pull vertical",
    material: "Polea",
    costatPrincipal: "bilateral",

    puntsClau: {
      espatllaEsq: 11,
      colzeEsq: 13,
      canellEsq: 15,
      espatllaDre: 12,
      colzeDre: 14,
      canellDre: 16,
      malucEsq: 23,
      malucDre: 24
    },

    angles: {
      colzeConc: {
        puntA: "espatllaEsq",
        puntB: "colzeEsq",
        puntC: "canellEsq",
        rangOptim: [50, 80],
        toleranciaLleu: 10,
        toleranciaModerada: 20,
        pes: 1.0
      },
      troncInclinacio: {
        puntA: "malucEsq",
        puntB: "espatllaEsq",
        puntC: "espatllaDre",
        rangOptim: [70, 100],
        toleranciaLleu: 10,
        toleranciaModerada: 20,
        pes: 1.0
      }
    },

    fases: {
      excentrica: {
        condicio: {
          angleReferencia: "colzeConc",
          sentit: "obri",
          minimVelocitat: -999,
          maximVelocitat: 999
        }
      },
      concentrica: {
        condicio: {
          angleReferencia: "colzeConc",
          sentit: "tanca",
          minimVelocitat: -999,
          maximVelocitat: 999
        }
      }
    },

    velocitat: {
      minima: 0.2,
      maxima: 2.0
    },

    estabilitat: {
      tronc: {
        punts: ["malucEsq", "malucDre"],
        variacioMaximaGraus: 10
      }
    },

    simetria: {
      colze: {
        angleEsq: "colzeConc",
        angleDre: "colzeConc",
        diferenciaMaxima: 12
      }
    },

    penalitzacions: {
      lleu: 5,
      moderat: 10,
      greu: 15
    },

    errorsTipics: [
      {
        id: "tirar_de_braços_massa",
        severitat: "moderat",
        condicio: {
          angle: "colzeConc",
          foraRang: true
        },
        missatge: "Estàs tirant massa de braços. Pensa en portar el colze cap avall i enrere, iniciant el moviment des de l'esquena."
      },
      {
        id: "tirar_tronc_enrere",
        severitat: "greu",
        condicio: {
          angle: "troncInclinacio",
          foraRang: true
        },
        missatge: "Estàs tirant massa del tronc enrere. Mantén el tronc estable i evita compensar amb l'esquena baixa."
      }
    ]
  }
];
