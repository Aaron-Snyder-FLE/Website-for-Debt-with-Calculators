const stageMatches = [
  { id: "precontemplation", term: "Precontemplation", definition: "“I’m not thinking about this yet.”" },
  { id: "contemplation", term: "Contemplation", definition: "“I know this matters, but I’m not ready.”" },
  { id: "preparation", term: "Preparation", definition: "“I’m ready to start soon.”" },
  { id: "action", term: "Action", definition: "“I’m already trying something.”" },
  { id: "maintenance", term: "Maintenance", definition: "“I’m trying to keep this going.”" }
];

const termBank = document.getElementById("dragTermBank");
const dropList = document.getElementById("dragDropList");
const score = document.getElementById("dragScore");
const feedback = document.getElementById("dragFeedback");
const resetButton = document.getElementById("resetDragPractice");

let selectedTermId = null;
const matchedTerms = new Set();

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function setupFlipCards() {
  document.querySelectorAll(".flip-card").forEach((card) => {
    const front = card.querySelector(".flip-card-front");
    const back = card.querySelector(".flip-card-back");
    const close = card.querySelector(".flip-card-close");
    if (!front || !back || !close) return;

    front.addEventListener("click", () => {
      front.setAttribute("aria-expanded", "true");
      front.hidden = true;
      back.hidden = false;
      card.classList.add("flipped");
      back.focus();
    });

    close.addEventListener("click", () => {
      back.hidden = true;
      front.hidden = false;
      front.setAttribute("aria-expanded", "false");
      card.classList.remove("flipped");
      front.focus();
    });
  });
}

function setSelectedTerm(id) {
  if (matchedTerms.has(id)) return;
  selectedTermId = selectedTermId === id ? null : id;
  document.querySelectorAll(".drag-term").forEach((button) => {
    const isSelected = button.dataset.id === selectedTermId;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  feedback.textContent = selectedTermId ? "Now choose the matching participant mindset." : "Stage selection cleared.";
}

function updateScore() {
  score.textContent = `${matchedTerms.size} of ${stageMatches.length} matched`;
  if (matchedTerms.size === stageMatches.length) {
    feedback.textContent = `All ${stageMatches.length} stages matched.`;
  }
}

function tryMatch(termId, definitionId) {
  if (!termId) {
    feedback.textContent = "Select a stage first, then choose its participant mindset.";
    return;
  }
  if (matchedTerms.has(termId)) return;

  const target = dropList.querySelector(`[data-id="${definitionId}"]`);
  if (!target) return;

  if (termId === definitionId) {
    const item = stageMatches.find((stage) => stage.id === termId);
    matchedTerms.add(termId);
    selectedTermId = null;
    target.classList.add("matched");
    target.disabled = true;
    target.querySelector("span").textContent = item.term;
    termBank.querySelector(`[data-id="${termId}"]`)?.remove();
    feedback.textContent = `Correct—${item.term} matched.`;
    updateScore();
    return;
  }

  target.classList.remove("incorrect");
  void target.offsetWidth;
  target.classList.add("incorrect");
  feedback.textContent = "Not quite. Try that stage with another participant mindset.";
}

function renderPractice() {
  selectedTermId = null;
  matchedTerms.clear();
  feedback.textContent = "";
  termBank.replaceChildren();
  dropList.replaceChildren();

  shuffle(stageMatches).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drag-term";
    button.dataset.id = item.id;
    button.draggable = true;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", `${item.term}. Select this stage to match it.`);
    button.textContent = item.term;
    button.addEventListener("click", () => setSelectedTerm(item.id));
    button.addEventListener("dragstart", (event) => {
      selectedTermId = item.id;
      event.dataTransfer.setData("text/plain", item.id);
      event.dataTransfer.effectAllowed = "move";
      button.classList.add("dragging");
    });
    button.addEventListener("dragend", () => button.classList.remove("dragging"));
    termBank.appendChild(button);
  });

  shuffle(stageMatches).forEach((item) => {
    const button = document.createElement("button");
    const label = document.createElement("span");
    const definition = document.createElement("p");
    button.type = "button";
    button.className = "drag-drop-target";
    button.dataset.id = item.id;
    button.setAttribute("aria-label", `Match a stage with participant mindset: ${item.definition}`);
    label.textContent = "Drop or match a stage here";
    definition.textContent = item.definition;
    button.append(label, definition);
    button.addEventListener("click", () => tryMatch(selectedTermId, item.id));
    button.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      button.classList.add("drag-over");
    });
    button.addEventListener("dragleave", () => button.classList.remove("drag-over"));
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      button.classList.remove("drag-over");
      tryMatch(event.dataTransfer.getData("text/plain"), item.id);
    });
    dropList.appendChild(button);
  });

  updateScore();
}

resetButton.addEventListener("click", renderPractice);
setupFlipCards();
renderPractice();
