/* ============================================================
   Archivo: export.js
   Descripción: Maneja exportaciones de datos y gráficos en Datacensus
   Autor: Alex (Datacensus)
   ============================================================ */

// ============================================================
// 🔹 Exportar datos a Excel o CSV usando SheetJS (xlsx.full.min.js)
// ============================================================

export function exportToExcel(jsonData, fileName = "Datacensus_Reporte.xlsx") {
  try {
    if (typeof XLSX === "undefined") {
      console.error("❌ Librería XLSX no cargada. Verifica que 'xlsx.full.min.js' esté incluido.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(jsonData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");
    XLSX.writeFile(wb, fileName);
    console.log(`✅ Archivo Excel exportado: ${fileName}`);
  } catch (error) {
    console.error("Error al exportar a Excel:", error);
  }
}

export function exportToCSV(jsonData, fileName = "Datacensus_Reporte.csv") {
  try {
    if (typeof XLSX === "undefined") {
      console.error("❌ Librería XLSX no cargada. Verifica que 'xlsx.full.min.js' esté incluido.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(jsonData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    if (typeof saveAs === "undefined") {
      console.error("❌ Librería FileSaver no cargada. Verifica que 'FileSaver.min.js' esté incluido.");
      return;
    }

    saveAs(blob, fileName);
    console.log(`✅ Archivo CSV exportado: ${fileName}`);
  } catch (error) {
    console.error("Error al exportar a CSV:", error);
  }
}

// ============================================================
// 🔹 Exportar gráfico o sección del dashboard a PNG (usa html2canvas)
// ============================================================

export function exportToPNG(elementId, fileName = "Datacensus_Grafico.png") {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ Elemento no encontrado: ${elementId}`);
      return;
    }

    if (typeof html2canvas === "undefined") {
      console.error("❌ Librería html2canvas no cargada. Verifica que 'html2canvas.min.js' esté incluida.");
      return;
    }

    html2canvas(element, { backgroundColor: "#ffffff", scale: 2 })
      .then(canvas => {
        canvas.toBlob(blob => {
          if (typeof saveAs === "undefined") {
            console.error("❌ Librería FileSaver no cargada. Verifica que 'FileSaver.min.js' esté incluida.");
            return;
          }
          saveAs(blob, fileName);
          console.log(`✅ PNG exportado: ${fileName}`);
        });
      });
  } catch (error) {
    console.error("Error al exportar a PNG:", error);
  }
}

// ============================================================
// 🔹 Exportar sección completa o gráfico individual a PDF (usa jsPDF + html2canvas)
// ============================================================

export function exportToPDF(elementId, fileName = "Datacensus_Reporte.pdf") {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`❌ Elemento no encontrado: ${elementId}`);
      return;
    }

    if (typeof html2canvas === "undefined" || typeof jspdf === "undefined") {
      console.error("❌ Librerías necesarias no cargadas. Asegúrate de incluir 'jspdf.umd.min.js' y 'html2canvas.min.js'.");
      return;
    }

    html2canvas(element, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jspdf.jsPDF("p", "mm", "a4");
      const width = 210; // A4
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, width, height);
      pdf.save(fileName);
      console.log(`✅ PDF exportado: ${fileName}`);
    });
  } catch (error) {
    console.error("Error al exportar a PDF:", error);
  }
}

console.log("✅ Módulo export.js cargado correctamente");
