const estadoInicial = () => ({
  nombre: "Alex",
  dia: 1,
  periodo: 0,
  salud: 80,
  energia: 70,
  animo: 65,
  dinero: 120,
  habilidad: 20,
  relaciones: 30,
  reputacion: 25,
  estres: 20,
  historial: ["Te mudas a una nueva ciudad con ganas de empezar una vida diferente."],
});

let estado = estadoInicial();

const periodos = ["Mañana", "Tarde", "Noche"];
const historialEl = document.getElementById("historial");
const menuEl = document.getElementById("menu");
const gameEl = document.getElementById("game");
const iniciarBtn = document.getElementById("iniciar");
const continuarBtn = document.getElementById("continuar");

const campos = {
  salud: document.getElementById("salud"),
  energia: document.getElementById("energia"),
  animo: document.getElementById("animo"),
  dinero: document.getElementById("dinero"),
  habilidad: document.getElementById("habilidad"),
  relaciones: document.getElementById("relaciones"),
  reputacion: document.getElementById("reputacion"),
  estres: document.getElementById("estres"),
};

const barras = {
  salud: document.getElementById("salud-bar"),
  energia: document.getElementById("energia-bar"),
  animo: document.getElementById("animo-bar"),
  dinero: document.getElementById("dinero-bar"),
  habilidad: document.getElementById("habilidad-bar"),
  relaciones: document.getElementById("relaciones-bar"),
  reputacion: document.getElementById("reputacion-bar"),
  estres: document.getElementById("estres-bar"),
};

const fechaEl = document.getElementById("fecha");
const nombreEl = document.getElementById("nombre-personaje");

const clamp = (valor, min = 0, max = 100) => Math.min(Math.max(valor, min), max);

const registrar = (mensaje) => {
  estado.historial.unshift(mensaje);
  renderHistorial();
};

const renderHistorial = () => {
  historialEl.innerHTML = "";
  estado.historial.slice(0, 12).forEach((entrada) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.textContent = entrada;
    historialEl.appendChild(div);
  });
};

const render = () => {
  Object.keys(campos).forEach((key) => {
    const valor = estado[key];
    campos[key].textContent = key === "dinero" ? `$${valor}` : `${valor}%`;
  });

  Object.keys(barras).forEach((key) => {
    if (!barras[key]) return;
    const valor = estado[key];
    const maximo = key === "dinero" ? 300 : 100;
    const porcentaje = Math.min((valor / maximo) * 100, 100);
    barras[key].style.width = `${porcentaje}%`;
  });

  fechaEl.textContent = `Día ${estado.dia} · ${periodos[estado.periodo]}`;
  nombreEl.textContent = `Personaje: ${estado.nombre}`;
  renderHistorial();
};

const avanzarTiempo = () => {
  estado.periodo += 1;
  if (estado.periodo >= periodos.length) {
    estado.periodo = 0;
    estado.dia += 1;
  }
  estado.energia = clamp(estado.energia - 8);
  estado.estres = clamp(estado.estres + 4);
  estado.animo = clamp(estado.animo - 2);
  eventoAleatorio();
  render();
};

const eventoAleatorio = () => {
  const eventos = [
    {
      texto: "Te invitan a un club local y haces nuevos contactos.",
      cambios: { relaciones: 6, animo: 4, estres: -3 },
    },
    {
      texto: "El transporte falla y pierdes tiempo valioso.",
      cambios: { energia: -6, estres: 6 },
    },
    {
      texto: "Encuentras una oportunidad freelance inesperada.",
      cambios: { dinero: 40, habilidad: 3, estres: 2 },
    },
    {
      texto: "Un amigo cercano necesita apoyo emocional.",
      cambios: { relaciones: 5, animo: 2, energia: -4 },
    },
    {
      texto: "Consigues una recomendación positiva en tu trabajo.",
      cambios: { reputacion: 6, dinero: 20 },
    },
  ];
  if (Math.random() < 0.45) {
    const evento = eventos[Math.floor(Math.random() * eventos.length)];
    aplicarCambios(evento.cambios);
    registrar(`Evento: ${evento.texto}`);
  }
};

const aplicarCambios = (cambios) => {
  Object.entries(cambios).forEach(([key, valor]) => {
    estado[key] = clamp(estado[key] + valor, 0, key === "dinero" ? 9999 : 100);
  });
};

const acciones = {
  trabajar: {
    texto: "Trabajas en tu proyecto principal y sumas ingresos.",
    cambios: { dinero: 60, energia: -12, estres: 6, reputacion: 3 },
  },
  estudiar: {
    texto: "Estudias nuevas habilidades para tu futuro.",
    cambios: { habilidad: 8, energia: -8, animo: 3, estres: 4 },
  },
  socializar: {
    texto: "Compartes tiempo con amistades y fortaleces vínculos.",
    cambios: { relaciones: 10, animo: 6, energia: -6, estres: -4 },
  },
  entrenar: {
    texto: "Entrenas tu cuerpo y te sientes con más energía.",
    cambios: { salud: 8, energia: -6, estres: -3, animo: 2 },
  },
  descansar: {
    texto: "Te tomas un respiro profundo para recargar.",
    cambios: { energia: 15, salud: 4, estres: -6, animo: 2 },
  },
  explorar: {
    texto: "Exploras la ciudad y descubres nuevos espacios.",
    cambios: { animo: 5, relaciones: 4, energia: -7, dinero: -10 },
  },
  hobby: {
    texto: "Practicas tu hobby favorito y recuperas motivación.",
    cambios: { animo: 7, estres: -5, habilidad: 4, energia: -4 },
  },
  comprar: {
    texto: "Renuevas tu estilo y te das un gusto.",
    cambios: { dinero: -25, animo: 6, relaciones: 2 },
  },
};

const ejecutarAccion = (tipo) => {
  const accion = acciones[tipo];
  if (!accion) return;
  aplicarCambios(accion.cambios);
  registrar(accion.texto);
  avanzarTiempo();
};

const guardar = () => {
  localStorage.setItem("vidaRpg", JSON.stringify(estado));
  registrar("Partida guardada correctamente.");
};

const cargar = () => {
  const data = localStorage.getItem("vidaRpg");
  if (!data) {
    registrar("No hay partida guardada aún.");
    return;
  }
  estado = JSON.parse(data);
  registrar("Partida cargada. Continúas tu historia.");
  render();
};

const reiniciar = () => {
  estado = estadoInicial();
  render();
};

const vincularEventos = () => {
  iniciarBtn.addEventListener("click", () => {
    estado = estadoInicial();
    render();
    menuEl.classList.add("hidden");
    gameEl.classList.remove("hidden");
  });

  continuarBtn.addEventListener("click", () => {
    const data = localStorage.getItem("vidaRpg");
    if (data) {
      estado = JSON.parse(data);
      registrar("Partida cargada. Continúas tu historia.");
    } else {
      registrar("No hay partida guardada aún.");
    }
    render();
    menuEl.classList.add("hidden");
    gameEl.classList.remove("hidden");
  });

  document.querySelectorAll("[data-action]").forEach((boton) => {
    boton.addEventListener("click", () => ejecutarAccion(boton.dataset.action));
  });

  document.getElementById("avanzar").addEventListener("click", avanzarTiempo);
  document.getElementById("guardar").addEventListener("click", guardar);
  document.getElementById("cargar").addEventListener("click", cargar);
  document.getElementById("reiniciar").addEventListener("click", reiniciar);
};

vincularEventos();
render();
