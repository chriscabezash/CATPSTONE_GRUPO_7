/* ============================================================
   Archivo: excel-handler.js
   Descripción: Lectura y procesamiento de archivos Excel en Datacensus
   Autor: Alex (Datacensus)
   ============================================================ */

// ============================================================
// 🔹 Cargar archivo Excel local y convertirlo a JSON
// ============================================================
export async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (typeof XLSX === "undefined") {
          console.error("❌ Librería XLSX no cargada. Verifica que 'xlsx.full.min.js' esté incluida.");
          reject("Librería XLSX no disponible");
          return;
        }

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
        resolve(jsonData);
      } catch (error) {
        console.error("Error al leer el archivo Excel:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================
// 🔹 Cargar archivo Excel por ruta HTTP o Firebase Storage
// ============================================================
export async function loadExcelFromPath(path) {
  try {
    if (!path) {
      console.error("❌ Ruta de archivo vacía.");
      return [];
    }

    const response = await fetch(path);
    if (!response.ok) {
      console.error("❌ Error al descargar el archivo desde:", path);
      return [];
    }

    const arrayBuffer = await response.arrayBuffer();
    if (typeof XLSX === "undefined") {
      console.error("❌ Librería XLSX no cargada.");
      return [];
    }

    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: null });
    console.log(`✅ Archivo Excel cargado correctamente desde: ${path}`);
    return jsonData;
  } catch (error) {
    console.error("Error al cargar el archivo desde ruta o Storage:", error);
    return [];
  }
}

// ============================================================
// 🔹 Descargar Excel desde Firebase Storage (para dashboard)
// ============================================================

export async function loadExcelFromStorage(storage, datasetPath) {
  try {
    const { ref, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js");

    const fileRef = ref(storage, datasetPath);
    const url = await getDownloadURL(fileRef);
    console.log(`📥 URL obtenida de Firebase Storage: ${url}`);

    // Reutilizamos la función anterior para procesar el Excel
    const data = await loadExcelFromPath(url);
    return data;
  } catch (error) {
    console.error("❌ Error al cargar Excel desde Firebase Storage:", error);
    return [];
  }
}

// ============================================================
// 🔹 Normalizar datos censales
// ============================================================
export function normalizeCensusData(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];

  return rawData.map((row) => ({
    year: row["Año"] || row["anio"] || row["Year"] || 2024,
    region: row["Región"] || row["region"] || row["REGION"] || "Sin región",
    comuna: row["Comuna"] || row["comuna"] || "Sin comuna",
    sexo: row["Sexo"] || row["sexo"] || "Sin especificar",
    edad: row["Edad"] || row["edad"] || null,
    poblacion: row["Población"] || row["poblacion"] || row["POBLACION"] || 0
  }));
}

// ============================================================
// 🔹 Calcular resumen general (estadísticas básicas)
// ============================================================
export function getSummaryData(normalizedData) {
  const total = normalizedData.reduce((acc, d) => acc + (d.poblacion || 0), 0);
  const hombres = normalizedData
    .filter((d) => d.sexo.toLowerCase().startsWith("h"))
    .reduce((acc, d) => acc + (d.poblacion || 0), 0);
  const mujeres = normalizedData
    .filter((d) => d.sexo.toLowerCase().startsWith("m"))
    .reduce((acc, d) => acc + (d.poblacion || 0), 0);

  return {
    total,
    hombres,
    mujeres,
    ratio: hombres && mujeres ? (hombres / mujeres).toFixed(2) : "N/A"
  };
}

console.log("✅ Módulo excel-handler.js cargado correctamente");
