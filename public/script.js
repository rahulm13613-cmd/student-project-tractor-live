
const STORAGE_KEY = "workshop-projects-v1";

let projects = [];
let editingId = null;
let storageReady = false;

const projectForm = document.getElementById("project-form");
const nameInput = document.getElementById("name");
const statusSelect = document.getElementById("status");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const projectList = document.getElementById("project-list");
const emptyState = document.getElementById("empty-state");
const message = document.getElementById("message");

function showMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

function isValidProjectArray(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  const ids = new Set();

  for (const project of value) {
    if (
      project === null ||
      typeof project !== "object" ||
      typeof project.id !== "string" ||
      project.id.trim() === "" ||
      typeof project.name !== "string" ||
      project.name.trim() === "" ||
      project.name.length > 80 ||
      typeof project.status !== "string" ||
      !["Planned", "In Progress", "Completed"].includes(project.status) ||
      ids.has(project.id)
    ) {
      return false;
    }

    ids.add(project.id);
  }

  return true;
}

function loadProjects() {
  let storedValue;

  try {
    storedValue = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    storageReady = false;
    showMessage(
      "Browser storage could not be read. Changes cannot be saved safely."
    );
    return;
  }

  if (storedValue === null) {
    projects = [];
    storageReady = true;
    renderProjects();
    return;
  }

  let parsedProjects;

  try {
    parsedProjects = JSON.parse(storedValue);
  } catch (error) {
    storageReady = false;
    renderProjects();
    showMessage(
      "Saved project data is malformed. It has not been overwritten. " +
      "Please correct or remove the invalid stored data before continuing."
    );
    return;
  }

  if (!isValidProjectArray(parsedProjects)) {
    storageReady = false;
    renderProjects();
    showMessage(
      "Saved project data has an invalid format. " +
      "It has not been overwritten."
    );
    return;
  }

  projects = parsedProjects;
  storageReady = true;
  renderProjects();
}

function saveProjects() {
  if (!storageReady) {
    showMessage(
      "Changes could not be saved. Check browser storage and saved data."
    );
    return false;
  }

  try {
    // stringify turns the JavaScript array into text for storage.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (error) {
    showMessage(
      "Changes could not be saved to browser storage. " +
      "Your changes may be lost if you refresh."
    );
    return false;
  }
}

function resetFormToAddMode() {
  editingId = null;
  projectForm.reset();
  saveButton.textContent = "Save Project";
  cancelButton.hidden = true;
}

function renderProjects() {
  projectList.replaceChildren();

  projects.forEach((project) => {
    const listItem = document.createElement("li");
    const projectName = document.createElement("span");
    const projectStatus = document.createElement("span");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    projectName.textContent = project.name;
    projectStatus.textContent = ` — ${project.status}`;

    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      startEditing(project.id);
    });

    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      deleteProject(project.id);
    });

    listItem.dataset.projectId = project.id;
    listItem.append(
      projectName,
      projectStatus,
      document.createTextNode(" "),
      editButton,
      document.createTextNode(" "),
      deleteButton
    );

    projectList.appendChild(listItem);
  });

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }
}

function startEditing(id) {
  const project = projects.find((item) => item.id === id);

  if (!project) {
    return;
  }

  editingId = project.id;
  nameInput.value = project.name;
  statusSelect.value = project.status;

  saveButton.textContent = "Save changes";
  cancelButton.hidden = false;
  showMessage("");

  nameInput.focus();
}

function deleteProject(id) {
  const projectIndex = projects.findIndex((item) => item.id === id);

  if (projectIndex === -1) {
    return;
  }

  const project = projects[projectIndex];
  const confirmed = window.confirm(
    `Delete project "${project.name}"? This cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  const deletedProject = projects[projectIndex];

  projects.splice(projectIndex, 1);

  if (!saveProjects()) {
    // Restore the in-memory collection if persistence failed.
    projects.splice(projectIndex, 0, deletedProject);
    renderProjects();
    return;
  }

  if (editingId === id) {
    resetFormToAddMode();
  }

  renderProjects();
  showMessage("Project deleted.");
}

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!storageReady) {
    showMessage(
      "Changes are disabled because saved data could not be loaded safely."
    );
    return;
  }

  const name = nameInput.value.trim();
  const status = statusSelect.value;

  if (!name) {
    showMessage("Please enter a project name.");
    nameInput.value = "";
    nameInput.focus();
    return;
  }

  if (name.length > 80) {
    showMessage("Project names must be 80 characters or fewer.");
    nameInput.focus();
    return;
  }

  if (!["Planned", "In Progress", "Completed"].includes(status)) {
    showMessage("Please select a valid project status.");
    return;
  }

  let updatedProject = null;
  let previousValues = null;

  if (editingId === null) {
    updatedProject = {
      id: crypto.randomUUID(),
      name,
      status,
    };

    projects.push(updatedProject);
  } else {
    updatedProject = projects.find((item) => item.id === editingId);

    if (!updatedProject) {
      resetFormToAddMode();
      renderProjects();
      showMessage("Project not found. Please try again.");
      return;
    }

    previousValues = {
      name: updatedProject.name,
      status: updatedProject.status,
    };

    updatedProject.name = name;
    updatedProject.status = status;
  }

  if (!saveProjects()) {
    if (editingId === null) {
      projects.pop();
    } else if (previousValues) {
      updatedProject.name = previousValues.name;
      updatedProject.status = previousValues.status;
    }

    renderProjects();
    return;
  }

  renderProjects();
  resetFormToAddMode();
  showMessage("Project saved.");
  nameInput.focus();
});

cancelButton.addEventListener("click", () => {
  resetFormToAddMode();
  showMessage("");
  nameInput.focus();
});

loadProjects();