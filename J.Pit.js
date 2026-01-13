// exercicis.js
// Base de dades d'exercicis MGym’S PRO

export const EXERCICIS = [

  // -------------------------
  // 1. Jaló al pit
  // -------------------------
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

    velocitat: { minima: 0.2, maxima: 2.0 },

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

    penalitzacions: { lleu: 5, moderat: 10, greu: 15 },

    errorsTipics: [
      {
        id: "tirar_de_braços_massa",
        severitat: "moderat",
        condicio: { angle: "colzeConc", foraRang: true },
        missatge: "Estàs tirant massa de braços. Pensa en portar el colze cap avall i enrere, iniciant el moviment des de l'esquena."
      },
      {
        id: "tirar_tronc_enrere",
        severitat: "greu",
        condicio: { angle: "troncInclinacio", foraRang: true },
        missatge: "Estàs tirant massa del tronc enrere. Mantén el tronc estable i evita compensar amb l'esquena baixa."
      }
    ]
  },

  // -------------------------
  // 2. Flexions (Push-ups)
  // -------------------------
  {
    id: "flexions",
    nom: "Flexions",
    grupMuscular: "Pectoral",
    patroMoviment: "Push horitzontal",
    material: "Pes corporal",
    costatPrincipal: "bilateral",

    puntsClau: {
      espatllaEsq: 11,
      colzeEsq: 13,
      canellEsq: 15,
      espatllaDre: 12,
      colzeDre: 14,
      canellDre: 16,
      malucEsq: 23,
      malucDre: 24,
      genollEsq: 25,
      genollDre: 26
    },

    angles: {
      colzeConc: {
        puntA: "espatllaEsq",
        puntB: "colzeEsq",
        puntC: "canellEsq",
        rangOptim: [70, 100],
        toleranciaLleu: 10,
        toleranciaModerada: 20,
        pes: 1.0
      },
      troncRecte: {
        puntA: "espatllaEsq",
        puntB: "malucEsq",
        puntC: "genollEsq",
        rangOptim: [160, 180],
        toleranciaLleu: 10,
        toleranciaModerada: 20,
        pes: 1.0
      }
    },

    fases: {
      excentrica: {
        condicio: { angleReferencia: "colzeConc", sentit: "obri", minimVelocitat: -999, maximVelocitat: 999 }
      },
      concentrica: {
        condicio: { angleReferencia: "colzeConc", sentit: "tanca", minimVelocitat: -999, maximVelocitat: 999 }
      }
    },

    velocitat: { minima: 0.2, maxima: 2.5 },

    estabilitat: {
      tronc: {
        punts: ["malucEsq", "malucDre"],
        variacioMaximaGraus: 12
      }
    },

    simetria: {
      colze: {
        angleEsq: "colzeConc",
        angleDre: "colzeConc",
        diferenciaMaxima: 12
      }
    },

    penalitzacions: { lleu: 5, moderat: 10, greu: 15 },

    errorsTipics: [
      {
        id: "maluc_caigut",
        severitat: "greu",
        condicio: { angle: "troncRecte", foraRang: true },
        missatge: "El maluc cau massa. Mantén el tronc recte i actiu durant tot el moviment."
      },
      {
        id: "colzes_oberts",
        severitat: "moderat",
        condicio: { angle: "colzeConc", foraRang: true },
        missatge: "Els colzes estan massa oberts. Apropa'ls una mica per protegir les espatlles."
      }
    ]
  },

  // -------------------------
  // 3. Rem Gironda
  // -------------------------
  {
    id: "rem_gironda",
    nom: "Rem Gironda",
    grupMuscular: "Esquena",
    patroMoviment: "Pull horitzontal",
    material: "Barra",
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
      troncInclinacio: {
        puntA: "malucEsq",
        puntB: "espatllaEsq",
        puntC: "espatllaDre",
        rangOptim: [30, 45],
        toleranciaLleu: 10,
        toleranciaModerada: 20,
        pes: 1.0
      },
      colzeConc: {
        puntA: "espatllaEsq",
        puntB: "colzeEsq",
        puntC: "canellEsq",
        rangOptim: [60, 90],
        toleranciaLleu: 10,
        toleranciaModerada: 20,
        pes: 1.0
      }
    },

    fases: {
      excentrica: {
        condicio: { angleReferencia: "colzeConc", sentit: "obri", minimVelocitat: -999, maximVelocitat: 999 }
      },
      concentrica: {
        condicio: { angleReferencia: "colzeConc", sentit: "tanca", minimVelocitat: -999, maximVelocitat: 999 }
      }
    },

    velocitat: { minima: 0.2, maxima: 2.0 },

    estabilitat: {
      tronc: {
        punts: ["malucEsq", "malucDre"],
        variacioMaximaGraus: 8
      }
    },

    simetria: {
      colze: {
        angleEsq: "colzeConc",
        angleDre: "colzeConc",
        diferenciaMaxima: 10
      }
    },

    penalitzacions: { lleu: 5, moderat: 10, greu: 15 },

    errorsTipics: [
      {
        id: "tronc_massa_vertical",
        severitat: "moderat",
        condicio: { angle: "troncInclinacio", foraRang: true },
        missatge: "El tronc està massa vertical. Inclina't lleugerament cap endavant per activar millor l'esquena."
      },
      {
        id: "tirar_de_braços",
        severitat: "moderat",
        condicio: { angle: "colzeConc", foraRang: true },
        missatge: "Estàs tirant massa de braços. Prioritza el moviment d'esquena i porta els colzes enrere."
      }
    ]
  },

  // -------------------------
  // 4. Dominades
  // -------------------------
  {
    id: "dominades",
    nom: "Dominades",
    grupMuscular: "Esquena",
    patroMoviment: "Pull vertical",
    material: "Pes corporal",
    costatPrincipal: "bilateral",

    puntsClau: {
      espatllaEsq: 11,
      colzeEsq: 13,
      canellEsq: 15,
      espatllaDre: 12,
      colzeDre: 14,
      canellDre: 16
    },

    angles: {
      colzeConc: {
        puntA: "espatllaEsq",
        puntB: "colzeEsq",
        puntC: "canellEsq",
        rangOptim: [40, 70],
        toleranciaLleu: 10,
        toleranciaModerada: 20,
        pes: 1.0
      }
    },

    fases: {
      excentrica: {
        condicio: { angleReferencia: "colzeConc", sentit: "obri", minimVelocitat: -999, maximVelocitat: 999 }
      },
      concentrica: {
        condicio: { angleReferencia: "colzeConc", sentit: "tanca", minimVelocitat: -999, maximVelocitat: 999 }
      }
    },

    velocitat: { minima: 0.2, maxima: 2.0 },

    estabilitat: {
      tronc: {
        punts: ["espatllaEsq", "espatllaDre"],
        variacioMaximaGraus: 15
      }
    },

    simetria: {
      colze: {
        angleEsq: "colzeConc",
        angleDre: "colzeConc",
        diferenciaMaxima: 15
      }
    },

    penalitzacions: { lleu: 5, moderat: 10, greu: 15 },

    errorsTipics: [
      {
        id: "balanceig",
        severitat: "greu",
        condicio: {},
        missatge: "Hi ha massa balanceig. Mantén el cos estable i evita l'impuls amb cames."
      },
      {
        id: "tirar_de_braços",
        severitat: "moderat",
        condicio: { angle: "colzeConc", foraRang: true },
        missatge: "Estàs tirant massa de braços. Activa l'esquena i pensa en portar el pit cap a la barra."
      }
    ]
  }

];
