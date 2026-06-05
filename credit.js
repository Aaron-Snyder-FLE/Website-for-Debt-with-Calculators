const creditTerms = [
  {
    term: "Credit Report",
    definition: "A record of credit accounts, balances, payment history, inquiries, and some public-record or collection information.",
    example: "A report may show a credit card balance, limit, payment status, and recent hard inquiries."
  },
  {
    term: "Credit Score",
    definition: "A number that estimates credit risk using information from a credit report.",
    example: "A lender may use a score to help decide approval, interest rate, or credit limit."
  },
  {
    term: "FICO Score",
    definition: "A widely used credit score brand. Most common FICO scores range from 300 to 850.",
    example: "Many lenders use a FICO score when reviewing credit applications."
  },
  {
    term: "Payment History",
    definition: "Whether payments are made on time. This is the largest public FICO factor category.",
    example: "A 30-day late payment can hurt more when it is recent."
  },
  {
    term: "Credit Utilization",
    definition: "The share of available revolving credit currently being used.",
    example: "A $500 balance on a $2,000 card limit is 25% utilization."
  },
  {
    term: "Hard Inquiry",
    definition: "A credit check connected to applying for credit. It can affect scores for a period of time.",
    example: "Applying for a new credit card usually creates a hard inquiry."
  },
  {
    term: "Credit Mix",
    definition: "The variety of account types, such as credit cards, auto loans, student loans, or mortgages.",
    example: "A profile with a credit card and an auto loan has both revolving and installment credit."
  },
  {
    term: "Tradeline",
    definition: "An account listed on a credit report, such as a credit card or loan.",
    example: "Each credit card or loan usually appears as its own tradeline."
  },
  {
    term: "Dispute",
    definition: "A request for a credit bureau to investigate information a consumer believes is inaccurate.",
    example: "A person may dispute a late payment that belongs to someone else."
  },
  {
    term: "Bankruptcy",
    definition: "A legal process for people who cannot repay debts. It can seriously affect credit and may appear on a report for up to 10 years.",
    example: "Chapter 7 bankruptcy can remain on a credit report for up to 10 years."
  }
];

let selectedCreditTermId = null;
let selectedCreditDefinitionId = null;
const creditMatchedIds = new Set();

const decisions = [
  {
    title: "Rent goes up; groceries go on the card",
    description: "Maya uses credit to cover groceries after rent increases.",
    months: 2,
    type: "Hardship",
    category: "Hardship events",
    requiresOpenCards: true,
    apply(profile) {
      profile.cards[0].balance += 450;
      profile.cards[1].balance += 250;
      return "Rent increased, so Maya used credit cards for groceries. Utilization rose after statements reported.";
    }
  },
  {
    title: "Job loss causes two missed card payments",
    description: "A short job loss creates a temporary cash-flow crisis.",
    months: 3,
    type: "Hardship",
    category: "Hardship events",
    requiresOpenCards: true,
    skipMonthlyMinimums: true,
    apply(profile) {
      profile.latePayments += 2;
      profile.monthsSinceLate = 0;
      profile.cards[0].balance += 180;
      profile.cards[1].balance += 120;
      return "Maya lost her job for a few months and two payments became 30 days late.";
    }
  },
  {
    title: "Car repair adds emergency balance",
    description: "An urgent repair goes on the higher-balance card.",
    months: 1,
    type: "Hardship",
    category: "Hardship events",
    requiresOpenCards: true,
    apply(profile) {
      profile.cards[0].balance += 900;
      return "A car repair went on a credit card. The score reacts mostly through higher utilization.";
    }
  },
  {
    title: "Make all minimum payments on time",
    description: "One month passes. Maya makes minimum payments on every open card.",
    months: 1,
    type: "Monthly habit",
    category: "Small monthly actions",
    requiresOpenCards: true,
    apply(profile) {
      return `Maya made every minimum payment on time. Card principal fell by ${money(profile.lastMinimumPrincipalPaid)} after interest was covered.`;
    }
  },
  {
    title: "Pay $100 toward cards",
    description: "A small extra payment lowers utilization after the next statement.",
    months: 1,
    type: "Monthly habit",
    category: "Small monthly actions",
    requiresOpenCards: true,
    apply(profile) {
      payDownCards(profile, 100);
      return "Maya paid an extra $100 toward her cards. Small payments can still move utilization in the right direction.";
    }
  },
  {
    title: "Pay card balances down $600",
    description: "Utilization improves after the next statement reports.",
    months: 1,
    type: "Positive",
    category: "Recovery choices",
    requiresOpenCards: true,
    apply(profile) {
      payDownCards(profile, 600);
      return "Maya paid down revolving debt. Utilization improved after the lender reported.";
    }
  },
  {
    title: "Make 6 on-time payments",
    description: "Positive history builds slowly over time.",
    months: 6,
    type: "Positive",
    category: "Recovery choices",
    apply(profile) {
      return "Six months of on-time payments helped rebuild positive payment history.";
    }
  },
  {
    title: "Request hardship plan before missing payments",
    description: "The lender reduces payments temporarily; no new late payment is reported.",
    months: 2,
    type: "Protective",
    category: "Protection choices",
    requiresOpenCards: true,
    apply(profile) {
      profile.hardshipPlan = true;
      return "Maya contacted the lender before falling behind. No new late payment was added.";
    }
  },
  {
    title: "Open a new card",
    description: "New credit can dip the score, even if the added limit later helps utilization.",
    months: 1,
    type: "Mixed",
    category: "New credit choices",
    blockedByBankruptcy: true,
    apply(profile) {
      profile.hardInquiries += 1;
      profile.cards.push({ name: "New Rewards Card", balance: 0, limit: 2500, apr: 24.99 });
      profile.ageMonths = Math.max(6, profile.ageMonths - 4);
      return "A new card added available credit, but the inquiry and new account affected new credit and age.";
    }
  },
  {
    title: "Open a credit-builder loan",
    description: "A small installment loan may help thin credit over time, but it can dip first.",
    months: 1,
    type: "Mixed",
    category: "New credit choices",
    blockedByBankruptcy: true,
    requiresNoOpenCreditBuilder: true,
    apply(profile) {
      profile.hardInquiries += 1;
      profile.installmentAccounts += 1;
      profile.creditBuilderLoan = {
        balance: 600,
        originalBalance: 600,
        monthlyPayment: 25,
        monthsPaid: 0,
        closed: false
      };
      profile.ageMonths = Math.max(6, profile.ageMonths - 3);
      return "Maya opened a small credit-builder loan. The new inquiry and account can dip at first, but on-time payments can help later.";
    }
  },
  {
    title: "Pay credit-builder loan on time for 12 months",
    description: "A year of on-time installment payments builds history.",
    months: 12,
    type: "Positive",
    category: "Recovery choices",
    requiresCreditBuilderLoan: true,
    apply(profile) {
      return "Maya made 12 on-time credit-builder loan payments. The account now has a stronger positive payment record.";
    }
  },
  {
    title: "Credit limit increases without hard pull",
    description: "Higher limits lower utilization if spending does not rise.",
    months: 1,
    type: "Positive",
    category: "New credit choices",
    requiresOpenCards: true,
    apply(profile) {
      profile.cards[0].limit += 1500;
      profile.cards[1].limit += 500;
      return "Maya received higher limits without adding debt. Utilization improved.";
    }
  },
  {
    title: "Correct an inaccurate late payment",
    description: "A dispute removes an error after the bureau updates the report.",
    months: 2,
    type: "Protective",
    category: "Protection choices",
    apply(profile) {
      if (profile.latePayments > 0) {
        profile.latePayments -= 1;
        if (profile.latePayments === 0) profile.monthsSinceLate = null;
        return "An inaccurate late payment was removed after review.";
      }
      return "Maya reviewed her report. No late-payment error was available to remove.";
    }
  },
  {
    title: "Let inquiries age 12 months",
    description: "Time can reduce the impact of recent credit applications.",
    months: 12,
    type: "Time",
    category: "Time passing",
    apply(profile) {
      profile.hardInquiries = Math.max(0, profile.hardInquiries - 2);
      return "Time passed. Older inquiries mattered less and accounts aged.";
    }
  },
  {
    title: "Declare bankruptcy (Chapter 7)",
    description: "A last-resort legal process. It can remain on a credit report for up to 10 years.",
    months: 1,
    type: "Major relief",
    category: "Major relief option",
    blockedByBankruptcy: true,
    skipMonthlyMinimums: true,
    apply(profile) {
      profile.bankruptcyMonthsRemaining = 120;
      profile.bankruptcyChapter = "Chapter 7";
      profile.cards.forEach((card) => {
        card.balance = 0;
        card.limit = 0;
        card.closed = true;
      });
      profile.hardshipPlan = false;
      return "Maya filed Chapter 7 bankruptcy. The cards were closed and the bankruptcy can remain on the report for up to 10 years.";
    }
  }
];

const startingProfile = {
  cards: [
    { name: "Everyday Visa", balance: 1250, limit: 3000, apr: 24.99, closed: false },
    { name: "Store Card", balance: 850, limit: 2000, apr: 29.99, closed: false }
  ],
  latePayments: 1,
  monthsSinceLate: 14,
  hardInquiries: 2,
  ageMonths: 42,
  onTimeMonths: 22,
  installmentAccounts: 1,
  hardshipPlan: false,
  bankruptcyMonthsRemaining: 0,
  bankruptcyChapter: null,
  creditBuilderLoan: null,
  lastMinimumPrincipalPaid: 0,
  actionEvents: [],
  month: 0,
  history: ["Month 0: Maya starts with two credit cards, one auto loan, a 42% utilization rate, and one older late payment."]
};

let profile = cloneProfile(startingProfile);
let previousScore = calculateEstimatedScore(profile).score;
let whyPanelOpen = false;

function cloneProfile(source) {
  return {
    ...source,
    creditBuilderLoan: source.creditBuilderLoan ? { ...source.creditBuilderLoan } : null,
    cards: source.cards.map((card) => ({ ...card })),
    actionEvents: source.actionEvents.map((event) => ({ ...event })),
    history: [...source.history]
  };
}

function clampScore(score) {
  return Math.max(300, Math.min(850, Math.round(score)));
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function totalBalance(currentProfile) {
  return currentProfile.cards.reduce((sum, card) => sum + card.balance, 0);
}

function totalLimit(currentProfile) {
  return currentProfile.cards.reduce((sum, card) => sum + card.limit, 0);
}

function utilizationRate(currentProfile) {
  const limit = totalLimit(currentProfile);
  return limit > 0 ? totalBalance(currentProfile) / limit : 0;
}

function payDownCards(currentProfile, amount) {
  let remaining = amount;
  const sortedCards = [...currentProfile.cards]
    .filter((card) => !card.closed)
    .sort((a, b) => b.balance - a.balance);

  sortedCards.forEach((card) => {
    if (remaining <= 0) return;
    const payment = Math.min(card.balance, remaining);
    card.balance -= payment;
    remaining -= payment;
  });
}

function hasOpenCards(currentProfile) {
  return currentProfile.cards.some((card) => !card.closed);
}

function applyOneMonthMinimumPayments(currentProfile) {
  let principalPaid = 0;

  currentProfile.cards.forEach((card) => {
    if (card.closed || card.balance <= 0) return;
    const interest = card.balance * (card.apr / 100 / 12);
    const principalPortion = card.balance * 0.01;
    card.balance = Math.max(0, card.balance - principalPortion);
    principalPaid += principalPortion;
  });

  return principalPaid;
}

function applyOneMonthInstallmentPayments(currentProfile) {
  let paid = 0;

  if (currentProfile.creditBuilderLoan && !currentProfile.creditBuilderLoan.closed) {
    const loan = currentProfile.creditBuilderLoan;
    const payment = Math.min(loan.monthlyPayment, loan.balance);
    loan.balance = Math.max(0, loan.balance - payment);
    loan.monthsPaid += 1;
    paid += payment;

    if (loan.balance <= 0) {
      loan.closed = true;
    }
  }

  return paid;
}

function advanceMonths(currentProfile, months, options = {}) {
  let principalPaid = 0;
  let installmentPaid = 0;

  for (let index = 0; index < months; index += 1) {
    currentProfile.month += 1;
    currentProfile.ageMonths += 1;
    currentProfile.bankruptcyMonthsRemaining = Math.max(0, currentProfile.bankruptcyMonthsRemaining - 1);

    if (currentProfile.monthsSinceLate !== null) {
      currentProfile.monthsSinceLate += 1;
    }

    if (!options.skipMinimums) {
      const monthlyPrincipalPaid = hasOpenCards(currentProfile)
        ? applyOneMonthMinimumPayments(currentProfile)
        : 0;
      const monthlyInstallmentPaid = applyOneMonthInstallmentPayments(currentProfile);

      principalPaid += monthlyPrincipalPaid;
      installmentPaid += monthlyInstallmentPaid;

      if (monthlyPrincipalPaid > 0 || monthlyInstallmentPaid > 0) {
        currentProfile.onTimeMonths += 1;
      }
    }
  }

  currentProfile.lastMinimumPrincipalPaid = principalPaid;
  currentProfile.lastInstallmentPaid = installmentPaid;
  return principalPaid;
}

function utilizationPoints(utilization) {
  if (utilization <= 0.09) return 160;
  if (utilization <= 0.29) return 142;
  if (utilization <= 0.49) return 110;
  if (utilization <= 0.74) return 78;
  if (utilization <= 0.9) return 48;
  return 26;
}

function calculateEstimatedScore(currentProfile) {
  const utilization = utilizationRate(currentProfile);
  let paymentPoints = 170;

  if (currentProfile.latePayments > 0) {
    const recency = currentProfile.monthsSinceLate === null ? 12 : currentProfile.monthsSinceLate;
    const recencyPenalty = recency < 6 ? 74 : recency < 12 ? 55 : 35;
    paymentPoints -= recencyPenalty + currentProfile.latePayments * 22;
  }

  paymentPoints += Math.min(20, currentProfile.onTimeMonths * 0.6);
  if (currentProfile.hardshipPlan) paymentPoints += 4;

  const owedPoints = utilizationPoints(utilization);
  const ageYears = currentProfile.ageMonths / 12;
  const agePoints = Math.min(82, 25 + ageYears * 10);
  const newCreditPoints = Math.max(20, 55 - currentProfile.hardInquiries * 8);
  const hasOpenRevolving = currentProfile.cards.some((card) => !card.closed);
  const hasCreditBuilder = currentProfile.creditBuilderLoan && currentProfile.creditBuilderLoan.monthsPaid >= 6;
  const mixPoints = currentProfile.installmentAccounts > 0 && hasOpenRevolving
    ? Math.min(56, 50 + (hasCreditBuilder ? 6 : 0))
    : 36;
  const bankruptcyPenalty = currentProfile.bankruptcyMonthsRemaining > 0
    ? 225 - ((120 - currentProfile.bankruptcyMonthsRemaining) / 120) * 125
    : 0;
  const score = clampScore(300 + paymentPoints + owedPoints + agePoints + newCreditPoints + mixPoints - bankruptcyPenalty);

  return {
    score,
    utilization,
    factors: {
      paymentPoints,
      owedPoints,
      agePoints,
      newCreditPoints,
      mixPoints
    }
  };
}

function renderCreditTerms() {
  const grid = document.querySelector("#creditTermGrid");
  grid.innerHTML = "";

  creditTerms.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "flashcard";
    card.dataset.index = index;
    card.setAttribute("aria-label", `Flashcard: ${item.term}`);
    card.innerHTML = `
      <button class="flashcard-flip" type="button" aria-expanded="false">
        <span class="flashcard-inner">
          <span class="card-face card-front">
            <span class="term">${item.term}</span>
            <span class="card-tools">
              <span>Click to reveal</span>
            </span>
          </span>
          <span class="card-face card-back">
            <span>
              <span class="definition">${item.definition}</span>
              <span class="definition"><strong>Example:</strong> ${item.example}</span>
            </span>
            <span class="card-tools">
              <span>Click to hide</span>
              <span>Study card</span>
            </span>
          </span>
        </span>
      </button>
      <button class="known-toggle" type="button" aria-pressed="false">Mark known</button>
    `;

    const flip = card.querySelector(".flashcard-flip");
    const known = card.querySelector(".known-toggle");

    flip.addEventListener("click", () => {
      card.classList.toggle("is-flipped");
      flip.setAttribute("aria-expanded", String(card.classList.contains("is-flipped")));
    });

    known.addEventListener("click", () => {
      const isKnown = card.classList.toggle("is-known");
      known.classList.toggle("is-known", isKnown);
      known.textContent = isKnown ? "Known" : "Mark known";
      known.setAttribute("aria-pressed", String(isKnown));
      updateCreditCardProgress();
    });

    grid.appendChild(card);
  });

  updateCreditCardProgress();
}

function updateCreditCardProgress() {
  const known = document.querySelectorAll("#creditTermGrid .flashcard.is-known").length;
  document.querySelector("#creditCardProgress").textContent = `${known} of ${creditTerms.length} known`;
}

function shuffleCreditFlashcards() {
  for (let i = creditTerms.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [creditTerms[i], creditTerms[j]] = [creditTerms[j], creditTerms[i]];
  }
  renderCreditTerms();
  renderCreditMatchingActivity();
}

function shuffledItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function renderCreditMatchingActivity() {
  const termColumn = document.querySelector("#creditTermColumn");
  const definitionColumn = document.querySelector("#creditDefinitionColumn");
  const matchedPairs = document.querySelector("#creditMatchedPairs");
  termColumn.innerHTML = "";
  definitionColumn.innerHTML = "";
  matchedPairs.innerHTML = '<p class="empty-match">No matches yet.</p>';
  document.querySelector("#creditMatchingFeedback").textContent = "";
  creditMatchedIds.clear();
  selectedCreditTermId = null;
  selectedCreditDefinitionId = null;

  creditTerms.forEach((item, index) => {
    item.id = `credit-term-${index}`;
  });

  creditTerms.forEach((item) => {
    termColumn.appendChild(createCreditMatchCard(item, "term"));
  });

  shuffledItems(creditTerms).forEach((item) => {
    definitionColumn.appendChild(createCreditMatchCard(item, "definition"));
  });

  updateCreditMatchingScore();
}

function createCreditMatchCard(item, type) {
  const button = document.createElement("button");
  button.className = "match-card";
  button.type = "button";
  button.dataset.id = item.id;
  button.dataset.creditType = type;
  button.textContent = type === "term" ? item.term : item.definition;
  button.addEventListener("click", () => selectCreditMatch(button));
  return button;
}

function selectCreditMatch(button) {
  if (button.classList.contains("correct")) return;

  const id = button.dataset.id;
  const type = button.dataset.creditType;
  const selector = `.match-card[data-credit-type="${type}"]`;

  document.querySelectorAll(selector).forEach((card) => {
    card.classList.remove("selected", "incorrect");
  });

  button.classList.add("selected");

  if (type === "term") {
    selectedCreditTermId = id;
  } else {
    selectedCreditDefinitionId = id;
  }

  if (selectedCreditTermId && selectedCreditDefinitionId) {
    checkCreditMatch();
  }
}

function checkCreditMatch() {
  const feedback = document.querySelector("#creditMatchingFeedback");
  const termCard = document.querySelector(`.match-card[data-credit-type="term"][data-id="${selectedCreditTermId}"]`);
  const definitionCard = document.querySelector(`.match-card[data-credit-type="definition"][data-id="${selectedCreditDefinitionId}"]`);
  const matchedItem = creditTerms.find((item) => item.id === selectedCreditTermId);

  if (selectedCreditTermId === selectedCreditDefinitionId) {
    termCard.classList.remove("selected");
    definitionCard.classList.remove("selected");
    termCard.classList.add("correct");
    definitionCard.classList.add("correct");
    termCard.disabled = true;
    definitionCard.disabled = true;
    creditMatchedIds.add(selectedCreditTermId);
    termCard.classList.add("fly-away");
    definitionCard.classList.add("fly-away");
    window.setTimeout(() => {
      addCreditMatchedPair(matchedItem);
      termCard.remove();
      definitionCard.remove();
    }, 220);
    feedback.textContent = "Correct match. The pair moved below.";
  } else {
    termCard.classList.add("incorrect");
    definitionCard.classList.add("incorrect");
    feedback.textContent = "Not a match yet. Click the phrase again, then choose a different definition.";
  }

  selectedCreditTermId = null;
  selectedCreditDefinitionId = null;
  updateCreditMatchingScore();
}

function addCreditMatchedPair(item) {
  if (!item) return;

  const matchedPairs = document.querySelector("#creditMatchedPairs");
  const emptyState = matchedPairs.querySelector(".empty-match");
  const pair = document.createElement("article");
  pair.className = "matched-pair";
  pair.innerHTML = `
    <strong>${item.term}</strong>
    <span>${item.definition}</span>
  `;

  if (emptyState) {
    emptyState.remove();
  }

  matchedPairs.appendChild(pair);
}

function updateCreditMatchingScore() {
  const score = document.querySelector("#creditMatchingScore");
  score.textContent = `${creditMatchedIds.size} of ${creditTerms.length} matches`;

  if (creditMatchedIds.size === creditTerms.length) {
    document.querySelector("#creditMatchingFeedback").textContent = "Board complete. Nice work.";
  }
}

function renderDecisions() {
  const grid = document.querySelector("#decisionGrid");
  grid.innerHTML = "";
  const groups = [...new Set(decisions.map((decision) => decision.category))];

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "decision-category";
    section.innerHTML = `<h3>${group}</h3>`;

    decisions.forEach((decision, index) => {
      if (decision.category !== group) return;
      const disabledReason = decisionDisabledReason(decision);
      const button = document.createElement("button");
      button.className = "decision-card";
      button.type = "button";
      button.disabled = Boolean(disabledReason);
      button.innerHTML = `
        <strong>${decision.title}</strong>
        <span>${disabledReason || decision.description}</span>
        <em>${decision.type} | shows after ${decision.months} month${decision.months === 1 ? "" : "s"}</em>
      `;
      button.addEventListener("click", () => applyDecision(index));
      section.appendChild(button);
    });

    grid.appendChild(section);
  });
}

function decisionDisabledReason(decision) {
  if (profile.bankruptcyMonthsRemaining > 0 && decision.blockedByBankruptcy) {
    return "Unavailable after bankruptcy in this scenario.";
  }

  if (profile.bankruptcyMonthsRemaining > 0 && decision.requiresOpenCards && !hasOpenCards(profile)) {
    return "Cards are closed after bankruptcy, so this action is unavailable.";
  }

  if (decision.requiresCreditBuilderLoan && (!profile.creditBuilderLoan || profile.creditBuilderLoan.closed)) {
    return "Open a credit-builder loan first.";
  }

  if (decision.requiresNoOpenCreditBuilder && profile.creditBuilderLoan && !profile.creditBuilderLoan.closed) {
    return "Maya already has a credit-builder loan open.";
  }

  if (decision.requiresOpenCards && !hasOpenCards(profile)) {
    return "No open cards are available for this action.";
  }

  return "";
}

function applyDecision(index) {
  const before = calculateEstimatedScore(profile).score;
  const decision = decisions[index];
  const automaticPrincipalPaid = advanceMonths(profile, decision.months, {
    skipMinimums: decision.skipMonthlyMinimums
  });

  const message = decision.apply(profile);
  const after = calculateEstimatedScore(profile).score;
  const minimumNote = automaticPrincipalPaid > 0 && decision.title !== "Make all minimum payments on time"
    ? ` Minimum payments during this time reduced principal by ${money(automaticPrincipalPaid)}.`
    : "";
  profile.actionEvents.unshift(createActionEvent(decision, before, after, message));
  profile.history.unshift(`Month ${profile.month}: ${message}${minimumNote} Score ${before} -> ${after}.`);
  previousScore = before;
  renderProfile();
  renderDecisions();
}

function utilizationStatus(percent) {
  if (percent <= 9) return "low";
  if (percent <= 29) return "good";
  if (percent <= 49) return "watch";
  return "high";
}

function renderCards() {
  const list = document.querySelector("#creditCardList");
  list.innerHTML = "";

  profile.cards.forEach((card) => {
    const percent = card.limit > 0 ? Math.round((card.balance / card.limit) * 100) : 0;
    const item = document.createElement("article");
    item.className = `sim-card ${utilizationStatus(percent)}${card.closed ? " closed" : ""}`;
    item.innerHTML = `
      <div class="sim-card-top">
        <strong>${card.name}</strong>
        <span>${card.closed ? "Closed" : `${percent}% used`}</span>
      </div>
      <div class="util-meter" aria-hidden="true">
        <span style="width: ${Math.min(100, percent)}%"></span>
      </div>
      <p>${money(card.balance)} balance / ${money(card.limit)} limit${card.closed ? " | included/closed" : ""}</p>
    `;
    list.appendChild(item);
  });
}

function renderProfile() {
  const result = calculateEstimatedScore(profile);
  const score = result.score;
  const utilizationPercent = Math.round(result.utilization * 100);
  const scorePercent = ((score - 300) / 550) * 100;
  const change = score - previousScore;

  document.querySelector("#simScore").textContent = score;
  document.querySelector("#sidebarScore").textContent = score;
  document.querySelector("#scoreMeterFill").style.width = `${Math.max(4, Math.min(100, scorePercent))}%`;
  document.querySelector("#scoreChange").textContent =
    change === 0 ? "No score movement yet" : `${change > 0 ? "+" : ""}${change} point change from last decision`;
  document.querySelector("#paymentHistory").textContent = `${profile.latePayments} late`;
  document.querySelector("#creditUtilization").textContent = `${utilizationPercent}% (${money(totalBalance(profile))} / ${money(totalLimit(profile))})`;
  document.querySelector("#accountAge").textContent = `${(profile.ageMonths / 12).toFixed(1)} yrs`;
  document.querySelector("#hardInquiries").textContent = profile.hardInquiries;
  document.querySelector("#minimumDebtPayment").textContent = money(minimumMonthlyDebtPayment(profile));
  document.querySelector("#minimumDebtDetail").textContent = minimumMonthlyDebtDetail(profile);
  document.querySelector("#timelineMonth").textContent = `Month ${profile.month}`;
  document.querySelector("#utilizationFormula").textContent = profile.bankruptcyMonthsRemaining > 0
    ? `${profile.bankruptcyChapter} bankruptcy: ${Math.ceil(profile.bankruptcyMonthsRemaining / 12)} years remaining`
    : `${money(totalBalance(profile))} / ${money(totalLimit(profile))} = ${utilizationPercent}%`;
  updateScoreMood(score);
  renderWhyPanel();

  renderCards();

  const timeline = document.querySelector("#timelineList");
  timeline.innerHTML = "";
  profile.history.slice(0, 7).forEach((event) => {
    const item = document.createElement("li");
    item.textContent = event;
    timeline.appendChild(item);
  });
}

function createActionEvent(decision, before, after, message) {
  const duration = decisionDuration(decision);

  return {
    title: decision.title,
    type: decision.type,
    tone: decisionTone(decision, after - before),
    month: profile.month,
    scoreChange: after - before,
    durationMonths: duration.months,
    durationLabel: duration.label,
    message
  };
}

function decisionTone(decision, scoreChange) {
  if (decision.type === "Hardship" || decision.type === "Major relief") return "negative";
  if (decision.type === "Positive" || decision.type === "Protective" || decision.type === "Time") return "positive";
  if (scoreChange > 0) return "positive";
  if (scoreChange < 0) return "negative";
  return "mixed";
}

function decisionDuration(decision) {
  if (decision.title.includes("bankruptcy")) {
    return { months: 120, label: "up to 10 years" };
  }

  if (decision.title.includes("missed")) {
    return { months: 84, label: "up to 7 years, with less weight as it ages" };
  }

  if (decision.title.includes("new card") || decision.title.includes("credit-builder loan")) {
    return { months: 12, label: "about 12 months in this teaching model" };
  }

  if (decision.title.includes("inquiries")) {
    return { months: 12, label: "about 12 months in this teaching model" };
  }

  if (decision.title.includes("on-time") || decision.title.includes("minimum payments")) {
    return { months: 24, label: "builds as a positive pattern over the next 24 months" };
  }

  if (decision.title.includes("hardship plan") || decision.title.includes("Correct")) {
    return { months: 24, label: "protects the profile while newer positive history builds" };
  }

  return { months: null, label: "until a later reported balance or limit change replaces it" };
}

function activeActionEvents() {
  return profile.actionEvents.filter((event) => {
    if (event.durationMonths === null) return true;
    return profile.month - event.month < event.durationMonths;
  });
}

function monthsLeft(event) {
  if (event.durationMonths === null) return null;
  return Math.max(0, event.durationMonths - (profile.month - event.month));
}

function renderWhyPanel() {
  const panel = document.querySelector("#whyScorePanel");
  const button = document.querySelector("#whyScoreButton");
  if (!panel || !button) return;

  button.textContent = whyPanelOpen ? "Hide why" : "Why?";
  panel.hidden = !whyPanelOpen;
  if (!whyPanelOpen) return;

  const result = calculateEstimatedScore(profile);
  const activeEvents = activeActionEvents();
  const positiveEvents = activeEvents.filter((event) => event.tone === "positive");
  const negativeEvents = activeEvents.filter((event) => event.tone === "negative");
  const mixedEvents = activeEvents.filter((event) => event.tone === "mixed");
  const ratioText = negativeEvents.length === 0
    ? `${positiveEvents.length}:0 helping-to-hurting`
    : `${positiveEvents.length}:${negativeEvents.length} helping-to-hurting`;
  const helping = whyHelpingLines(result, positiveEvents);
  const hurting = whyHurtingLines(result, negativeEvents);
  const horizon = whyHorizonLine(negativeEvents);

  panel.innerHTML = `
    <p class="why-summary">${whyHeadline(result.score, positiveEvents.length, negativeEvents.length, mixedEvents.length)}</p>
    <div class="why-counts">
      <span>${positiveEvents.length} helping</span>
      <span>${negativeEvents.length} hurting</span>
      <span>${mixedEvents.length} mixed</span>
    </div>
    <p class="why-ratio">${ratioText}. Newer actions matter most in this activity.</p>
    <div class="why-columns">
      <div>
        <h4>Helping now</h4>
        <ul>${helping.map((line) => `<li>${line}</li>`).join("")}</ul>
      </div>
      <div>
        <h4>Holding it down</h4>
        <ul>${hurting.map((line) => `<li>${line}</li>`).join("")}</ul>
      </div>
    </div>
    <p class="why-horizon">${horizon}</p>
  `;
}

function whyHeadline(score, positiveCount, negativeCount, mixedCount) {
  if (profile.bankruptcyMonthsRemaining > 0) {
    return `Maya is at ${score} mainly because bankruptcy is still very recent in the model. Positive choices help, but some options stay limited while that record is active.`;
  }

  if (negativeCount > positiveCount) {
    return `Maya is at ${score} because the recent hurting actions outnumber the helping ones. The score can recover, but it needs time plus lower balances or steady payments.`;
  }

  if (positiveCount > negativeCount) {
    return `Maya is at ${score} because more recent actions are helping than hurting. If the score is moving slowly, older late payments, utilization, or inquiries may still be weighing on it.`;
  }

  if (mixedCount > 0) {
    return `Maya is at ${score} because the story is mixed: some choices help later but create a short-term dip first.`;
  }

  return `Maya is at ${score}. Try a few decisions, then use this button to see what is helping, hurting, and aging off.`;
}

function whyHelpingLines(result, positiveEvents) {
  const lines = positiveEvents.slice(0, 3).map((event) => actionEventLine(event));

  if (result.utilization <= 0.29 && totalLimit(profile) > 0) {
    lines.push(`Utilization is ${Math.round(result.utilization * 100)}%, which is a strong current signal.`);
  }

  if (profile.onTimeMonths >= 24) {
    lines.push(`${profile.onTimeMonths} modeled on-time months are adding positive payment history.`);
  }

  if (profile.creditBuilderLoan && profile.creditBuilderLoan.monthsPaid >= 6 && !profile.creditBuilderLoan.closed) {
    lines.push("The credit-builder loan has enough on-time history to help credit mix in this activity.");
  }

  return lines.length > 0 ? lines : ["No recent positive action is active yet. On-time payments and lower balances are the clearest next helpers."];
}

function whyHurtingLines(result, negativeEvents) {
  const lines = negativeEvents.slice(0, 3).map((event) => actionEventLine(event));
  const utilization = Math.round(result.utilization * 100);

  if (utilization >= 50 && totalLimit(profile) > 0) {
    lines.push(`Utilization is ${utilization}%, so balances are using a large share of available credit.`);
  }

  if (profile.latePayments > 0) {
    const lateAge = profile.monthsSinceLate === null ? "older" : `${profile.monthsSinceLate} months old`;
    lines.push(`${profile.latePayments} late payment${profile.latePayments === 1 ? "" : "s"} ${profile.latePayments === 1 ? "remains" : "remain"} in the story; the newest is ${lateAge}.`);
  }

  if (profile.hardInquiries > 2) {
    lines.push(`${profile.hardInquiries} hard inquiries are still counted in the new-credit part of the model.`);
  }

  if (profile.creditBuilderLoan && profile.creditBuilderLoan.monthsPaid < 6 && !profile.creditBuilderLoan.closed) {
    lines.push("The credit-builder loan is still young, so the new-account dip can show before the payment history helps.");
  }

  return lines.length > 0 ? lines : ["No active negative scenario action is dominating right now."];
}

function whyHorizonLine(negativeEvents) {
  if (profile.bankruptcyMonthsRemaining > 0) {
    const yearsLeft = Math.ceil(profile.bankruptcyMonthsRemaining / 12);
    return `Hope on the horizon: the bankruptcy clock has about ${yearsLeft} year${yearsLeft === 1 ? "" : "s"} left in this model, and its score pressure gradually eases as it gets older.`;
  }

  const timedNegativeEvents = negativeEvents
    .filter((event) => monthsLeft(event) !== null)
    .sort((a, b) => monthsLeft(a) - monthsLeft(b));

  if (timedNegativeEvents.length > 0) {
    const event = timedNegativeEvents[0];
    const left = monthsLeft(event);
    return `Hope on the horizon: "${event.title}" has about ${left} month${left === 1 ? "" : "s"} left in this teaching window. New on-time months can help before then.`;
  }

  if (profile.latePayments > 0 && profile.monthsSinceLate !== null) {
    const monthsUntilSevenYears = Math.max(0, 84 - profile.monthsSinceLate);
    return `Hope on the horizon: the newest late payment is aging. It has about ${monthsUntilSevenYears} month${monthsUntilSevenYears === 1 ? "" : "s"} until the 7-year mark, and its score pressure fades as newer positive history builds.`;
  }

  return "Hope on the horizon: current balance-related score changes can improve as soon as lower balances are reported.";
}

function actionEventLine(event) {
  const left = monthsLeft(event);
  const direction = event.scoreChange > 0 ? "+" : "";
  const movement = event.scoreChange === 0
    ? "no point change yet"
    : `${direction}${event.scoreChange} points`;
  const timing = left === null
    ? event.durationLabel
    : `${left} month${left === 1 ? "" : "s"} left; ${event.durationLabel}`;
  return `${event.title}: ${movement}, ${timing}.`;
}

function minimumMonthlyDebtPayment(currentProfile) {
  const cardMinimums = currentProfile.cards.reduce((sum, card) => {
    if (card.closed || card.balance <= 0) return sum;
    const interest = card.balance * (card.apr / 100 / 12);
    const principal = card.balance * 0.01;
    return sum + interest + principal;
  }, 0);
  const creditBuilderPayment = currentProfile.creditBuilderLoan && !currentProfile.creditBuilderLoan.closed
    ? Math.min(currentProfile.creditBuilderLoan.monthlyPayment, currentProfile.creditBuilderLoan.balance)
    : 0;

  return cardMinimums + creditBuilderPayment;
}

function minimumMonthlyDebtDetail(currentProfile) {
  const cardMinimums = currentProfile.cards.reduce((sum, card) => {
    if (card.closed || card.balance <= 0) return sum;
    return sum + card.balance * (card.apr / 100 / 12) + card.balance * 0.01;
  }, 0);
  const creditBuilderPayment = currentProfile.creditBuilderLoan && !currentProfile.creditBuilderLoan.closed
    ? Math.min(currentProfile.creditBuilderLoan.monthlyPayment, currentProfile.creditBuilderLoan.balance)
    : 0;

  return `Cards ${money(cardMinimums)} + loans ${money(creditBuilderPayment)}`;
}

function updateScoreMood(score) {
  const face = document.querySelector("#scoreFace");
  const mood = document.querySelector("#scoreMood");

  if (score >= 781) {
    face.textContent = ":D";
    mood.textContent = "Excellent credit";
  } else if (score >= 661) {
    face.textContent = ":)";
    mood.textContent = "Prime credit";
  } else if (score >= 601) {
    face.textContent = ":|";
    mood.textContent = "Near-prime credit";
  } else if (score >= 501) {
    face.textContent = ":/";
    mood.textContent = "Subprime credit";
  } else {
    face.textContent = ":{";
    mood.textContent = "Deep subprime credit";
  }
}

function resetScenario() {
  profile = cloneProfile(startingProfile);
  previousScore = calculateEstimatedScore(profile).score;
  whyPanelOpen = false;
  renderProfile();
  renderDecisions();
}

renderCreditTerms();
renderCreditMatchingActivity();
renderDecisions();
renderProfile();
document.querySelector("#resetCreditScenario").addEventListener("click", resetScenario);
document.querySelector("#whyScoreButton").addEventListener("click", () => {
  whyPanelOpen = !whyPanelOpen;
  renderWhyPanel();
});
document.querySelector("#shuffleCreditCards").addEventListener("click", shuffleCreditFlashcards);
document.querySelector("#resetCreditCards").addEventListener("click", renderCreditTerms);
document.querySelector("#resetCreditMatching").addEventListener("click", renderCreditMatchingActivity);
