const creditTerms = [
  {
    term: "Credit Report",
    definition: "A record of credit accounts, balances, payment history, inquiries, and some public-record or collection information."
  },
  {
    term: "Credit Score",
    definition: "A number that estimates credit risk using information from a credit report."
  },
  {
    term: "FICO Score",
    definition: "A widely used credit score brand. Most common FICO scores range from 300 to 850."
  },
  {
    term: "Payment History",
    definition: "Whether payments are made on time. This is the largest public FICO factor category."
  },
  {
    term: "Credit Utilization",
    definition: "The share of available revolving credit currently being used."
  },
  {
    term: "Hard Inquiry",
    definition: "A credit check connected to applying for credit. It can affect scores for a period of time."
  },
  {
    term: "Credit Mix",
    definition: "The variety of account types, such as credit cards, auto loans, student loans, or mortgages."
  },
  {
    term: "Tradeline",
    definition: "An account listed on a credit report, such as a credit card or loan."
  },
  {
    term: "Dispute",
    definition: "A request for a credit bureau to investigate information a consumer believes is inaccurate."
  }
];

const decisions = [
  {
    title: "Pay card balance down $600",
    description: "Utilization improves after the next statement reports.",
    months: 1,
    effect(profile) {
      profile.balance = Math.max(0, profile.balance - 600);
      profile.score += 22;
      return "Maya paid down revolving debt. Utilization improved after the lender reported.";
    }
  },
  {
    title: "Make 6 on-time payments",
    description: "Positive history builds slowly over time.",
    months: 6,
    effect(profile) {
      profile.onTimeStreak += 6;
      profile.ageMonths += 6;
      profile.score += 18;
      return "Six months of on-time payments helped payment history and account age.";
    }
  },
  {
    title: "Miss a payment by 30 days",
    description: "A reported late payment can hurt quickly.",
    months: 1,
    effect(profile) {
      profile.latePayments += 1;
      profile.score -= 72;
      return "A new 30-day late payment was reported. Payment history took a major hit.";
    }
  },
  {
    title: "Open a new card",
    description: "A new inquiry can dip the score, but added limit may help utilization later.",
    months: 1,
    effect(profile) {
      profile.hardInquiries += 1;
      profile.creditLimit += 2500;
      profile.ageMonths = Math.max(6, profile.ageMonths - 4);
      profile.score -= 8;
      return "A new card added available credit, but the inquiry and new account created a short-term dip.";
    }
  },
  {
    title: "Request a credit limit increase",
    description: "If approved without a hard pull, utilization can improve.",
    months: 1,
    effect(profile) {
      profile.creditLimit += 2000;
      profile.score += 15;
      return "The higher credit limit lowered utilization, assuming spending stayed the same.";
    }
  },
  {
    title: "Correct an inaccurate late payment",
    description: "Removing an error can help after the bureau updates the report.",
    months: 2,
    effect(profile) {
      if (profile.latePayments > 0) {
        profile.latePayments -= 1;
        profile.score += 45;
        return "An inaccurate late payment was removed after review.";
      }
      profile.score += 4;
      return "No late payment was available to remove, but reviewing the report was still a good habit.";
    }
  },
  {
    title: "Let inquiries age 12 months",
    description: "Time can reduce the scoring impact of recent credit applications.",
    months: 12,
    effect(profile) {
      profile.hardInquiries = Math.max(0, profile.hardInquiries - 2);
      profile.ageMonths += 12;
      profile.score += 16;
      return "Time passed. Older inquiries mattered less and accounts aged.";
    }
  }
];

const startingProfile = {
  score: 682,
  balance: 2100,
  creditLimit: 5000,
  latePayments: 1,
  hardInquiries: 2,
  ageMonths: 42,
  onTimeStreak: 0,
  month: 0,
  history: ["Month 0: Maya starts with a 682 estimated score."]
};

let profile = { ...startingProfile, history: [...startingProfile.history] };

function clampScore(score) {
  return Math.max(300, Math.min(850, Math.round(score)));
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function renderCreditTerms() {
  const grid = document.querySelector("#creditTermGrid");
  grid.innerHTML = "";

  creditTerms.forEach((item) => {
    const card = document.createElement("article");
    card.className = "credit-term-card";
    card.innerHTML = `
      <strong>${item.term}</strong>
      <span>${item.definition}</span>
    `;
    grid.appendChild(card);
  });
}

function renderDecisions() {
  const grid = document.querySelector("#decisionGrid");
  grid.innerHTML = "";

  decisions.forEach((decision, index) => {
    const button = document.createElement("button");
    button.className = "decision-card";
    button.type = "button";
    button.innerHTML = `
      <strong>${decision.title}</strong>
      <span>${decision.description}</span>
      <em>Shows after ${decision.months} month${decision.months === 1 ? "" : "s"}</em>
    `;
    button.addEventListener("click", () => applyDecision(index));
    grid.appendChild(button);
  });
}

function applyDecision(index) {
  const before = clampScore(profile.score);
  const decision = decisions[index];
  profile.month += decision.months;
  const message = decision.effect(profile);
  profile.score = clampScore(profile.score);
  profile.history.unshift(`Month ${profile.month}: ${message} Score ${before} -> ${profile.score}.`);
  renderProfile(before);
}

function renderProfile(previousScore = profile.score) {
  const score = clampScore(profile.score);
  const utilization = profile.creditLimit > 0 ? Math.round((profile.balance / profile.creditLimit) * 100) : 0;
  const scorePercent = ((score - 300) / 550) * 100;
  const change = score - previousScore;

  document.querySelector("#simScore").textContent = score;
  document.querySelector("#scoreMeterFill").style.width = `${Math.max(4, Math.min(100, scorePercent))}%`;
  document.querySelector("#scoreChange").textContent =
    change === 0 ? "No score movement yet" : `${change > 0 ? "+" : ""}${change} point change from last decision`;
  document.querySelector("#paymentHistory").textContent = `${profile.latePayments} late`;
  document.querySelector("#creditUtilization").textContent = `${utilization}% (${money(profile.balance)} / ${money(profile.creditLimit)})`;
  document.querySelector("#accountAge").textContent = `${(profile.ageMonths / 12).toFixed(1)} yrs`;
  document.querySelector("#hardInquiries").textContent = profile.hardInquiries;
  document.querySelector("#timelineMonth").textContent = `Month ${profile.month}`;

  const timeline = document.querySelector("#timelineList");
  timeline.innerHTML = "";
  profile.history.slice(0, 7).forEach((event) => {
    const item = document.createElement("li");
    item.textContent = event;
    timeline.appendChild(item);
  });
}

function resetScenario() {
  profile = { ...startingProfile, history: [...startingProfile.history] };
  renderProfile(profile.score);
}

renderCreditTerms();
renderDecisions();
renderProfile();
document.querySelector("#resetCreditScenario").addEventListener("click", resetScenario);
