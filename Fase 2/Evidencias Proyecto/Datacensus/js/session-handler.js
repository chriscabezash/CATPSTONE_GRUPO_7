/* ============================================================
   Archivo: session-handler.js
   Descripción: Control global de sesión y navbar moderno en Datacensus
   ============================================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Configuración Firebase
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

// ============================================================
// 🔹 Detectar cambios de sesión y actualizar comportamiento
// ============================================================
onAuthStateChanged(auth, (user) => {
  const loginLink = document.getElementById("login-link");
  const registerLink = document.getElementById("register-link");
  const dashboardLink = document.getElementById("dashboard-link");

  // Si el usuario está logueado
  if (user) {
    // Ocultar opciones de login y registro
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    // Crear botón de cerrar sesión si no existe aún
    if (!document.getElementById("logout-btn")) {
      const navLinks = document.getElementById("navbar-links");
      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logout-btn";
      logoutBtn.textContent = "Cerrar sesión";
      logoutBtn.classList.add("logout-btn");
      logoutBtn.style.marginLeft = "10px";
      navLinks.appendChild(logoutBtn);

      logoutBtn.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
      });
    }
  } else {
    // Mostrar login y registro si no está logueado
    if (loginLink) loginLink.style.display = "inline";
    if (registerLink) registerLink.style.display = "inline";

    // Eliminar botón de logout si existe
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.remove();
  }

  // Redirecciones automáticas según sesión
  const currentPage = window.location.pathname.split("/").pop();

  if (user && (currentPage === "login.html" || currentPage === "register.html")) {
    window.location.href = "dashboard.html";
  }

  if (!user && (currentPage === "dashboard.html" || currentPage === "admin.html")) {
    window.location.href = "login.html";
  }
});

console.log("✅ session-handler.js actualizado para navbar moderno");
