/* ============================================================
   Archivo: admin.js
   Descripción: Panel de administración de Datacensus
   Autor: Alex (Datacensus)
   ============================================================ */

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
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";
import { readExcelFile } from "./excel-handler.js";

// ============================================================
// 🔧 Configuración Firebase
// ============================================================

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

// ============================================================
// 🔐 Verificación de acceso (solo admin)
// ============================================================

const ADMIN_EMAIL = "informatico.q@gmail.com";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("⚠️ Debes iniciar sesión para acceder al panel.");
    window.location.href = "login.html";
    return;
  }

  if (user.email !== ADMIN_EMAIL) {
    alert("🚫 Acceso denegado. Solo el administrador puede acceder.");
    window.location.href = "dashboard.html";
    return;
  }

  document.querySelector("h1").textContent = `Bienvenido, ${user.email}`;
  loadUsers();
  loadLogs();
});

// ============================================================
// 👥 Cargar usuarios desde Firestore
// ============================================================

async function loadUsers() {
  const usersBody = document.getElementById("users-body");
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    if (querySnapshot.empty) {
      usersBody.innerHTML = `<tr><td colspan="4">No hay usuarios registrados.</td></tr>`;
      return;
    }

    let html = "";
    querySnapshot.forEach((doc) => {
      const u = doc.data();
      html += `
        <tr>
          <td>${u.email}</td>
          <td>${u.name || "-"}</td>
          <td>${u.role || "user"}</td>
          <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
        </tr>
      `;
    });

    usersBody.innerHTML = html;
    addLog("Usuarios cargados correctamente");
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    usersBody.innerHTML = `<tr><td colspan="4">Error al cargar usuarios.</td></tr>`;
  }
}

// ============================================================
// 📂 Subir y registrar nuevo dataset en Firebase
// ============================================================

document.getElementById("upload-btn")?.addEventListener("click", async () => {
  const fileInput = document.getElementById("dataset-upload");
  const statusText = document.getElementById("upload-status");

  if (!fileInput.files.length) {
    statusText.textContent = "⚠️ Debes seleccionar un archivo .xlsx";
    return;
  }

  const file = fileInput.files[0];
  const fileName = file.name;
  const storagePath = `datasets/${fileName}`;
  const fileRef = ref(storage, storagePath);

  try {
    statusText.textContent = "⏳ Subiendo archivo a Firebase Storage...";
    await uploadBytes(fileRef, file);

    const url = await getDownloadURL(fileRef);
    console.log("📂 Archivo subido con éxito:", url);

    // Leer archivo localmente (opcional para mostrar cantidad de filas)
    const data = await readExcelFile(file);
    const totalRows = data.length;

    // Registrar metadatos del dataset en Firestore
    await addDoc(collection(db, "datasets"), {
      title: fileName,
      url: url,
      uploadedBy: ADMIN_EMAIL,
      uploadedAt: serverTimestamp(),
      description: `Dataset con ${totalRows} filas`,
    });

    statusText.textContent = `✅ Archivo "${fileName}" subido y registrado (${totalRows} filas).`;
    addLog(`Dataset subido correctamente (${fileName})`);
  } catch (error) {
    console.error("❌ Error al subir dataset:", error);
    statusText.textContent = "❌ Error al subir el archivo. Revisa la consola.";
    addLog("Error al subir dataset");
  }
});

// ============================================================
// 🧾 Registro de actividad local
// ============================================================

function addLog(msg) {
  const logsList = document.getElementById("logs-list");
  const item = document.createElement("li");
  const timestamp = new Date().toLocaleTimeString();
  item.textContent = `[${timestamp}] ${msg}`;
  logsList.prepend(item);
}

// ============================================================
// 🔹 Cerrar sesión
// ============================================================

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// ============================================================
// 🧩 Registro de actividad (placeholder temporal)
// ============================================================
function loadLogs() {
  const logsList = document.getElementById("logs-list");
  if (!logsList) return;

  const now = new Date().toLocaleTimeString();
  logsList.innerHTML = `
    <li>[${now}] Sistema en línea ✅</li>
    <li>[${now}] Esperando nuevas acciones...</li>
  `;
}

console.log("✅ Panel Admin conectado correctamente con Firebase");
