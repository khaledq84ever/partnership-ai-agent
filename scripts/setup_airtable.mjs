#!/usr/bin/env node
/**
 * Creates the Companies + Conversations tables in an existing Airtable base.
 * Requires a Personal Access Token with scopes:
 *   schema.bases:write, schema.bases:read
 *
 * Usage:
 *   AIRTABLE_API_KEY=pat... AIRTABLE_BASE_ID=app... node scripts/setup_airtable.mjs
 */

const API_KEY = process.env.AIRTABLE_API_KEY;
const BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!API_KEY || !BASE_ID) {
  console.error("Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID env vars.");
  process.exit(1);
}

const META = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

const sel = (opts) => ({
  type: "singleSelect",
  options: { choices: opts.map((name) => ({ name })) },
});
const multi = (opts) => ({
  type: "multipleSelects",
  options: { choices: opts.map((name) => ({ name })) },
});

const companies = {
  name: "Companies",
  fields: [
    { name: "Name", type: "singleLineText" },
    { name: "Website", type: "url" },
    { name: "Industry", type: "singleLineText" },
    { name: "Country", type: "singleLineText" },
    { name: "Employees", type: "singleLineText" },
    { name: "Email", type: "email" },
    { name: "Contact Name", type: "singleLineText" },
    { name: "Title", type: "singleLineText" },
    { name: "LinkedIn", type: "url" },
    { name: "Source", ...sel(["Apollo", "Clay", "Manual", "Webhook"]) },
    { name: "Company Summary", type: "multilineText" },
    { name: "Opportunity Summary", type: "multilineText" },
    { name: "Risk Assessment", type: "multilineText" },
    { name: "Recommended Approach", type: "multilineText" },
    { name: "Partnership Types", ...multi(["Sponsorship", "Strategic", "Advertising", "Influencer"]) },
    { name: "Lead Score", type: "number", options: { precision: 0 } },
    { name: "Classification", ...sel(["Hot", "Warm", "Cold"]) },
    { name: "Status", ...sel(["New", "Analyzed", "Contacted", "Replied", "Negotiating", "Won", "Lost", "Do Not Contact"]) },
    { name: "Last Contact", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Next Follow-up", type: "date", options: { dateFormat: { name: "iso" } } },
    { name: "Follow-ups Sent", type: "number", options: { precision: 0 } },
    { name: "Thread Id", type: "singleLineText" },
    { name: "Notes", type: "multilineText" },
  ],
};

const conversations = {
  name: "Conversations",
  fields: [
    { name: "Subject", type: "singleLineText" },
    { name: "Direction", ...sel(["Outbound", "Inbound"]) },
    { name: "Channel", ...sel(["Email"]) },
    { name: "Body", type: "multilineText" },
    { name: "Language", ...sel(["en", "ar"]) },
    { name: "Intent", type: "singleLineText" },
    { name: "Summary", type: "multilineText" },
    { name: "Message Id", type: "singleLineText" },
    { name: "Thread Id", type: "singleLineText" },
    { name: "Needs Review", type: "checkbox", options: { icon: "flag", color: "redBright" } },
    { name: "Timestamp", type: "dateTime", options: { dateFormat: { name: "iso" }, timeFormat: { name: "24hour" }, timeZone: "client" } },
  ],
};

async function listTables() {
  const res = await fetch(META, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(`Cannot read base schema: ${JSON.stringify(json)}`);
  return json.tables || [];
}

async function createTable(table) {
  const res = await fetch(META, { method: "POST", headers, body: JSON.stringify(table) });
  const json = await res.json();
  if (!res.ok) {
    // Already-exists is fine on a re-run; the ID is recovered from the schema below.
    console.error(`✗ ${table.name}:`, JSON.stringify(json));
    return null;
  }
  console.log(`✓ Created table "${table.name}" (${json.id})`);
  return json.id;
}

// Add the Conversations -> Companies link field. The schema API can't create it
// in the same pass that creates the tables (the linked table must already exist),
// so it's a follow-up call. Idempotent: skips if the field is already present.
async function ensureCompanyLink(convId, companiesId) {
  const conv = (await listTables()).find((t) => t.id === convId);
  if (conv && conv.fields.some((f) => f.name === "Company")) {
    console.log('✓ Link field "Company" already present on Conversations');
    return;
  }
  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables/${convId}/fields`;
  const body = { name: "Company", type: "multipleRecordLinks", options: { linkedTableId: companiesId } };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) {
    console.error("✗ Company link field:", JSON.stringify(json));
    console.error("  Add a 'Company' link field (Conversations -> Companies) manually.");
    return;
  }
  console.log(`✓ Created link field "Company" on Conversations (${json.id})`);
}

console.log("Creating Airtable CRM tables...");
let companiesId = await createTable(companies);
let conversationsId = await createTable(conversations);

// Recover IDs from the live schema when a table already existed (re-run).
if (!companiesId || !conversationsId) {
  const tables = await listTables();
  companiesId = companiesId || (tables.find((t) => t.name === companies.name) || {}).id;
  conversationsId = conversationsId || (tables.find((t) => t.name === conversations.name) || {}).id;
}

if (companiesId && conversationsId) {
  await ensureCompanyLink(conversationsId, companiesId);
  console.log("Done. Workflows 3 & 4 write Conversations.Company as a link — it's now wired up.");
} else {
  console.error("Could not resolve table IDs; create the 'Company' link field manually.");
}
