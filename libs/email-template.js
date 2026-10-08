const SITE = "https://floralawn-and-landscaping.com";

export const BRAND = {
  navy: "#1B2838",
  green: "#2F6B4F",
  gold: "#E8C547",
  page: "#F3F6F4",
  line: "#DDE5DF",
  muted: "#5C6B62",
  red: "#991B1B",
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

export function emailLayout({ preheader = "", body, footerNote = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Flora Lawn</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.page};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid ${BRAND.line};">
        <tr>
          <td style="padding:20px 28px;border-bottom:4px solid ${BRAND.gold};">
            <a href="${SITE}" style="text-decoration:none;">
              <img src="${SITE}/flora-logo-final.png" alt="Flora Lawn &amp; Landscaping" width="132" style="display:block;width:132px;height:auto;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;font-family:${FONT};color:${BRAND.navy};font-size:15px;line-height:1.6;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;background:${BRAND.navy};font-family:${FONT};font-size:12px;line-height:1.7;color:#C9D4CC;">
            ${footerNote ? `<p style="margin:0 0 8px 0;color:#ffffff;">${footerNote}</p>` : ""}
            Flora Lawn &amp; Landscaping Inc &middot; 45 Vernon St, Pawtucket, RI 02860<br>
            <a href="tel:4013890913" style="color:#ffffff;text-decoration:none;">(401) 389-0913</a> &middot;
            <a href="mailto:floralawncareri@gmail.com" style="color:#ffffff;text-decoration:none;">floralawncareri@gmail.com</a> &middot;
            <a href="${SITE}" style="color:${BRAND.gold};text-decoration:none;">floralawn-and-landscaping.com</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export function heading(title, sub = "") {
  return `<h1 style="margin:0;font-size:26px;line-height:1.2;font-weight:700;color:${BRAND.navy};">${escapeHtml(title)}</h1>${
    sub ? `<p style="margin:8px 0 0 0;color:${BRAND.muted};font-size:15px;">${sub}</p>` : ""
  }`;
}

export function paragraph(html) {
  return `<p style="margin:16px 0 0 0;">${html}</p>`;
}

export function textBlock(text) {
  return `<p style="margin:16px 0 0 0;">${nl2br(text)}</p>`;
}

export function button(href, label, variant = "primary") {
  const styles = {
    primary: `background:${BRAND.green};color:#ffffff;border:1px solid ${BRAND.green};`,
    dark: `background:${BRAND.navy};color:#ffffff;border:1px solid ${BRAND.navy};`,
    gold: `background:${BRAND.gold};color:${BRAND.navy};border:1px solid ${BRAND.gold};`,
    outline: `background:#ffffff;color:${BRAND.navy};border:1px solid ${BRAND.navy};`,
  };
  return `<a href="${escapeHtml(href)}" style="display:inline-block;${styles[variant] || styles.primary}padding:12px 18px;font-weight:700;font-size:14px;text-decoration:none;margin:0 8px 8px 0;">${escapeHtml(label)}</a>`;
}

export function buttonRow(buttons) {
  return `<div style="margin-top:20px;">${buttons.filter(Boolean).join("")}</div>`;
}

export function chips(items) {
  if (!items?.length) return "";
  return `<div style="margin-top:12px;">${items
    .map(
      (item) =>
        `<span style="display:inline-block;margin:0 6px 6px 0;padding:6px 12px;background:#EEF4F0;border:1px solid #C9D4CC;color:${BRAND.green};font-size:13px;font-weight:700;">${escapeHtml(item)}</span>`
    )
    .join("")}</div>`;
}

export function detailsTable(rows) {
  const visible = rows.filter((row) => row && row.value);
  if (!visible.length) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${visible
    .map(
      (row) => `<tr>
        ${
          row.label
            ? `<td style="padding:9px 12px 9px 0;border-top:1px solid ${BRAND.line};width:38%;vertical-align:top;color:${BRAND.muted};font-size:13px;">${escapeHtml(row.label)}</td>
        <td style="padding:9px 0;border-top:1px solid ${BRAND.line};vertical-align:top;font-size:14px;font-weight:600;color:${BRAND.navy};">${row.html || nl2br(row.value)}</td>`
            : `<td colspan="2" style="padding:9px 0;border-top:1px solid ${BRAND.line};font-size:14px;color:${BRAND.navy};">${row.html || nl2br(row.value)}</td>`
        }
      </tr>`
    )
    .join("")}</table>`;
}

export function section(title, inner) {
  if (!inner) return "";
  return `<div style="margin-top:24px;">
    <p style="margin:0 0 8px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.green};">${escapeHtml(title)}</p>
    ${inner}
  </div>`;
}

export function callout(html, tone = "green") {
  const tones = {
    green: `background:#EEF4F0;border-left:4px solid ${BRAND.green};`,
    gold: `background:#FBF6DF;border-left:4px solid ${BRAND.gold};`,
    navy: `background:#EEF1F5;border-left:4px solid ${BRAND.navy};`,
  };
  return `<div style="margin-top:20px;padding:14px 16px;${tones[tone] || tones.green}font-size:14px;line-height:1.6;">${html}</div>`;
}

export function quote(text) {
  if (!text) return "";
  return `<div style="padding:14px 16px;background:#F7F9F8;border-left:4px solid #C9D4CC;font-size:14px;line-height:1.7;color:#334155;">${nl2br(text)}</div>`;
}

export function steps(items) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items
    .map(
      (item, i) => `<tr>
        <td style="width:34px;padding:8px 0;vertical-align:top;">
          <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:${BRAND.navy};color:#ffffff;font-size:12px;font-weight:700;">${i + 1}</span>
        </td>
        <td style="padding:8px 0;vertical-align:top;font-size:14px;">${item}</td>
      </tr>`
    )
    .join("")}</table>`;
}

export function signature() {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid ${BRAND.line};width:100%;">
    <tr>
      <td style="padding-top:16px;font-size:14px;line-height:1.6;">
        <strong>Rafael Escobar</strong><br>
        <span style="color:${BRAND.muted};">Owner, Flora Lawn &amp; Landscaping Inc</span><br>
        <a href="tel:4013890913" style="color:${BRAND.green};font-weight:700;text-decoration:none;">(401) 389-0913</a>
      </td>
    </tr>
  </table>`;
}

const SECTION_TITLES = {
  "JOB DETAILS": "Job details",
  "CLEANUP ASSESSMENT": "Cleanup details",
  "MULCH & EDGING ASSESSMENT": "Mulch and edging",
  PACKAGE: "Package",
};

function sectionTitle(raw) {
  const key = raw.trim().toUpperCase();
  if (SECTION_TITLES[key]) return SECTION_TITLES[key];
  const lower = raw.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function parseLeadMessage(message = "") {
  const lines = String(message).replace(/\r/g, "").split("\n");
  const general = { title: "Request details", rows: [] };
  const sections = [];
  const noteLines = [];
  let services = [];
  let current = null;
  let inMessage = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (inMessage) {
      noteLines.push(raw);
      continue;
    }
    if (!line) continue;

    const header = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (header) {
      const [name, ...rest] = header[1].split(":");
      if (/^message$/i.test(name.trim())) {
        inMessage = true;
        if (header[2]) noteLines.push(header[2]);
        continue;
      }
      if (/^prefers$/i.test(name.trim())) {
        general.rows.push({ label: "Estimate style", value: rest.join(":").trim() });
        continue;
      }
      current = { title: sectionTitle(name), rows: [] };
      if (rest.length) current.rows.push({ label: "Plan", value: rest.join(":").trim() });
      sections.push(current);
      continue;
    }

    const pair = line.match(/^([A-Za-z][A-Za-z0-9 /&()'-]{0,40}):\s+(.+)$/);
    if (pair && !current && /^services$/i.test(pair[1])) {
      services = pair[2].split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (pair && !current && /^note$/i.test(pair[1])) {
      noteLines.push(pair[2]);
      continue;
    }
    const target = current || general;
    target.rows.push(pair ? { label: pair[1], value: pair[2] } : { label: "", value: line });
  }

  const labeled = general.rows.filter((row) => row.label);
  if (labeled.length === 0 && general.rows.length) {
    noteLines.unshift(...general.rows.map((row) => row.value));
    general.rows = [];
  }
  if (general.rows.length) sections.unshift(general);

  return { services, sections, note: noteLines.join("\n").trim() };
}

export function leadSections(parsed, { skip = [] } = {}) {
  return parsed.sections
    .map((block) => {
      const rows = block.rows.filter((row) => !skip.includes(row.label));
      return section(block.title, detailsTable(rows));
    })
    .join("");
}

export function siteUrl(path = "") {
  return `${SITE}${path}`;
}
