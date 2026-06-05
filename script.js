const terms = [
  {
    term: "Principal",
    definition: "The original amount borrowed or the remaining balance before interest and fees are added.",
    example: "If you borrow $1,000, the principal starts at $1,000."
  },
  {
    term: "APR",
    definition: "Annual percentage rate. It is the yearly cost of borrowing shown as a percentage.",
    example: "A 24% APR is about 2% interest per month before compounding."
  },
  {
    term: "Interest",
    definition: "The cost paid to borrow money, usually based on the balance and rate.",
    example: "Higher rates or longer repayment times usually mean more interest."
  },
  {
    term: "Installment Loan",
    definition: "A loan repaid with regular scheduled payments over a set number of months.",
    example: "Auto loans and many personal loans are installment loans."
  },
  {
    term: "Revolving Debt",
    definition: "Debt that can be borrowed, repaid, and borrowed again up to a limit.",
    example: "A credit card is a common form of revolving debt."
  },
  {
    term: "Minimum Payment",
    definition: "The smallest payment required to keep an account current for that billing cycle.",
    example: "Paying only the minimum can keep interest building for a long time."
  },
  {
    term: "Loan Term",
    definition: "The length of time scheduled to repay a loan.",
    example: "A 60-month term means five years of payments."
  },
  {
    term: "Credit Limit",
    definition: "The maximum amount a lender allows you to borrow on a revolving account.",
    example: "A $2,000 credit limit means charges cannot normally exceed $2,000."
  },
  {
    term: "Credit Utilization",
    definition: "The share of available revolving credit currently being used.",
    example: "A $500 balance on a $2,000 limit is 25% utilization."
  },
  {
    term: "Grace Period",
    definition: "A time window when interest may be avoided if the full statement balance is paid on time.",
    example: "Many credit cards have a grace period for purchases."
  },
  {
    term: "Default",
    definition: "Failure to meet the repayment terms of a loan or credit agreement.",
    example: "Default can lead to collections, fees, or legal action."
  },
  {
    term: "Fixed Rate",
    definition: "An interest rate that stays the same during the agreed period.",
    example: "A fixed-rate loan makes payments easier to predict."
  },
  {
    term: "Variable Rate",
    definition: "An interest rate that can change over time based on an index or lender terms.",
    example: "Some credit card APRs rise when benchmark rates rise."
  }
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const number = new Intl.NumberFormat("en-US");

let selectedTermId = null;
let selectedDefinitionId = null;
const matchedIds = new Set();

function money(value) {
  if (!Number.isFinite(value)) return "$0.00";
  return currency.format(Math.max(0, value));
}

function percent(value) {
  return `${Number(value).toFixed(2)}%`;
}

function monthlyInstallmentPayment(principal, apr, months) {
  const monthlyRate = apr / 100 / 12;
  if (principal <= 0 || months <= 0) return 0;
  if (monthlyRate === 0) return principal / months;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

function calculateInstallmentPayoff(principal, apr, payment) {
  const monthlyRate = apr / 100 / 12;
  let remaining = principal;
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 1200;

  if (principal <= 0 || payment <= 0) {
    return { months: 0, totalInterest: 0, totalPaid: 0 };
  }

  while (remaining > 0.005 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    const principalPayment = Math.min(payment - interest, remaining);

    if (principalPayment <= 0) {
      return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
    }

    totalInterest += interest;
    remaining -= principalPayment;
    months += 1;
  }

  return {
    months,
    totalInterest,
    totalPaid: principal + totalInterest
  };
}

function minimumCardPayment(principal, apr) {
  const monthlyInterest = principal * (apr / 100 / 12);
  return monthlyInterest + principal * 0.01;
}

function calculateCardPayoff(balance, apr, payment, recalculatesMinimum = false) {
  const monthlyRate = apr / 100 / 12;
  let remaining = balance;
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 1800;

  while (remaining > 0.005 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    const paymentForMonth = recalculatesMinimum ? minimumCardPayment(remaining, apr) : payment;
    const principalPayment = Math.min(paymentForMonth - interest, remaining);

    if (principalPayment <= 0) {
      return { months: Infinity, totalInterest: Infinity };
    }

    totalInterest += interest;
    remaining -= principalPayment;
    months += 1;
  }

  return { months, totalInterest };
}

function payoffMarkerPosition(months) {
  if (!Number.isFinite(months)) return 96;
  if (months <= 60) return 4 + (months / 60) * 31;
  if (months <= 120) return 35 + ((months - 60) / 60) * 30;
  if (months <= 240) return 65 + ((months - 120) / 120) * 31;
  return 96;
}

function interestRiskColor(currentInterest, lowestInterest, highestInterest) {
  if (!Number.isFinite(currentInterest) || highestInterest <= lowestInterest) {
    return { background: "rgba(47, 111, 94, 0.12)", border: "rgba(47, 111, 94, 0.32)", text: "#214f43" };
  }

  const ratio = Math.min(1, Math.max(0, (currentInterest - lowestInterest) / (highestInterest - lowestInterest)));
  const hue = 145 - ratio * 137;
  return {
    background: `hsl(${hue} 62% 92%)`,
    border: `hsl(${hue} 50% 55%)`,
    text: `hsl(${hue} 58% 28%)`
  };
}

function formatPayoffTime(months) {
  if (months === Infinity) return "Never";
  if (months > 240) return "20+ years";
  if (months >= 120) return `${Math.round(months / 12)} years`;
  return `${number.format(months)} months`;
}

function renderFlashcards() {
  const grid = document.querySelector("#flashcardGrid");
  grid.innerHTML = "";

  terms.forEach((item, index) => {
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
      updateCardProgress();
    });

    grid.appendChild(card);
  });

  updateCardProgress();
}

function updateCardProgress() {
  const known = document.querySelectorAll(".flashcard.is-known").length;
  document.querySelector("#cardProgress").textContent = `${known} of ${terms.length} known`;
}

function shuffleFlashcards() {
  for (let i = terms.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [terms[i], terms[j]] = [terms[j], terms[i]];
  }
  renderFlashcards();
}

function shuffledItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function updateInstallmentCalculator() {
  const principal = Number(document.querySelector("#loanAmount").value);
  const apr = Number(document.querySelector("#loanApr").value);
  const months = Number(document.querySelector("#loanTerm").value);
  const monthly = monthlyInstallmentPayment(principal, apr, months);
  const total = monthly * months;
  const interest = total - principal;
  const principalShare = total > 0 ? principal / total : 0;
  const interestShare = total > 0 ? interest / total : 0;

  document.querySelector("#loanAprOut").textContent = percent(apr);
  document.querySelector("#loanTermOut").textContent = `${months} months`;
  document.querySelector("#installmentMonthly").textContent = money(monthly);
  document.querySelector("#installmentTotal").textContent = money(total);
  document.querySelector("#installmentInterest").textContent = money(interest);
  document.querySelector("#installmentPrincipalBar").style.width = `${Math.max(12, principalShare * 100)}%`;
  document.querySelector("#installmentInterestBar").style.width = `${Math.max(12, interestShare * 100)}%`;
}

function updateExtraLoanCalculator(config) {
  const principal = Number(document.querySelector(config.amount).value);
  const apr = Number(document.querySelector(config.apr).value);
  const months = Number(document.querySelector(config.term).value);
  const extraPaymentInput = document.querySelector(config.extraPayment);
  const standardPayment = monthlyInstallmentPayment(principal, apr, months);
  const maxExtra = Math.max(config.minExtraMax, Math.min(config.maxExtraMax, principal * config.maxExtraShare || config.fallbackExtraMax));

  extraPaymentInput.max = maxExtra.toFixed(0);
  if (Number(extraPaymentInput.value) > maxExtra) {
    extraPaymentInput.value = maxExtra.toFixed(0);
  }

  const extraPayment = Number(extraPaymentInput.value);
  const newPayment = standardPayment + extraPayment;
  const standardPayoff = calculateInstallmentPayoff(principal, apr, standardPayment);
  const extraPayoff = calculateInstallmentPayoff(principal, apr, newPayment);
  const interestSaved = Math.max(0, standardPayoff.totalInterest - extraPayoff.totalInterest);
  const interestRatio = standardPayoff.totalInterest > 0 ? extraPayoff.totalInterest / standardPayoff.totalInterest : 0;
  const extraLabel = `Total Interest with ${money(extraPayment)} extra payment`;

  document.querySelector(config.aprOut).textContent = percent(apr);
  document.querySelector(config.termOut).textContent = `${months} months`;
  document.querySelector(config.extraPaymentOut).textContent = `+${money(extraPayment)}`;
  document.querySelector(config.newPayment).textContent = money(newPayment);
  document.querySelector(config.monthsToPayoff).textContent =
    extraPayoff.months === Infinity ? "Never" : `${number.format(extraPayoff.months)} months`;
  document.querySelector(config.interestSaved).textContent = money(interestSaved);
  document.querySelector(config.amountSummary).textContent = money(principal);
  document.querySelector(config.standardInterest).textContent = money(standardPayoff.totalInterest);
  document.querySelector(config.newInterest).textContent = money(extraPayoff.totalInterest);
  document.querySelector(config.withExtraLabel).textContent = extraLabel;
  document.querySelector(config.interestBarLabel).textContent = extraLabel;
  document.querySelector(config.standardInterestBar).style.width = standardPayoff.totalInterest > 0 ? "100%" : "8%";
  document.querySelector(config.extraInterestBar).style.width = `${Math.max(8, interestRatio * 100)}%`;
}

const carExtraConfig = {
  amount: "#carLoanAmount",
  apr: "#carLoanApr",
  term: "#carLoanTerm",
  extraPayment: "#carExtraPayment",
  aprOut: "#carLoanAprOut",
  termOut: "#carLoanTermOut",
  extraPaymentOut: "#carExtraPaymentOut",
  newPayment: "#carNewPayment",
  monthsToPayoff: "#carMonthsToPayoff",
  interestSaved: "#carInterestSaved",
  amountSummary: "#carLoanAmountSummary",
  standardInterest: "#carStandardInterest",
  newInterest: "#carNewInterest",
  withExtraLabel: "#carWithExtraLabel",
  interestBarLabel: "#carInterestBarLabel",
  standardInterestBar: "#carStandardInterestBar",
  extraInterestBar: "#carInterestBar",
  minExtraMax: 250,
  maxExtraMax: 3000,
  fallbackExtraMax: 1000,
  maxExtraShare: 0.2
};

const mortgageExtraConfig = {
  amount: "#mortgageLoanAmount",
  apr: "#mortgageLoanApr",
  term: "#mortgageLoanTerm",
  extraPayment: "#mortgageExtraPayment",
  aprOut: "#mortgageLoanAprOut",
  termOut: "#mortgageLoanTermOut",
  extraPaymentOut: "#mortgageExtraPaymentOut",
  newPayment: "#mortgageNewPayment",
  monthsToPayoff: "#mortgageMonthsToPayoff",
  interestSaved: "#mortgageInterestSaved",
  amountSummary: "#mortgageLoanAmountSummary",
  standardInterest: "#mortgageStandardInterest",
  newInterest: "#mortgageNewInterest",
  withExtraLabel: "#mortgageWithExtraLabel",
  interestBarLabel: "#mortgageInterestBarLabel",
  standardInterestBar: "#mortgageStandardInterestBar",
  extraInterestBar: "#mortgageInterestBar",
  minExtraMax: 500,
  maxExtraMax: 5000,
  fallbackExtraMax: 3000,
  maxExtraShare: 0.04
};

function updateCarExtraCalculator() {
  updateExtraLoanCalculator(carExtraConfig);
}

function updateMortgageExtraCalculator() {
  updateExtraLoanCalculator(mortgageExtraConfig);
}

function updateCardCalculator() {
  const balance = Number(document.querySelector("#cardBalance").value);
  const apr = Number(document.querySelector("#cardApr").value);
  const paymentInput = document.querySelector("#cardPayment");
  const minimum = minimumCardPayment(balance, apr);
  const dynamicMax = Math.max(700, balance, minimum * 2);

  paymentInput.min = minimum.toFixed(2);
  paymentInput.max = dynamicMax.toFixed(2);

  if (Number(paymentInput.value) < minimum) {
    paymentInput.value = minimum.toFixed(2);
  }

  const allowedPayment = Number(paymentInput.value);
  const isMinimumMode = Math.abs(allowedPayment - minimum) < 0.01;
  const payoff = calculateCardPayoff(balance, apr, allowedPayment, isMinimumMode);
  const minimumPayoff = calculateCardPayoff(balance, apr, minimum, true);
  const bestPayoff = calculateCardPayoff(balance, apr, dynamicMax, false);
  const totalPaid = payoff.totalInterest === Infinity ? Infinity : balance + payoff.totalInterest;
  const markerPosition = payoffMarkerPosition(payoff.months);
  const interestColors = interestRiskColor(payoff.totalInterest, bestPayoff.totalInterest, minimumPayoff.totalInterest);
  const interestMetric = document.querySelector("#cardInterestMetric");
  const note = document.querySelector("#cardScenarioNote");

  document.querySelector("#cardAprOut").textContent = percent(apr);
  document.querySelector("#cardPaymentOut").textContent = money(allowedPayment);
  document.querySelector("#minimumPaymentNote").textContent =
    `Minimum Monthly Payment: ${money(minimum)} this month, based on monthly interest plus 1% of the remaining principal. If you pay only minimums, this amount recalculates downward each month.`;
  document.querySelector("#cardMinimumPayment").textContent = money(minimum);
  document.querySelector("#cardPaymentUsedInline").textContent = money(allowedPayment);
  document.querySelector("#cardMonths").textContent = formatPayoffTime(payoff.months);
  document.querySelector("#cardInterest").textContent =
    payoff.totalInterest === Infinity ? "Payment too low" : money(payoff.totalInterest);
  document.querySelector("#cardTotalPaid").textContent =
    totalPaid === Infinity ? "Payment too low" : money(totalPaid);
  document.querySelector("#payoffMarker").style.left = `${markerPosition}%`;
  interestMetric.style.backgroundColor = interestColors.background;
  interestMetric.style.borderColor = interestColors.border;
  interestMetric.style.setProperty("--interest-color", interestColors.text);

  if (isMinimumMode) {
    const years = payoff.months === Infinity ? "many" : Math.round(payoff.months / 12);
    note.textContent = `This shows minimum-payment behavior: the minimum recalculates lower as the principal falls, stretching payoff to about ${years} years in this example.`;
  } else if (payoff.months > 60) {
    note.textContent = "This payoff timeline is long. Try a higher payment to see how much interest drops.";
  } else {
    note.textContent = "Try moving the payment slider and watch Total Interest and Total Paid respond.";
  }
}

function renderMatchingActivity() {
  const termColumn = document.querySelector("#termColumn");
  const definitionColumn = document.querySelector("#definitionColumn");
  const matchedPairs = document.querySelector("#matchedPairs");
  termColumn.innerHTML = "";
  definitionColumn.innerHTML = "";
  matchedPairs.innerHTML = '<p class="empty-match">No matches yet.</p>';
  document.querySelector("#matchingFeedback").textContent = "";
  matchedIds.clear();
  selectedTermId = null;
  selectedDefinitionId = null;

  terms.forEach((item, index) => {
    item.id = `term-${index}`;
  });

  terms.forEach((item) => {
    termColumn.appendChild(createMatchCard(item, "term"));
  });

  shuffledItems(terms).forEach((item) => {
    definitionColumn.appendChild(createMatchCard(item, "definition"));
  });

  updateMatchingScore();
}

function createMatchCard(item, type) {
  const button = document.createElement("button");
  button.className = "match-card";
  button.type = "button";
  button.dataset.id = item.id;
  button.dataset.type = type;
  button.textContent = type === "term" ? item.term : item.definition;
  button.addEventListener("click", () => selectMatch(button));
  return button;
}

function selectMatch(button) {
  if (button.classList.contains("correct")) return;

  const id = button.dataset.id;
  const type = button.dataset.type;
  const selector = `.match-card[data-type="${type}"]`;

  document.querySelectorAll(selector).forEach((card) => {
    card.classList.remove("selected", "incorrect");
  });

  button.classList.add("selected");

  if (type === "term") {
    selectedTermId = id;
  } else {
    selectedDefinitionId = id;
  }

  if (selectedTermId && selectedDefinitionId) {
    checkMatch();
  }
}

function checkMatch() {
  const feedback = document.querySelector("#matchingFeedback");
  const termCard = document.querySelector(`.match-card[data-type="term"][data-id="${selectedTermId}"]`);
  const definitionCard = document.querySelector(`.match-card[data-type="definition"][data-id="${selectedDefinitionId}"]`);
  const matchedItem = terms.find((item) => item.id === selectedTermId);

  if (selectedTermId === selectedDefinitionId) {
    termCard.classList.remove("selected");
    definitionCard.classList.remove("selected");
    termCard.classList.add("correct");
    definitionCard.classList.add("correct");
    termCard.disabled = true;
    definitionCard.disabled = true;
    matchedIds.add(selectedTermId);
    termCard.classList.add("fly-away");
    definitionCard.classList.add("fly-away");
    window.setTimeout(() => {
      addMatchedPair(matchedItem);
      termCard.remove();
      definitionCard.remove();
    }, 220);
    feedback.textContent = "Correct match. The pair moved below.";
  } else {
    termCard.classList.add("incorrect");
    definitionCard.classList.add("incorrect");
    feedback.textContent = "Not a match yet. Click the phrase again, then choose a different definition.";
  }

  selectedTermId = null;
  selectedDefinitionId = null;
  updateMatchingScore();
}

function addMatchedPair(item) {
  if (!item) return;

  const matchedPairs = document.querySelector("#matchedPairs");
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

function updateMatchingScore() {
  const score = document.querySelector("#matchingScore");
  score.textContent = `${matchedIds.size} of ${terms.length} matches`;

  if (matchedIds.size === terms.length) {
    document.querySelector("#matchingFeedback").textContent = "Board complete. Nice work.";
  }
}

function wireEvents() {
  document.querySelector("#shuffleCards").addEventListener("click", shuffleFlashcards);
  document.querySelector("#resetCards").addEventListener("click", renderFlashcards);
  document.querySelector("#resetMatching").addEventListener("click", renderMatchingActivity);
  document.querySelectorAll("#installmentForm input").forEach((input) => {
    input.addEventListener("input", updateInstallmentCalculator);
  });
  document.querySelectorAll("#carExtraForm input").forEach((input) => {
    input.addEventListener("input", updateCarExtraCalculator);
  });
  document.querySelectorAll("#mortgageExtraForm input").forEach((input) => {
    input.addEventListener("input", updateMortgageExtraCalculator);
  });
  document.querySelectorAll("#cardForm input").forEach((input) => {
    input.addEventListener("input", updateCardCalculator);
  });
}

renderFlashcards();
wireEvents();
updateInstallmentCalculator();
updateCarExtraCalculator();
updateMortgageExtraCalculator();
updateCardCalculator();
renderMatchingActivity();
