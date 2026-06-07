# Airtable CRM Schema (Primary CRM)

Create a base, then two tables. The `scripts/setup_airtable.mjs` script can create
these automatically via the Airtable Web API (needs a PAT with
`schema.bases:write` scope on the base).

## Table 1 — `Companies`
| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| Website | URL | |
| Industry | Single line text | |
| Country | Single line text | drives language detection |
| Employees | Single line text | size band |
| Email | Email | primary outreach address |
| Contact Name | Single line text | |
| Title | Single line text | |
| LinkedIn | URL | |
| Source | Single select | Apollo, Clay, Manual, Webhook |
| Company Summary | Long text | from AI analyzer |
| Opportunity Summary | Long text | from AI analyzer |
| Risk Assessment | Long text | from AI analyzer |
| Recommended Approach | Long text | from AI analyzer |
| Partnership Types | Multiple select | Sponsorship, Strategic, Advertising, Influencer |
| Lead Score | Number (integer) | 0-100 |
| Classification | Single select | Hot, Warm, Cold |
| Status | Single select | New, Analyzed, Contacted, Replied, Negotiating, Won, Lost, Do Not Contact |
| Last Contact | Date | |
| Next Follow-up | Date | cleared once MAX_FOLLOWUPS is reached |
| Follow-ups Sent | Number (integer) | automated nudges sent; capped by `MAX_FOLLOWUPS` |
| Thread Id | Single line text | Gmail thread for the conversation |
| Notes | Long text | |

## Table 2 — `Conversations`
| Field | Type | Notes |
|---|---|---|
| Subject | Single line text | Primary field |
| Company | Link to `Companies` | |
| Direction | Single select | Outbound, Inbound |
| Channel | Single select | Email |
| Body | Long text | full message text |
| Language | Single select | en, ar |
| Intent | Single line text | from negotiator |
| Summary | Long text | AI message summary |
| Message Id | Single line text | RFC822 / Gmail id |
| Thread Id | Single line text | |
| Needs Review | Checkbox | human-in-the-loop flag |
| Timestamp | Date (incl. time) | |

## HubSpot mapping (if used instead)
- Companies → **Companies** object: name, domain, industry, country, `lead_score`
  (custom number prop), `classification` (custom enum), `lifecyclestage`.
- Conversations → **Engagements / Emails** associated to the company + contact.
- Status → `lifecyclestage` / `hs_lead_status`.
