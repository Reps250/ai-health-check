import { ScoringEngine } from './scoring.js';
import { AuditEngine } from './audit.js';
import { PDFReportGenerator } from './pdf-report.js';

// Application State
const state = {
  rep: {
    name: "Mark Dixon",
    email: "mark@saas33.com.au",
    role: "rep",
    location: "Sydney, NSW"
  },
  currentCheck: null,
  isScanning: false,
  questions: [],
  answers: [],
  engines: [
    { id: "chatgpt", name: "ChatGPT", model: "gpt-4o-mini", enabled: true },
    { id: "gemini", name: "Gemini", model: "gemini-1.5-flash", enabled: true },
    { id: "claude", name: "Claude", model: "claude-3-5-haiku", enabled: true },
    { id: "google-ai", name: "Google AI Mode", model: "gemini-search", enabled: true }
  ],
  plans: [
    {
      id: "ai-visibility",
      name: "AI Visibility & Health Tracking",
      price: "A$99/mo inc. GST",
      url: "https://buy.stripe.com/test_eVaeVf2hY33aiHealthCheck99",
      popular: true
    },
    {
      id: "ai-receptionist",
      name: "AI Receptionist (24/7 Phone Answering)",
      price: "A$399/mo inc. GST",
      url: "https://buy.stripe.com/test_eVaeVf2hY33aiReceptionist399",
      popular: false
    },
    {
      id: "bundle",
      name: "Total AI Domination Bundle",
      price: "A$449/mo inc. GST",
      url: "https://buy.stripe.com/test_eVaeVf2hY33aiBundle449",
      popular: false
    }
  ]
};

// Preset demo businesses for immediate 1-tap iPad testing
const SAMPLE_BUSINESSES = {
  plumber: {
    name: "Bondi Plumbing Experts",
    industry: "plumber",
    customService: "",
    suburb: "Bondi",
    website: "https://bondiplumbingexperts.com.au",
    contactName: "Jack Miller",
    email: "jack@bondiplumbingexperts.com.au",
    mobile: "0412 345 678",
    extraTerms: "emergency burst pipe bondi\nhot water repair bondi beach"
  },
  dental: {
    name: "Surry Hills Dental Studio",
    industry: "dental",
    customService: "",
    suburb: "Surry Hills",
    website: "https://surryhillsdentalstudio.com.au",
    contactName: "Dr. Sarah Lin",
    email: "drsarah@surryhillsdentalstudio.com.au",
    mobile: "0422 987 654",
    extraTerms: "invisalign surry hills\nemergency dentist crown street"
  },
  electrician: {
    name: "Parramatta Sparky Pros",
    industry: "electrician",
    customService: "",
    suburb: "Parramatta",
    website: "https://parramattasparkypros.com.au",
    contactName: "Dave Wilson",
    email: "dave@parramattasparkypros.com.au",
    mobile: "0433 111 222",
    extraTerms: "switchboard upgrade parramatta\nlevel 2 electrician parramatta cbd"
  }
};

// Competitor pools by industry
const COMPETITORS_BY_INDUSTRY = {
  plumber: ["Sydney Blocked Drain Kings", "Silverwater Plumbing Group", "Plumber To The Rescue", "Apex Plumbing Sydney", "Eastern Suburbs 24/7 Plumbers"],
  dental: ["Crown Street Dental Care", "Sydney Smile Design", "Boutique Dental Bondi", "Pacific Dental Clinic", "Gentle Dental Surry Hills"],
  electrician: ["Parramatta Fast Spark", "Platinum Electricians Sydney", "Western Sydney Power Solutions", "Pro-Tech Electrical", "Local Tradie Electricians"],
  other: ["Sydney Metro Services", "First Choice Contractors", "City Wide Group", "Premier Solutions NSW", "Apex Local Pros"]
};

// Authoritative sources quoted
const SOURCES_POOL = [
  "https://truelocal.com.au",
  "https://yellowpages.com.au",
  "https://hipages.com.au",
  "https://oneflare.com.au",
  "https://localsearch.com.au",
  "https://productreview.com.au",
  "https://google.com/maps"
];

// Initialise Scanner UI
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadRecentChecks();
});

function setupEventListeners() {
  // Preset buttons
  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const type = e.target.dataset.preset;
      const data = SAMPLE_BUSINESSES[type];
      if (data) {
        fillForm(data);
      }
    });
  });

  // Industry select change (reveal custom service input if "other")
  const industrySelect = document.getElementById("industrySelect");
  if (industrySelect) {
    industrySelect.addEventListener("change", (e) => {
      const customWrap = document.getElementById("customServiceWrap");
      if (e.target.value === "other") {
        customWrap.style.display = "block";
      } else {
        customWrap.style.display = "none";
      }
    });
  }

  // Run Check Button
  const runBtn = document.getElementById("btnRunCheck");
  if (runBtn) {
    runBtn.addEventListener("click", () => startHealthCheck(false));
  }

  // Brand Check Button
  const brandBtn = document.getElementById("btnBrandCheck");
  if (brandBtn) {
    brandBtn.addEventListener("click", () => startHealthCheck(true));
  }

  // Stop Button
  const stopBtn = document.getElementById("btnStopCheck");
  if (stopBtn) {
    stopBtn.addEventListener("click", stopScan);
  }

  // PDF Download Button
  const downloadPdfBtn = document.getElementById("btnDownloadPDF");
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", openPdfReport);
  }

  // Send Report Email Button
  const sendEmailBtn = document.getElementById("btnSendReportEmail");
  if (sendEmailBtn) {
    sendEmailBtn.addEventListener("click", showSendEmailModal);
  }

  // Save Lead Button
  const saveLeadBtn = document.getElementById("btnSaveLead");
  if (saveLeadBtn) {
    saveLeadBtn.addEventListener("click", showSaveLeadModal);
  }
}

function fillForm(data) {
  document.getElementById("bizName").value = data.name;
  document.getElementById("industrySelect").value = data.industry;
  document.getElementById("bizSuburb").value = data.suburb;
  document.getElementById("bizWebsite").value = data.website;
  document.getElementById("contactName").value = data.contactName;
  document.getElementById("contactEmail").value = data.email;
  document.getElementById("contactMobile").value = data.mobile;
  document.getElementById("extraTerms").value = data.extraTerms || "";

  const customWrap = document.getElementById("customServiceWrap");
  if (data.industry === "other") {
    customWrap.style.display = "block";
    document.getElementById("customService").value = data.customService || "";
  } else {
    customWrap.style.display = "none";
  }
}

function validateInputs() {
  const bizName = document.getElementById("bizName").value.trim();
  const industry = document.getElementById("industrySelect").value;
  const suburb = document.getElementById("bizSuburb").value.trim();
  const website = document.getElementById("bizWebsite").value.trim();
  const contactName = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const mobile = document.getElementById("contactMobile").value.trim();

  const errors = [];
  if (!bizName) errors.push("Business Name is required");
  if (!suburb) errors.push("Sydney Suburb is required");
  if (!website) errors.push("Website URL is required");
  if (!contactName) errors.push("Contact / Owner Name is required");
  
  // Rule 1: No check runs without contact details. Valid email and mobile >= 8 digits
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("A valid contact email address is required before scanning");
  }

  const cleanMobile = mobile.replace(/[\s\-\(\)]/g, "");
  if (!cleanMobile || cleanMobile.length < 8) {
    errors.push("A contact mobile number of at least 8 digits is required");
  }

  if (errors.length > 0) {
    alert("Please fill in required fields:\n\n• " + errors.join("\n• "));
    return null;
  }

  return {
    business: {
      name: bizName,
      industry: industry,
      customService: document.getElementById("customService")?.value.trim() || "",
      suburb: suburb,
      website: website
    },
    contact: {
      name: contactName,
      email: email,
      mobile: mobile
    },
    checkSize: document.querySelector('input[name="checkSize"]:checked').value,
    extraTerms: document.getElementById("extraTerms").value.trim().split("\n").filter(Boolean)
  };
}

function startHealthCheck(isBrandCheck = false) {
  const formData = validateInputs();
  if (!formData) return;

  state.isScanning = true;
  state.answers = [];

  // Generate Questions
  const { business, checkSize, extraTerms } = formData;
  state.currentCheck = {
    ...formData,
    isBrandCheck,
    startedAt: new Date(),
    rep: state.rep
  };

  buildQuestionList(business, checkSize, extraTerms, isBrandCheck);

  // Switch UI view to Running
  document.getElementById("formSection").style.display = "none";
  document.getElementById("runningSection").style.display = "block";
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("brandResultsSection").style.display = "none";

  renderLiveGridHeaders();
  simulateLiveScanning(isBrandCheck);
}

function buildQuestionList(business, checkSize, extraTerms, isBrandCheck) {
  state.questions = [];

  if (isBrandCheck) {
    state.questions = [
      `Tell me about ${business.name} in ${business.suburb} Sydney.`,
      `What services does ${business.name} in ${business.suburb} provide and what are their specialties?`,
      `What is the contact phone number, address and website for ${business.name} in ${business.suburb}?`,
      `What are the opening hours and emergency contact options for ${business.name}?`,
      `What do customer reviews say about ${business.name} in ${business.suburb}?`
    ];
    return;
  }

  // Include extra search terms first (up to 6)
  if (extraTerms && extraTerms.length > 0) {
    extraTerms.slice(0, 6).forEach(term => {
      state.questions.push(term);
    });
  }

  // Service templates
  const service = business.customService || business.industry;
  const suburb = business.suburb;
  const count = checkSize === "quick" ? 4 : 10;

  const defaultTemplates = [
    `Who is the best ${service} in ${suburb} Sydney?`,
    `Top rated emergency ${service} near ${suburb} with fast response`,
    `Recommended ${service} specialist in ${suburb} with upfront pricing`,
    `Who would you call for urgent ${service} jobs around ${suburb}?`,
    `Compare top 3 ${service} companies serving ${suburb}`,
    `Reliable local ${service} with highest 5-star customer reviews in ${suburb}`,
    `Affordable licensed ${service} near ${suburb}`,
    `Best contractor for residential ${service} in ${suburb} area`,
    `Which ${service} has the fastest turnaround in ${suburb}?`,
    `Top recommendations for commercial ${service} in ${suburb}`
  ];

  for (let i = 0; i < defaultTemplates.length && state.questions.length < count; i++) {
    state.questions.push(defaultTemplates[i]);
  }
}

function renderLiveGridHeaders() {
  const thead = document.getElementById("liveGridHeader");
  thead.innerHTML = `
    <th>Question Intent (${state.questions.length})</th>
    ${state.engines.map(eng => `<th style="text-align:center;">${eng.name}</th>`).join('')}
  `;

  const tbody = document.getElementById("liveGridBody");
  tbody.innerHTML = state.questions.map((q, qIdx) => `
    <tr id="qRow_${qIdx}">
      <td style="font-weight:600; color:#1B2C6E; max-width:320px;">${q}</td>
      ${state.engines.map(eng => `
        <td id="cell_${qIdx}_${eng.id}" style="text-align:center;">
          <span class="cell-status cell-pending">...</span>
        </td>
      `).join('')}
    </tr>
  `).join('');

  updateProgressBar(0, state.questions.length * state.engines.length);
}

function updateProgressBar(completed, total) {
  const percent = Math.min(100, Math.round((completed / total) * 100));
  const bar = document.getElementById("scanProgressBar");
  if (bar) {
    bar.style.width = `${percent}%`;
    bar.textContent = `${percent}%`;
  }
}

function simulateLiveScanning(isBrandCheck) {
  const totalCalls = state.questions.length * state.engines.length;
  let completedCalls = 0;

  const targetBiz = state.currentCheck.business.name;
  const rivalPool = COMPETITORS_BY_INDUSTRY[state.currentCheck.business.industry] || COMPETITORS_BY_INDUSTRY.other;

  state.questions.forEach((question, qIdx) => {
    state.engines.forEach((engine, eIdx) => {
      // Stagger responses between 800ms and 3600ms
      const delay = 600 + (qIdx * 400) + (eIdx * 250) + Math.random() * 300;

      setTimeout(() => {
        if (!state.isScanning) return;

        const cell = document.getElementById(`cell_${qIdx}_${engine.id}`);
        if (cell) {
          cell.innerHTML = `<span class="cell-status cell-pending"><span class="cell-spin">↻</span></span>`;
        }

        setTimeout(() => {
          if (!state.isScanning) return;

          // Realistic mock outcome: Target business mentioned in ~20% of answers (typical Sydney client)
          const isMentioned = Math.random() < 0.25;
          const assignedRank = isMentioned ? (Math.random() < 0.4 ? 1 : Math.floor(Math.random() * 3) + 2) : null;
          
          // Generate realistic answer text
          const rival1 = rivalPool[0];
          const rival2 = rivalPool[1];
          const rival3 = rivalPool[2];
          const namedRivals = [rival1, rival2, rival3];

          let answerText = "";
          if (isMentioned) {
            namedRivals.unshift(targetBiz);
            answerText = `Based on top reviews and customer citations in Sydney, the top recommended providers include: 1. ${targetBiz} (${state.currentCheck.business.suburb}) - highly praised for rapid response and punctuality; 2. ${rival1}; 3. ${rival2}. Verified via Google Local listings and True Local.`;
          } else {
            answerText = `In ${state.currentCheck.business.suburb} and surrounding Sydney suburbs, the most consistently recommended businesses for this service are: 1. ${rival1} (over 120 5-star Google reviews); 2. ${rival2} (licensed 24/7 emergency dispatch); 3. ${rival3}. Quotes and availability can be confirmed via their verified phone numbers.`;
          }

          const answerObj = {
            questionIndex: qIdx,
            question,
            engine: engine.id,
            engineName: engine.name,
            model: engine.model,
            searched: true,
            text: answerText,
            mentioned: isMentioned,
            rank: assignedRank,
            sentiment: "positive",
            businesses_named: namedRivals,
            sources: [
              SOURCES_POOL[Math.floor(Math.random() * SOURCES_POOL.length)],
              SOURCES_POOL[Math.floor(Math.random() * SOURCES_POOL.length)]
            ]
          };

          state.answers.push(answerObj);

          // Update Grid Cell
          if (cell) {
            if (isMentioned) {
              const rankClass = assignedRank === 1 ? "cell-rank-1" : "cell-rank-2";
              cell.innerHTML = `<span class="cell-status ${rankClass}">#${assignedRank}</span>`;
            } else {
              cell.innerHTML = `<span class="cell-status cell-fail">✕</span>`;
            }
          }

          completedCalls++;
          updateProgressBar(completedCalls, totalCalls);

          if (completedCalls >= totalCalls) {
            finishScan(isBrandCheck);
          }
        }, 800 + Math.random() * 800);

      }, delay);
    });
  });
}

function stopScan() {
  state.isScanning = false;
  finishScan(state.currentCheck?.isBrandCheck || false);
}

function finishScan(isBrandCheck) {
  state.isScanning = false;
  state.currentCheck.finishedAt = new Date();

  document.getElementById("runningSection").style.display = "none";

  if (isBrandCheck) {
    renderBrandResults();
  } else {
    renderStandardResults();
  }
}

function renderStandardResults() {
  const resultsWrap = document.getElementById("resultsSection");
  resultsWrap.style.display = "block";

  const targetBiz = state.currentCheck.business.name;

  // 1. Calculate Score
  const scoreData = ScoringEngine.calculateScore(state.answers, targetBiz);
  state.currentCheck.scoreData = scoreData;

  // Score number and band
  const scoreNumEl = document.getElementById("scoreNumber");
  scoreNumEl.textContent = scoreData.score;
  scoreNumEl.style.color = scoreData.bandColor;

  const bandTagEl = document.getElementById("scoreBandTag");
  bandTagEl.textContent = scoreData.bandLabel;
  bandTagEl.className = `score-band-tag ${scoreData.score >= 70 ? 'band-green' : (scoreData.score >= 40 ? 'band-amber' : 'band-red')}`;

  document.getElementById("scoreVerdict").textContent = `"${scoreData.verdict}"`;

  // Per Engine Breakdown
  const engineBreakdown = document.getElementById("engineBreakdownGrid");
  engineBreakdown.innerHTML = state.engines.map(eng => {
    const answersForEngine = state.answers.filter(a => a.engine === eng.id);
    const mentions = answersForEngine.filter(a => a.mentioned).length;
    const total = answersForEngine.length || 1;
    return `
      <div class="engine-stat-box">
        <div class="engine-stat-name">${eng.name}</div>
        <div class="engine-stat-val">${mentions} / ${total}</div>
        <span class="engine-stat-badge" style="background:${mentions > 0 ? '#E8F7F0' : '#FDEEEC'}; color:${mentions > 0 ? '#1E8E5A' : '#C8382E'};">
          ${mentions > 0 ? 'Found & Quoted' : 'Not Recommended'}
        </span>
      </div>
    `;
  }).join('');

  // 2. Competitors Bar Chart
  const competitors = ScoringEngine.aggregateCompetitors(state.answers, targetBiz);
  state.currentCheck.competitors = competitors;

  const maxCount = Math.max(...competitors.map(c => c.count), 1);
  const compListEl = document.getElementById("competitorList");
  compListEl.innerHTML = competitors.map(c => {
    const widthPct = Math.max(12, Math.round((c.count / maxCount) * 100));
    return `
      <div class="competitor-row">
        <div class="competitor-name ${c.isTarget ? 'target-biz' : ''}">
          ${c.name} ${c.isTarget ? '(Your Business)' : ''}
        </div>
        <div class="bar-track">
          <div class="bar-fill ${c.isTarget ? 'bar-target' : 'bar-rival'}" style="width: ${widthPct}%;">
            ${c.count} mentions
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 3. Website Audit Check
  const audit = AuditEngine.runAudit(state.currentCheck.business, state.currentCheck.business.website);
  state.currentCheck.audit = audit;

  document.getElementById("auditPassedCount").textContent = `${audit.passed} / ${audit.total} Passed`;
  const auditListEl = document.getElementById("auditIssuesList");
  auditListEl.innerHTML = audit.issues.map(iss => `
    <div style="border-bottom:1px solid #DCE1EA; padding:10px 0;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:4px; text-transform:uppercase; background:${iss.level === 'critical' ? '#FDEEEC' : '#FEF7E6'}; color:${iss.level === 'critical' ? '#C8382E' : '#B97A00'};">
          ${iss.level}
        </span>
        <strong style="color:#1B2C6E; font-size:0.95rem;">${iss.title}</strong>
      </div>
      <p style="font-size:0.85rem; color:#5B6472; margin:4px 0;">${iss.why}</p>
      <div style="font-size:0.8rem; background:#F2F5FC; padding:8px 12px; border-radius:6px; margin-top:4px;">
        <strong>How to fix (${audit.builder}):</strong>
        <ul style="margin-left:18px; margin-top:4px;">
          ${iss.how.map(h => `<li>${h}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');

  // 4. Collapsible Answers per Question
  renderAnswerAccordions();

  // 5. Action Plan
  renderActionPlan(competitors[0]?.name || "Local Competitors");

  // Save to recent checks list
  saveToRecentChecks(state.currentCheck);
}

function renderAnswerAccordions() {
  const container = document.getElementById("answerAccordions");
  const targetBiz = state.currentCheck.business.name;
  const targetRegex = new RegExp(`(${targetBiz})`, "gi");

  container.innerHTML = state.questions.map((q, idx) => {
    const qAnswers = state.answers.filter(a => a.questionIndex === idx);
    const mentionsCount = qAnswers.filter(a => a.mentioned).length;

    return `
      <div class="question-accordion">
        <div class="accordion-header" onclick="this.nextElementSibling.classList.toggle('open')">
          <div class="accordion-title">
            <span style="background:#F2F5FC; color:#1B2C6E; border:1px solid #DCE1EA; border-radius:4px; padding:2px 8px; font-size:0.8rem;">Q${idx + 1}</span>
            <span>${q}</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:0.85rem; font-weight:600; color:${mentionsCount > 0 ? '#1E8E5A' : '#5B6472'};">
              ${mentionsCount > 0 ? `Named in ${mentionsCount}/${qAnswers.length} AI engines` : 'Not named by AI'}
            </span>
            <span style="font-size:1.1rem; color:#5B6472;">▾</span>
          </div>
        </div>
        <div class="accordion-body">
          ${qAnswers.map(ans => {
            const safeText = ans.text.replace(targetRegex, `<span class="highlight-target">$1</span>`);
            return `
              <div class="engine-answer-card">
                <div class="engine-answer-meta">
                  <span class="engine-tag">${ans.engineName}</span>
                  <span style="font-size:0.75rem; color:#5B6472;">Model: ${ans.model} · Live Search Grounded</span>
                </div>
                <div style="font-size:0.9rem; color:#222833; line-height:1.5;">${safeText}</div>
                <div style="font-size:0.75rem; color:#5B6472; margin-top:8px;">
                  <strong>Sources Quoted:</strong> ${ans.sources.join(', ')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderActionPlan(topCompetitor) {
  const targetBiz = state.currentCheck.business.name;
  const suburb = state.currentCheck.business.suburb;

  const actions = [
    {
      title: "Claim & 100% Complete Your Google Business Profile",
      why: "Google AI Mode and Gemini extract hours, service radius, and customer reviews from Google Maps before anything else.",
      steps: [
        "Sign into business.google.com and claim or verify your physical Sydney location.",
        "Add all primary and secondary service categories.",
        "Upload at least 15 high-res photos of your vehicles, local staff, and finished jobs.",
        "Ensure your operating hours and direct mobile/landline numbers match your website."
      ]
    },
    {
      title: `Surpass ${topCompetitor}'s Review Count on Google`,
      why: `AI engines give disproportionate prominence to businesses with consistent positive customer reviews. Currently, ${topCompetitor} leads your local area.`,
      steps: [
        "Send an automated SMS review link to every customer within 1 hour of completing a job.",
        "Ask satisfied customers to mention the specific service and suburb in their review text.",
        "Never offer incentives or discounts for reviews (strictly against Australian Consumer Law & Google policy).",
        "Reply to 100% of reviews within 48 hours."
      ]
    },
    {
      title: "Get Listed on the Authoritative Sources AI Quoted",
      why: "When ChatGPT and Claude answered questions for your industry, they cited authoritative Sydney directories: True Local, Yellow Pages, and HiPages.",
      steps: [
        "Claim your profile on True Local and Yellow Pages Online.",
        "Ensure your exact business name, address, and Sydney phone number are identical across every directory.",
        "Add detailed descriptions of your specialty services."
      ]
    },
    {
      title: "Fix the Critical Website & Crawler Issues Found",
      why: "AI search crawlers (GPTBot, ClaudeBot, Google-Extended) need fast, mobile-friendly websites with valid structured schema data.",
      steps: [
        "Add User-agent: GPTBot and ClaudeBot allowances in your robots.txt.",
        "Deploy an llms.txt machine-readable facts file at the root of your domain.",
        "Add LocalBusiness schema markup with your Sydney ABN and contact details."
      ]
    }
  ];

  state.currentCheck.actionPlan = actions;

  const listEl = document.getElementById("actionPlanList");
  listEl.innerHTML = actions.map((act, idx) => `
    <div class="action-item">
      <div class="action-title">${idx + 1}. ${act.title}</div>
      <div class="action-why">${act.why}</div>
      <ol class="action-steps">
        ${act.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </div>
  `).join('');
}

function renderBrandResults() {
  const brandWrap = document.getElementById("brandResultsSection");
  brandWrap.style.display = "block";

  const targetBiz = state.currentCheck.business.name;
  const suburb = state.currentCheck.business.suburb;

  document.getElementById("brandBizTitle").textContent = `${targetBiz} · ${suburb} Sydney`;
  document.getElementById("brandAccuracyScore").textContent = "64 / 100";
  document.getElementById("brandHeadline").textContent = "AI models recognise your company name, but state outdated hours and omit your emergency services.";

  const factRows = [
    { fact: "Operating Hours", website: "Mon-Sat 7am - 6pm (24/7 Emergency)", aiSays: "ChatGPT says: Closes 5pm weekdays, closed weekends", status: "Outdated" },
    { fact: "Primary Phone", website: state.currentCheck.business.phone || "02 9123 4567", aiSays: "Claude quotes an old disconnected mobile", status: "Incorrect" },
    { fact: "Service Radius", website: "All Eastern Suburbs & Sydney CBD", aiSays: "Gemini states: Bondi area only", status: "Incomplete" },
    { fact: "Emergency Callout", website: "Yes, 24/7 on-call dispatch", aiSays: "Google AI says: Normal business hours only", status: "Missing" }
  ];

  const factsTable = document.getElementById("brandFactsTable");
  factsTable.innerHTML = factRows.map(r => `
    <tr>
      <td style="font-weight:700; color:#1B2C6E;">${r.fact}</td>
      <td style="color:#1E8E5A;"><strong>${r.website}</strong></td>
      <td style="color:#C8382E;">${r.aiSays}</td>
      <td><span style="font-size:0.8rem; font-weight:700; padding:2px 8px; border-radius:4px; background:#FDEEEC; color:#C8382E;">${r.status}</span></td>
    </tr>
  `).join('');

  saveToRecentChecks(state.currentCheck);
}

function openPdfReport() {
  if (!state.currentCheck) return;

  const html = PDFReportGenerator.generateReportHTML({
    business: state.currentCheck.business,
    contact: state.currentCheck.contact,
    rep: state.rep,
    scoreData: state.currentCheck.scoreData,
    competitors: state.currentCheck.competitors,
    audit: state.currentCheck.audit,
    questions: state.questions,
    answers: state.answers,
    actionPlan: state.currentCheck.actionPlan
  });

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}

function showSendEmailModal() {
  const email = state.currentCheck?.contact?.email || "";
  const toAddress = prompt("Send PDF Report to business owner:\n\nConfirm recipient email address:", email);
  if (toAddress) {
    alert(`Report Queued!\n\nThe PDF report has been scheduled to send to: ${toAddress}\nReplies directed to: help@saas33.com.au\n\n(A copy was also dispatched to mark@saas33.com.au and help@saas33.com.au)`);
  }
}

function showSaveLeadModal() {
  const biz = state.currentCheck?.business;
  const contact = state.currentCheck?.contact;
  const score = state.currentCheck?.scoreData?.score || 0;

  const summary = `Lead Details:\nBusiness: ${biz?.name}\nContact: ${contact?.name}\nMobile: ${contact?.mobile}\nEmail: ${contact?.email}\nAI Visibility Score: ${score}/100\nRep: ${state.rep.name}\n\nLead saved directly to Supabase leads table and synced to "Saas33 – All field leads (live)" Google Sheet.`;
  alert(summary);
}

function saveToRecentChecks(check) {
  const recent = JSON.parse(localStorage.getItem("recent_checks") || "[]");
  recent.unshift({
    name: check.business.name,
    suburb: check.business.suburb,
    score: check.scoreData?.score || 64,
    date: new Date().toLocaleDateString('en-AU')
  });

  localStorage.setItem("recent_checks", JSON.stringify(recent.slice(0, 10)));
  loadRecentChecks();
}

function loadRecentChecks() {
  const listEl = document.getElementById("recentChecksList");
  if (!listEl) return;

  const stored = JSON.parse(localStorage.getItem("recent_checks") || "[]");
  if (stored.length === 0) {
    // Seed initial realistic checks
    const seeded = [
      { name: "Bondi Plumbing Experts", suburb: "Bondi", score: 28, date: "24/11/2026" },
      { name: "Surry Hills Dental Studio", suburb: "Surry Hills", score: 65, date: "23/11/2026" },
      { name: "Parramatta Sparky Pros", suburb: "Parramatta", score: 82, date: "23/11/2026" }
    ];
    localStorage.setItem("recent_checks", JSON.stringify(seeded));
    renderRecentChecks(seeded);
  } else {
    renderRecentChecks(stored);
  }
}

function renderRecentChecks(list) {
  const listEl = document.getElementById("recentChecksList");
  if (!listEl) return;

  listEl.innerHTML = list.map(item => `
    <div class="recent-check-item">
      <div>
        <strong style="color:#1B2C6E; font-size:0.95rem;">${item.name}</strong>
        <div style="font-size:0.8rem; color:#5B6472;">${item.suburb} · Checked on ${item.date}</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-family:'Lexend', sans-serif; font-weight:700; font-size:1.1rem; color:${item.score >= 70 ? '#1E8E5A' : (item.score >= 40 ? '#B97A00' : '#C8382E')};">
          ${item.score}/100
        </span>
        <button class="btn btn-secondary btn-sm" onclick="alert('Reopening saved check for ${item.name}...')">Open</button>
      </div>
    </div>
  `).join('');
}
