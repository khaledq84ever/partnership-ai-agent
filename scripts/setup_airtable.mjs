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

async function createTable(table) {
  const res = await fetch(META, { method: "POST", headers, body: JSON.stringify(table) });
  const json = await res.json();
  if (!res.ok) {
    console.error(`✗ ${table.name}:`, JSON.stringify(json));
    return;
  }
  console.log(`✓ Created table "${table.name}" (${json.id})`);
}

console.log("Creating Airtable CRM tables...");
await createTable(companies);
await createTable(conversations);
console.log("Done. Add a 'Company' link field on Conversations -> Companies in the UI (links cannot be created before both tables exist via API in one pass).");
