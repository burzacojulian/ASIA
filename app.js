const OWNER = "burzacojulian";
const REPO = "ASIA";
const BRANCH = "main";

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function toPublicUrl(repoPath) {
  return `/${REPO}/${repoPath}`;
}
async function fetchJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} al leer ${url}`);
  return await res.json();
}

async function listFolderContents(folderPath) {
  // GitHub Contents API
  const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(folderPath).replaceAll("%2F", "/")}?ref=${BRANCH}`;
  const res = await fetch(apiUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`No pude listar la carpeta (${res.status}).`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data; // devuelve files + dirs
}

function renderCategories(categories) {
  const box = el("categories");
  if (!box) return;

  box.innerHTML = "";

  categories.forEach((c, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.style.display = "block";
    btn.style.width = "100%";
    btn.style.textAlign = "left";
    btn.style.padding = "10px 8px";
    btn.style.margin = "6px 0";
    btn.style.border = "1px solid #ddd";
    btn.style.borderRadius = "10px";
    btn.style.background = "#fff";
    btn.style.cursor = "pointer";
    btn.textContent = c.title || c.id || `Categoría ${idx + 1}`;

    btn.addEventListener("click", () => {
      renderFilesForCategory(c);
    });

    box.appendChild(btn);
  });
}

async function renderFilesForCategory(category) {
  const filesBox = el("files");
  if (!filesBox) return;

  filesBox.innerHTML = `<p><strong>${escapeHtml(category.title || category.id)}</strong></p><p>Cargando archivos...</p>`;

  try {
    const files = await listFolderContents(category.path);

    if (!files.length) {
      filesBox.innerHTML = `<p><strong>${escapeHtml(category.title || category.id)}</strong></p><p>No hay archivos en esta carpeta.</p>`;
      return;
    }

    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.padding = "0";
    ul.style.margin = "0";

   // --- Navegación: botón Volver si estamos dentro de una subcarpeta ---
const parts = String(category.path || "").split("/").filter(Boolean);
// Ej: ["vouchers","Aereos","FEB","Emirates"]
const isSubfolder = parts.length > 2;

if (isSubfolder) {
  const parentPath = parts.slice(0, -1).join("/");
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.textContent = "⬅ Volver";
  backBtn.style.display = "block";
  backBtn.style.width = "100%";
  backBtn.style.textAlign = "left";
  backBtn.style.padding = "10px 8px";
  backBtn.style.margin = "0 0 8px 0";
  backBtn.style.border = "1px solid #ddd";
  backBtn.style.borderRadius = "10px";
  backBtn.style.background = "#fff";
  backBtn.style.cursor = "pointer";

  backBtn.addEventListener("click", () => {
    // reconstruimos un "category" para el padre
    const titleParts = String(category.title || "").split(" / ");
    const parentTitle = titleParts.length > 1 ? titleParts.slice(0, -1).join(" / ") : (category.title || "Carpeta");
    renderFilesForCategory({ ...category, title: parentTitle, path: parentPath });
  });

  // lo agregamos arriba de la lista
  ul.appendChild(document.createElement("li")).appendChild(backBtn);
}

// --- Separar carpetas y archivos ---
const dirs = files.filter(x => x && x.type === "dir");
const onlyFiles = files.filter(x => x && x.type === "file");

// Orden: primero carpetas, luego archivos
dirs.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
onlyFiles.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

// 1) Carpetas: se navegan (no se abren en otra pestaña)
dirs.forEach(d => {
  const li = document.createElement("li");
  li.style.margin = "8px 0";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "📁 " + (d.name || "Carpeta");
  btn.style.display = "block";
  btn.style.width = "100%";
  btn.style.textAlign = "left";
  btn.style.padding = "10px 8px";
  btn.style.border = "1px solid #ddd";
  btn.style.borderRadius = "10px";
  btn.style.background = "#fff";
  btn.style.cursor = "pointer";

  btn.addEventListener("click", () => {
    const nextTitle = (category.title || category.id || "Carpeta") + " / " + (d.name || "");
    renderFilesForCategory({ ...category, title: nextTitle, path: d.path });
  });

  li.appendChild(btn);
  ul.appendChild(li);
});

// 2) Archivos: se abren como link (como antes)
onlyFiles.forEach(f => {
  const li = document.createElement("li");
  li.style.margin = "8px 0";

  const a = document.createElement("a");
  a.href = toPublicUrl(f.path);
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = "📄 " + (f.name || "Archivo");

  li.appendChild(a);
  ul.appendChild(li);
});


    filesBox.innerHTML = `<p><strong>${escapeHtml(category.title || category.id)}</strong></p>`;
    filesBox.appendChild(ul);

  } catch (err) {
    filesBox.innerHTML = `
      <p><strong>${escapeHtml(category.title || category.id)}</strong></p>
      <p>No pude cargar el listado. Si estás sin conexión, esto puede pasar antes de que quede cacheado offline.</p>
      <pre style="white-space:pre-wrap;border:1px solid #eee;padding:10px;border-radius:10px;">${escapeHtml(err.message || String(err))}</pre>
    `;
  }
}

async function init() {
  // 1) cargar categorías desde el JSON
const index = await fetchJson(toPublicUrl("vouchers/index.json"));
  const categories = Array.isArray(index.categories) ? index.categories : [];

  renderCategories(categories);

  // 2) autoseleccionar la primera categoría
  if (categories.length) {
    renderFilesForCategory(categories[0]);
  }
}

// Registrar SW (ya lo tenías, lo dejamos)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.error("SW registration failed:", err));
  });
}

init().catch((err) => {
  const filesBox = el("files");
  if (filesBox) {
    filesBox.innerHTML = `<p>Error inicial: ${escapeHtml(err.message || String(err))}</p>`;
  }
});
