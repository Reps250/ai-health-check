/**
 * Ai Health Check - PDF Report Generator
 * Section 8: Saas33 branded report generator
 * Designed for immediate rendering and clean printing / PDF export on iPad Safari
 */

export const PDFReportGenerator = {
  generateReportHTML(data) {
    const { business, contact, rep, scoreData, competitors, audit, questions, answers, actionPlan } = data;
    const today = new Date();
    const dateFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    const timeFormatted = today.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit' });

    const bandClass = scoreData.band === 'green' ? 'score-green' : (scoreData.band === 'amber' ? 'score-amber' : 'score-red');
    const bandColor = scoreData.bandColor || '#C8382E';

    return `
<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">
  <title>AI Health Check – ${business.name} – ${dateFormatted.replace(/\//g, '.')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 20mm 15mm;
    }
    body {
      font-family: 'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #222833;
      background: #FFFFFF;
      margin: 0;
      padding: 20px;
      line-height: 1.45;
      font-size: 13px;
    }
    h1, h2, h3, h4 {
      font-family: 'Lexend', -apple-system, sans-serif;
      color: #1B2C6E;
      margin-top: 0;
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1B2C6E;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand-logo {
      font-family: 'Lexend', sans-serif;
      font-weight: 800;
      font-size: 20px;
      color: #1B2C6E;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .brand-logo span {
      background-color: #1B2C6E;
      color: #FFF;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 14px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #5B6472;
    }
    .cover-card {
      background: #F2F5FC;
      border: 1.5px solid #DCE1EA;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .score-circle {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      border: 6px solid ${bandColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FFF;
      text-align: center;
    }
    .score-num {
      font-family: 'Lexend', sans-serif;
      font-size: 38px;
      font-weight: 800;
      color: ${bandColor};
      line-height: 1;
    }
    .score-label {
      font-size: 9px;
      font-weight: 700;
      color: #5B6472;
      text-transform: uppercase;
    }
    .verdict-box {
      flex: 1;
      padding-left: 24px;
    }
    .verdict-text {
      font-size: 16px;
      font-weight: 700;
      color: #1B2C6E;
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      border-bottom: 1.5px solid #DCE1EA;
      padding-bottom: 6px;
      margin: 22px 0 12px;
      color: #1B2C6E;
    }
    .rival-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .rival-table th, .rival-table td {
      padding: 8px 10px;
      border: 1px solid #DCE1EA;
      text-align: left;
      font-size: 12px;
    }
    .rival-table th {
      background: #F2F5FC;
      font-weight: 700;
      color: #1B2C6E;
    }
    .target-highlight {
      background: #FFF3A8;
      font-weight: bold;
    }
    .audit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    .audit-item {
      border: 1px solid #DCE1EA;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 11px;
    }
    .badge-critical { color: #C8382E; font-weight: bold; }
    .badge-high { color: #B97A00; font-weight: bold; }
    .action-step-card {
      border-left: 4px solid #2E52CE;
      background: #FAFBFD;
      border-top: 1px solid #DCE1EA;
      border-right: 1px solid #DCE1EA;
      border-bottom: 1px solid #DCE1EA;
      padding: 12px 14px;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
    }
    .action-step-title {
      font-weight: 700;
      font-size: 13px;
      color: #1B2C6E;
      margin-bottom: 4px;
    }
    .action-step-why {
      font-size: 11.5px;
      color: #5B6472;
      margin-bottom: 6px;
    }
    .report-footer {
      margin-top: 30px;
      border-top: 1.5px solid #DCE1EA;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #5B6472;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#2E52CE; color:#FFF; padding:12px 20px; border-radius:6px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
    <span><strong>PDF Report Ready</strong> – Use browser Print or Save as PDF</span>
    <button onclick="window.print()" style="background:#FFF; color:#1B2C6E; border:none; padding:8px 16px; border-radius:4px; font-weight:700; cursor:pointer;">Print / Save to PDF</button>
  </div>

  <div class="report-header">
    <div>
      <div class="brand-logo">Saas33 <span>Ai Health Check</span></div>
      <div style="font-size:11px; color:#5B6472; margin-top:2px;">Get Found on AI · aihealthcheck.com.au</div>
    </div>
    <div class="meta-box">
      <div><strong>Prepared for:</strong> ${contact.name} (${contact.email})</div>
      <div><strong>Business:</strong> ${business.name} · ${business.suburb} Sydney</div>
      <div><strong>Prepared by:</strong> ${rep.name} (Saas33 Sydney)</div>
      <div><strong>Date:</strong> ${dateFormatted} at ${timeFormatted} Sydney Time</div>
    </div>
  </div>

  <div class="cover-card">
    <div class="score-circle">
      <div class="score-num">${scoreData.score}</div>
      <div class="score-label">Score / 100</div>
    </div>
    <div class="verdict-box">
      <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:${bandColor}; margin-bottom:4px;">${scoreData.bandLabel}</div>
      <div class="verdict-text">"${scoreData.verdict}"</div>
      <div style="font-size:11.5px; color:#5B6472;">
        Based on multi-engine analysis across ChatGPT, Google Gemini, Claude and Google AI Mode.
      </div>
    </div>
  </div>

  <h2 class="section-title">1. Who AI Recommends Instead in ${business.suburb}</h2>
  <p style="font-size:11.5px; color:#5B6472; margin-bottom:8px;">Frequency of recommendations when prospective customers search for ${business.industry} in your local Sydney service radius:</p>
  <table class="rival-table">
    <thead>
      <tr>
        <th>Local Business Name</th>
        <th style="width:120px;">AI Mentions</th>
        <th>Market Share Status</th>
      </tr>
    </thead>
    <tbody>
      ${competitors.map(c => `
        <tr class="${c.isTarget ? 'target-highlight' : ''}">
          <td><strong>${c.name}</strong> ${c.isTarget ? ' (Your Business)' : ''}</td>
          <td>${c.count} mentions</td>
          <td>${c.isTarget ? (c.count > 0 ? 'Recognised' : 'Missing from Recommendations') : 'Primary Local Competitor'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2 class="section-title">2. Website & AI Crawler Audit (${audit.passed}/${audit.total} Passed)</h2>
  <div class="audit-grid">
    ${audit.issues.map(iss => `
      <div class="audit-item">
        <span class="${iss.level === 'critical' ? 'badge-critical' : 'badge-high'}">[${iss.level.toUpperCase()}]</span>
        <strong>${iss.title}</strong>
        <div style="color:#5B6472; margin-top:3px;">${iss.why}</div>
      </div>
    `).join('')}
  </div>

  <h2 class="section-title">3. What To Do Next (Prioritised Action Plan)</h2>
  ${actionPlan.map((act, idx) => `
    <div class="action-step-card">
      <div class="action-step-title">${idx + 1}. ${act.title}</div>
      <div class="action-step-why">${act.why}</div>
      <ol style="margin:4px 0 0 18px; padding:0; font-size:11px;">
        ${act.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </div>
  `).join('')}

  <div class="report-footer">
    <div>aihealthcheck.com.au · help@saas33.com.au · Saas33 Sydney NSW</div>
    <div>Page 1 of 2 · Confidential Report for ${business.name}</div>
  </div>
</body>
</html>
    `;
  }
};
