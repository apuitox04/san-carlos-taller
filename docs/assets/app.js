const COURSE_URL = "content/course.json";
const PROGRESS_KEY = "msc_lafortuna_curso_v3_progreso";
const NOTES_KEY = "msc_lafortuna_curso_v3_notas";

const el = (tag, options = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(options)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
};

const textList = (items, className = "") => {
  const list = el("ul", {class: className});
  items.forEach(item => list.append(el("li", {text: item})));
  return list;
};

const readJson = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

const storeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // El curso sigue funcionando cuando el navegador bloquea almacenamiento local.
  }
};

const renderSchedule = course => {
  const container = document.querySelector("#schedule");
  let total = 0;
  course.schedule.forEach(item => {
    total += item.minutes;
    container.append(el("article", {class: "schedule-item"}, [
      el("span", {class: "schedule-item__time", text: item.slot}),
      el("h3", {text: item.title}),
      el("p", {text: item.detail}),
      el("span", {class: "schedule-item__minutes", text: `${item.minutes} min`})
    ]));
  });
  document.querySelector("#schedule-total").textContent = total;
  if (total !== course.meta.durationMinutes) {
    document.querySelector("#schedule-total").closest("p").dataset.error = "true";
  }
};

const renderProject = project => {
  document.querySelector("#project-crs").textContent = project.crs;
  document.querySelector("#project-scope").textContent = project.scope;
  const status = document.querySelector("#project-status");
  project.status.forEach(item => status.append(el("li", {text: item})));
  const links = document.querySelector("#project-links");
  project.online.forEach(item => {
    links.append(el("a", {
      class: "link-card",
      href: item.url,
      target: "_blank",
      rel: "noopener"
    }, [
      el("strong", {text: item.label}),
      el("span", {text: item.access})
    ]));
  });
};

const updateProgress = modules => {
  const state = readJson(PROGRESS_KEY);
  const count = modules.filter(module => state[module.id] === true).length;
  document.querySelector("#progress-label").textContent = `${count} de ${modules.length} módulos`;
  document.querySelector("#progress-bar").style.width = `${Math.round((count / modules.length) * 100)}%`;
};

const renderModules = modules => {
  const container = document.querySelector("#modules");
  const state = readJson(PROGRESS_KEY);
  modules.forEach(module => {
    const card = el("article", {
      class: "module-card",
      dataset: {module: module.id, complete: String(state[module.id] === true)}
    });
    const body = el("div");
    body.append(
      el("h3", {text: module.title}),
      el("p", {class: "module-card__question", text: module.question})
    );
    const steps = el("ol");
    module.steps.forEach(step => steps.append(el("li", {text: step})));
    const checkbox = el("input", {
      type: "checkbox",
      id: `complete-${module.id}`,
      checked: state[module.id] === true
    });
    checkbox.addEventListener("change", () => {
      const next = readJson(PROGRESS_KEY);
      next[module.id] = checkbox.checked;
      storeJson(PROGRESS_KEY, next);
      card.dataset.complete = String(checkbox.checked);
      updateProgress(modules);
    });
    body.append(
      steps,
      el("p", {class: "module-card__evidence"}, [
        el("strong", {text: "Evidencia: "}),
        document.createTextNode(module.evidence)
      ]),
      el("label", {class: "completion", htmlFor: checkbox.id}, [
        checkbox,
        document.createTextNode(" Evidencia verificada")
      ])
    );
    card.append(el("div", {class: "module-card__mark", text: module.id}), body);
    container.append(card);
  });
  updateProgress(modules);
  document.querySelector("#reset-progress").addEventListener("click", () => {
    storeJson(PROGRESS_KEY, {});
    container.querySelectorAll("input[type=checkbox]").forEach(box => {
      box.checked = false;
      box.closest(".module-card").dataset.complete = "false";
    });
    updateProgress(modules);
  });
};

const renderTables = tables => {
  const container = document.querySelector("#tables");
  tables.forEach(table => {
    const details = el("dl");
    details.append(
      el("dt", {text: "Participantes"}),
      el("dd", {text: table.participants}),
      el("dt", {text: "Decisión"}),
      el("dd", {text: table.decision})
    );
    container.append(el("article", {class: "sector-card"}, [
      el("span", {class: "sector-card__id", text: table.id}),
      el("h3", {text: table.name}),
      el("p", {class: "sector-card__question", text: table.question}),
      details
    ]));
  });
};

const renderLinks = (selector, items, className) => {
  const container = document.querySelector(selector);
  items.forEach(item => {
    const relative = !/^https?:/i.test(item.url);
    container.append(el("a", {
      class: className,
      href: item.url,
      target: relative ? "_self" : "_blank",
      rel: relative ? "" : "noopener"
    }, [
      el("strong", {text: item.label}),
      el("span", {text: item.note || item.use})
    ]));
  });
};

const renderPreparation = items => {
  const list = document.querySelector("#preparation");
  items.forEach(item => list.append(el("li", {text: item})));
};

const renderOutcomes = items => {
  const list = document.querySelector("#outcomes");
  items.forEach(item => list.append(el("li", {text: item})));
};

const setUpNotes = meta => {
  const input = document.querySelector("#session-notes");
  try {
    input.value = localStorage.getItem(NOTES_KEY) || "";
  } catch {
    input.value = "";
  }
  input.addEventListener("input", () => {
    try {
      localStorage.setItem(NOTES_KEY, input.value);
    } catch {
      // La descarga manual sigue disponible.
    }
  });
  document.querySelector("#clear-notes").addEventListener("click", () => {
    input.value = "";
    try {
      localStorage.removeItem(NOTES_KEY);
    } catch {
      // Sin acción adicional.
    }
    input.focus();
  });
  document.querySelector("#download-notes").addEventListener("click", () => {
    const body = [
      meta.title,
      `Versión ${meta.version} · ${meta.updated}`,
      "",
      input.value.trim() || "Sin notas registradas."
    ].join("\n");
    const blob = new Blob([body], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = el("a", {href: url, download: "Notas_preparacion_taller_La_Fortuna.txt"});
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
};

const setUpNavigation = () => {
  const links = [...document.querySelectorAll(".nav a")];
  const sections = links
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach(link => {
      if (link.getAttribute("href") === `#${visible.target.id}`) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }, {rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.2, 0.5]});
  sections.forEach(section => observer.observe(section));
};

const loadCourse = async () => {
  const response = await fetch(COURSE_URL, {cache: "no-store"});
  if (!response.ok) throw new Error(`No se pudo cargar el curso: ${response.status}`);
  const course = await response.json();
  document.querySelector("#course-purpose").textContent = course.purpose;
  renderProject(course.project);
  renderSchedule(course);
  renderModules(course.modules);
  renderTables(course.tables);
  renderPreparation(course.preparation);
  renderOutcomes(course.outcomes);
  renderLinks("#resources", course.resources, "resource-card");
  renderLinks("#sources", course.sources, "source-card");
  setUpNotes(course.meta);
  setUpNavigation();
};

loadCourse().catch(error => {
  console.error(error);
  document.querySelector("#course-purpose").textContent =
    "No fue posible cargar el contenido. Abra el sitio mediante un servidor HTTP o use la guía descargable.";
});
