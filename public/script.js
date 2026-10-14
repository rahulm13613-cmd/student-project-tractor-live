const projects = [];

const projectForm = document.getElementById("project-form");
const nameInput = document.getElementById("name");
const statusSelect = document.getElementById("status");
const projectList = document.getElementById("project-list");
const emptyState = document.getElementById("empty-state");

function renderProjects() {
  // Clear the existing list to prevent duplicate display items.
  projectList.replaceChildren();

  // Build the list again from the projects array.
  projects.forEach((project) => {
    const listItem = document.createElement("li");
    const projectName = document.createElement("span");
    const projectStatus = document.createElement("span");

    projectName.textContent = project.name;
    projectStatus.textContent = ` — ${project.status}`;

    listItem.dataset.projectId = project.id;
    listItem.append(projectName, projectStatus);
    projectList.appendChild(listItem);
  });

  // Show the empty-state message only when there are no projects.
  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }
}

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const status = statusSelect.value;

  if (!name) {
    nameInput.value = "";
    nameInput.focus();
    return;
  }

  const project = {
    id: crypto.randomUUID(),
    name: name,
    status: status,
  };

  projects.push(project);

  renderProjects();

  projectForm.reset();
  nameInput.focus();
});

// Display the initial empty state.
renderProjects();
