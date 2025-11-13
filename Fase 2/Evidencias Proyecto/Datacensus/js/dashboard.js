/* ============================================================
   Archivo: dashboard.js
   Descripción: Dashboard dinámico con filtros avanzados
   Autor: Alex (Datacensus)
   ============================================================ */

// 🔹 Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// 🔹 Exportaciones
import { exportToExcel, exportToCSV, exportToPDF, exportToPNG } from "./export.js";
window.exportToExcel = exportToExcel;
window.exportToCSV = exportToCSV;
window.exportToPDF = exportToPDF;
window.exportToPNG = exportToPNG;

/* ============================================================
   🔧 Configuración Firebase
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBl0_qNvnPXNx0HXSjB800n5pPbiriKeRA",
  authDomain: "datacensus.firebaseapp.com",
  projectId: "datacensus",
  storageBucket: "datacensus.firebasestorage.app",
  messagingSenderId: "292911699949",
  appId: "1:292911699949:web:d37091fa5dfc6d8268b9e4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* ============================================================
   🔐 Verificación de sesión
   ============================================================ */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠️ Debes iniciar sesión para acceder al Dashboard.");
    window.location.href = "login.html";
  }
});

/* ============================================================
   📊 Variables globales
   ============================================================ */
let currentData = [];
let fullData = [];
let piramideChart, regionChart, edadChart;

/* ============================================================
   🚀 Inicialización automática del Dashboard
   ============================================================ */
(async function initDashboard() {
  try {
    const q = query(collection(db, "datasets"), orderBy("createdAt", "desc"), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("⚠️ No hay datasets disponibles aún. Sube uno desde el panel Admin.");
      return;
    }

    const latestDoc = snapshot.docs[0].data();
    const fileURL = latestDoc.url;

    console.log("📦 Dataset más reciente:", latestDoc);

    const data = await loadExcelData(fileURL);
    fullData = normalizeData(data);
    currentData = [...fullData];

    updateSummary();
    populateFilters();
    renderCharts(currentData);
    renderTable(currentData);

    console.log("✅ Dashboard cargado con datos desde Firebase Storage");
  } catch (error) {
    console.error("❌ Error al inicializar el Dashboard:", error);
  }
})();

/* ============================================================
   📥 Leer Excel directamente desde URL
   ============================================================ */
async function loadExcelData(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

/* ============================================================
   🔄 Normalizar datos según TABLA_POBLACION.xlsx
   ============================================================ */
function normalizeData(data) {
  return data.map((d) => ({
    region: d.region || "Sin región",
    comuna: d.comuna || "Sin comuna",
    grupo_edad: d.grupos_edad || "No especificado",
    hombres: parseInt(d.hombres || 0),
    mujeres: parseInt(d.mujeres || 0),
    poblacion_censo: parseInt(d.poblacion_censo || 0),
    total: parseInt(d.hombres || 0) + parseInt(d.mujeres || 0)
  }));
}

/* ============================================================
   📈 Resumen general
   ============================================================ */
function updateSummary(data = currentData) {
  const total = data.reduce((a, b) => a + (b.total || 0), 0);
  const hombres = data.reduce((a, b) => a + (b.hombres || 0), 0);
  const mujeres = data.reduce((a, b) => a + (b.mujeres || 0), 0);
  const ratio = mujeres > 0 ? (hombres / mujeres).toFixed(2) : "N/A";

  document.getElementById("total-poblacion").textContent = total.toLocaleString();
  document.getElementById("total-hombres").textContent = hombres.toLocaleString();
  document.getElementById("total-mujeres").textContent = mujeres.toLocaleString();
  document.getElementById("ratio-hm").textContent = ratio;
}

/* ============================================================
   🔍 Filtros dinámicos
   ============================================================ */
function populateFilters() {
  const regiones = [...new Set(fullData.map((d) => d.region))].sort();
  const comunas = [...new Set(fullData.map((d) => d.comuna))].sort();
  const gruposEdad = [...new Set(fullData.map((d) => d.grupo_edad))];

  const regionSelect = document.getElementById("region-select");
  const comunaSelect = document.getElementById("comuna-select");
  const edadSelect = document.getElementById("edad-select");

  regionSelect.innerHTML = `<option value="Todas">Todas</option>` + regiones.map(r => `<option>${r}</option>`).join("");
  comunaSelect.innerHTML = `<option value="Todas">Todas</option>` + comunas.map(c => `<option>${c}</option>`).join("");
  edadSelect.innerHTML = `<option value="Todas">Todas</option>` + gruposEdad.map(e => `<option>${e}</option>`).join("");
}

// 🔹 Filtro geográfico
document.getElementById("filtro-region")?.addEventListener("click", () => {
  const region = document.getElementById("region-select").value;
  const comuna = document.getElementById("comuna-select").value;

  currentData = fullData.filter((d) =>
    (region === "Todas" || d.region === region) &&
    (comuna === "Todas" || d.comuna === comuna)
  );

  updateSummary(currentData);
  renderCharts(currentData);
  renderTable(currentData);
});

// 🔹 Filtro demográfico
document.getElementById("filtro-edad")?.addEventListener("click", () => {
  const sexo = document.getElementById("sexo-select").value;
  const grupo = document.getElementById("edad-select").value;

  currentData = fullData.filter((d) =>
    (grupo === "Todas" || d.grupo_edad === grupo) &&
    (sexo === "Todos" ||
      (sexo === "H" && d.hombres > 0) ||
      (sexo === "M" && d.mujeres > 0))
  );

  updateSummary(currentData);
  renderCharts(currentData);
  renderTable(currentData);
});

/* ============================================================
   📊 Gráficos (Chart.js)
   ============================================================ */
function renderCharts(data = currentData) {
  const ctxPiramide = document.getElementById("piramideChart").getContext("2d");
  const ctxRegion = document.getElementById("regionChart").getContext("2d");
  const ctxEdad = document.getElementById("edadChart").getContext("2d");

  if (piramideChart) piramideChart.destroy();
  if (regionChart) regionChart.destroy();
  if (edadChart) edadChart.destroy();

  // Pirámide poblacional (Edad vs Sexo)
  const edades = [...new Set(data.map((d) => d.grupo_edad))];
  const hombres = edades.map((e) =>
    data.filter((d) => d.grupo_edad === e).reduce((a, b) => a + b.hombres, 0)
  );
  const mujeres = edades.map((e) =>
    data.filter((d) => d.grupo_edad === e).reduce((a, b) => a + b.mujeres, 0)
  );

  piramideChart = new Chart(ctxPiramide, {
    type: "bar",
    data: {
      labels: edades,
      datasets: [
        { label: "Hombres", data: hombres, backgroundColor: "#0ea5e9" },
        { label: "Mujeres", data: mujeres, backgroundColor: "#d81b60" }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Grupo de edad" } },
        y: { beginAtZero: true, title: { display: true, text: "Población" } }
      }
    }
  });

  // Distribución por región
  const regiones = [...new Set(data.map((d) => d.region))];
  const poblacionPorRegion = regiones.map((r) =>
    data.filter((d) => d.region === r).reduce((a, b) => a + b.total, 0)
  );

  regionChart = new Chart(ctxRegion, {
    type: "pie",
    data: {
      labels: regiones,
      datasets: [
        {
          label: "Distribución por región",
          data: poblacionPorRegion,
          backgroundColor: ["#1a2b6d", "#0ea5e9", "#d81b60", "#22c55e", "#f59e0b", "#9333ea"]
        }
      ]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  // Distribución por edad total
  const totalEdad = edades.map((e) =>
    data.filter((d) => d.grupo_edad === e).reduce((a, b) => a + b.total, 0)
  );

  edadChart = new Chart(ctxEdad, {
    type: "line",
    data: {
      labels: edades,
      datasets: [
        {
          label: "Población total por grupo de edad",
          data: totalEdad,
          borderColor: "#1a2b6d",
          backgroundColor: "rgba(26, 43, 109, 0.2)",
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Grupo de edad" } },
        y: { beginAtZero: true, title: { display: true, text: "Población total" } }
      }
    }
  });
}

/* ============================================================
/* ============================================================
   📋 Tabla con paginación
   ============================================================ */
let currentPage = 1;
const rowsPerPage = 15;

function renderTable(data) {
  const headers = Object.keys(data[0] || {});
  const headerRow = document.getElementById("table-headers");
  const body = document.getElementById("table-body");

  if (data.length === 0) {
    headerRow.innerHTML = "<th>Sin datos disponibles</th>";
    body.innerHTML = "<tr><td>Sin resultados</td></tr>";
    document.getElementById("pagination")?.remove();
    return;
  }

  headerRow.innerHTML = headers.map((h) => `<th>${h}</th>`).join("");

  // 🔹 Calcular paginación
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = data.slice(start, end);

  body.innerHTML = pageData
    .map(
      (row) =>
        `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`
    )
    .join("");

  // 🔹 Crear controles de paginación
  let pagination = document.getElementById("pagination");
  if (!pagination) {
    pagination = document.createElement("div");
    pagination.id = "pagination";
    pagination.className = "pagination-controls text-center mt-3";
    body.parentNode.after(pagination);
  }

  const totalPages = Math.ceil(data.length / rowsPerPage);
  pagination.innerHTML = `
    <button ${currentPage === 1 ? "disabled" : ""} id="prevPage">Anterior</button>
    <span>Página ${currentPage} de ${totalPages}</span>
    <button ${currentPage === totalPages ? "disabled" : ""} id="nextPage">Siguiente</button>
  `;

  // Eventos de botones
  document.getElementById("prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable(data);
    }
  });
  document.getElementById("nextPage")?.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable(data);
    }
  });
}


/* ============================================================
   🚪 Cerrar sesión
   ============================================================ */
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

console.log("✅ Dashboard dinámico cargado correctamente");
/* ============================================================
/* ============================================================
   🤖 Asistente IA conectado a n8n (versión final corregida)
   ============================================================ */
document.getElementById("send-ai")?.addEventListener("click", async () => {
  const query = document.getElementById("ai-query").value.trim();
  const responseDiv = document.getElementById("ai-response");

  if (!query) {
    responseDiv.textContent = "Por favor, escribe una pregunta antes de enviar.";
    return;
  }

  responseDiv.innerHTML = "⏳ Consultando a la IA...";

  try {
    // Leer endpoint desde JSON
    const res = await fetch("./ai/n8n-endpoint.json");
    const { ai_endpoint } = await res.json();

const aiRes = await fetch(ai_endpoint, {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ query })
});


    // Intentar leer la respuesta como texto y luego JSON
    const rawText = await aiRes.text();
    console.log("Respuesta cruda IA:", rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error("Respuesta no es JSON válido: " + rawText);
    }

    // Mostrar la respuesta
    if (data.reply) {
      responseDiv.innerHTML = `<p style="white-space: pre-line;">${data.reply}</p>`;
    } else {
      responseDiv.textContent = "⚠️ La IA respondió sin texto visible.";
    }

  } catch (error) {
    console.error("Error con la IA:", error);
    responseDiv.textContent = "❌ Error al conectar con el asistente IA.";
  }
});

