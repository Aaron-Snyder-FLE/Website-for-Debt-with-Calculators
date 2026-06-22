const practiceTerms = [
  {
    id: "budgeting",
    term: "Budgeting",
    definition: "Creating a plan to spend, save, and manage money by aligning income and expenses."
  },
  {
    id: "surplus",
    term: "Surplus",
    definition: "Income is greater than expenses during the budgeting period."
  },
  {
    id: "deficit",
    term: "Deficit",
    definition: "Expenses are greater than income during the budgeting period."
  },
  {
    id: "fixed",
    term: "Fixed Expense/Income",
    definition: "An amount that stays predictable and largely the same each month."
  },
  {
    id: "variable",
    term: "Variable Expense/Income",
    definition: "An amount that can change from month to month."
  },
  {
    id: "cashflow",
    term: "Cashflow",
    definition: "The movement and timing of money coming in and going out."
  },
  {
    id: "models",
    term: "Budgeting Models",
    definition: "Frameworks used to organize spending categories and guide planning—not strict rules."
  },
  {
    id: "503020",
    term: "50/30/20 Budget Model",
    definition: "A reference point suggesting 50% for needs, 30% for flexible spending, and 20% for savings or debt repayment."
  },
  {
    id: "spending-plan",
    term: "Spending Plan",
    definition: "A flexible approach based on actual income, real expenses, and realistic adjustments over time."
  },
  {
    id: "irregular",
    term: "Irregular Income",
    definition: "Income that may require prioritizing essentials, averaging income, or planning around lower-income months."
  },
  {
    id: "patterns",
    term: "Spending Patterns",
    definition: "Repeated spending habits that often reveal more than a single purchase."
  },
  {
    id: "tradeoff",
    term: "Trade-Off",
    definition: "A choice between competing uses of limited money."
  },
  {
    id: "opportunity",
    term: "Opportunity Cost",
    definition: "The value or benefit given up when one choice is made instead of another."
  },
  {
    id: "prioritization",
    term: "Prioritization",
    definition: "Deciding what needs attention now and what may need to be delayed."
  },
  {
    id: "decision-pressure",
    term: "Limited Income & Decision Pressure",
    definition: "Pressure created when limited money must cover competing needs that affect stability or flexibility."
  }
];

const termBank = document.getElementById("dragTermBank");
const dropList = document.getElementById("dragDropList");
const score = document.getElementById("dragScore");
const feedback = document.getElementById("dragFeedback");
const resetButton = document.getElementById("resetDragPractice");

let selectedTermId = null;
const matchedTerms = new Set();

function createTextElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function setupFlipCards() {
  document.querySelectorAll(".original-definition-card").forEach((card, index) => {
    const heading = card.querySelector(".definition-card-heading");
    const content = card.querySelector(".definition-card-content");
    if (!heading || !content) return;

    const category = heading.querySelector("p")?.textContent.trim() || "Budgeting Vocabulary";
    const term = heading.querySelector("h3")?.textContent.trim() || "Vocabulary term";
    const backId = `vocabulary-definition-${index + 1}`;
    const backHeadingId = `${backId}-heading`;

    const front = document.createElement("button");
    front.type = "button";
    front.className = "flip-card-front";
    front.setAttribute("aria-expanded", "false");
    front.setAttribute("aria-controls", backId);
    front.setAttribute("aria-label", `${term}. Show definition.`);
    front.append(
      createTextElement("span", "flip-card-category", category),
      createTextElement("span", "flip-card-term", term),
      createTextElement("span", "flip-card-prompt", "Flip to see definition ↻")
    );

    const back = document.createElement("div");
    back.className = "flip-card-back";
    back.id = backId;
    back.hidden = true;
    back.tabIndex = -1;
    back.setAttribute("role", "region");
    back.setAttribute("aria-labelledby", backHeadingId);

    const backHeader = document.createElement("div");
    backHeader.className = "flip-card-back-heading";
    backHeader.append(
      createTextElement("p", "flip-card-category", category),
      createTextElement("h3", "flip-card-back-title", term)
    );
    backHeader.querySelector("h3").id = backHeadingId;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "flip-card-close";
    close.textContent = "Flip back to term ↺";
    close.setAttribute("aria-label", `Hide the definition for ${term} and show the term.`);

    heading.remove();
    back.append(backHeader, content, close);
    card.append(front, back);
    card.classList.add("flip-card");

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

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function selectTerm(id) {
  if (matchedTerms.has(id)) return;
  selectedTermId = selectedTermId === id ? null : id;
  document.querySelectorAll(".drag-term").forEach((button) => {
    const selected = button.dataset.id === selectedTermId;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  feedback.textContent = selectedTermId ? "Now choose the matching definition." : "";
}

function tryMatch(termId, definitionId) {
  if (!termId || matchedTerms.has(termId)) return;
  const target = dropList.querySelector(`[data-id="${definitionId}"]`);

  if (termId === definitionId) {
    matchedTerms.add(termId);
    selectedTermId = null;
    target.classList.add("matched");
    target.disabled = true;
    const item = practiceTerms.find((term) => term.id === termId);
    target.querySelector("span").textContent = item.term;
    termBank.querySelector(`[data-id="${termId}"]`)?.remove();
    feedback.textContent = `Correct—${item.term} matched.`;
    updateScore();
    return;
  }

  target.classList.remove("incorrect");
  void target.offsetWidth;
  target.classList.add("incorrect");
  feedback.textContent = "Not quite. Try that term with another definition.";
}

function updateScore() {
  score.textContent = `${matchedTerms.size} of ${practiceTerms.length} matched`;
  if (matchedTerms.size === practiceTerms.length) {
    feedback.textContent = `All ${practiceTerms.length} matched—nice work.`;
  }
}

function renderPractice() {
  selectedTermId = null;
  matchedTerms.clear();
  feedback.textContent = "";
  termBank.innerHTML = "";
  dropList.innerHTML = "";

  shuffle(practiceTerms).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drag-term";
    button.dataset.id = item.id;
    button.draggable = true;
    button.setAttribute("aria-pressed", "false");
    button.textContent = item.term;
    button.addEventListener("click", () => selectTerm(item.id));
    button.addEventListener("dragstart", (event) => {
      selectedTermId = item.id;
      event.dataTransfer.setData("text/plain", item.id);
      event.dataTransfer.effectAllowed = "move";
      button.classList.add("dragging");
    });
    button.addEventListener("dragend", () => button.classList.remove("dragging"));
    termBank.appendChild(button);
  });

  shuffle(practiceTerms).forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drag-drop-target";
    button.dataset.id = item.id;
    button.innerHTML = `<span>Drop a term here</span><p>${item.definition}</p>`;
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

function setupMicrosoftForm() {
  const section = document.getElementById("exam");
  const frame = document.getElementById("examFrame");
  const placeholder = document.getElementById("examPlaceholder");
  const fallback = document.getElementById("examFallback");
  const openLink = document.getElementById("examOpenLink");
  const formUrl = section.dataset.formUrl.trim();

  if (!formUrl) return;

  try {
    const parsed = new URL(formUrl);
    const allowedHosts = ["forms.office.com", "forms.microsoft.com", "forms.cloud.microsoft"];
    const allowed = allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
    if (!allowed) return;

    frame.src = parsed.href;
    frame.hidden = false;
    placeholder.hidden = true;
    fallback.hidden = false;
    openLink.href = parsed.href;
  } catch {
    // Keep the placeholder visible when the configured link is invalid.
  }
}

resetButton.addEventListener("click", renderPractice);
document.getElementById("floatingWeekReturn")?.addEventListener("click", (event) => {
  window.location.href = event.currentTarget.dataset.href;
});
setupFlipCards();
renderPractice();
setupMicrosoftForm();
