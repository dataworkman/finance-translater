# Financial Translator MVP

A single-repository Next.js application that translates financial changes into plain English. It supports Apple, NVIDIA, Tesla, Costco and Coca-Cola. It does not provide investment recommendations, prices, forecasts, logins, payments, news, RAG, vector databases or PDF processing.

## Installation and Development

Requires Node.js 20.19+ and npm. SQLite needs a writable local filesystem.

```bash
npm ci
cp .env.example .env
npm run db:setup
npm run dev
```

Open http://localhost:3000. For production: `npm run build` then `npm start`. Tests: `npm test`. Type checking: `npm run typecheck`. Database setup must precede tests. Demo works with no external keys or services.

## Environment Variables and OpenAI Configuration

| Variable | Purpose |
| --- | --- |
| `DEMO_MODE` | Defaults to true; set exactly `false` for SEC data. |
| `DATABASE_URL` | `file:./dev.db`, relative to the Prisma schema directory. |
| `SEC_USER_AGENT` | Application name and real contact email, e.g. `FinancialTranslator contact@example.com`. |
| `OPENAI_API_KEY` | Optional server-only key. Without it, live data also receives deterministic mock explanations. |
| `OPENAI_MODEL` | Required when using a key in live mode. Select a model supporting strict JSON schema outputs. No model is hardcoded. |

Never expose secrets to client code. A demo fixture always uses mock explanations even if a key is present.

## Demo Mode

`data/demo/{aapl,nvda,tsla,cost,ko}.json` contains **synthetic illustrative figures**, not company-reported results. The example Q3 dates are illustrative. All demo screens explicitly identify this. SEC links on demo pages are reference destinations, not evidence for the synthetic figures. Demo and live cache identities are separate.

## SEC Data Source and SEC User Agent

Live mode retrieves recent submissions from `data.sec.gov/submissions/CIK….json`, selects the latest 10-Q or 10-K, and retrieves official Company Facts XBRL. A contact-identifying User Agent is mandatory. Exact filing links use accession numbers and primary documents from submissions. Requests have a 20-second timeout and one-hour Next.js fetch cache. Requests are sequential per company, not a bulk crawler; preserve SEC fair-access limits when operating this app.

## How Financial Data Is Calculated

Code computes revenue and net-income YoY as `(current - previous) / previous * 100`, operating margin as `operating income / revenue * 100`, FCF as `operating cash flow - capital expenditures`, and cash change as `current cash - previous cash`. Missing inputs propagate null. Zero or negative YoY bases are unavailable to avoid misleading percentage growth. Comparisons require matching fiscal kind, quarter and successive years, with matching durations and an eight-day tolerance for 52/53-week calendars. Nulls display “Data not available”.

The normalizer selects exact reporting dates and duration facts, using current filing accession and the latest prior-period facts available by that filing date. Annual durations must be 350–380 days; quarters 75–105. **Year-to-date cash flows are not treated as standalone quarters**. It does not subtract cumulative periods or infer missing figures. Unsupported debt totals stay missing rather than summing potentially overlapping tags. Latest quarterly reports without standalone facts may have missing cash flow, capital expenditures or FCF. An unsupported reporting anchor yields “Comparable period unavailable”.

## How Signals Are Selected

A deterministic detector ranks revenue YoY, margin change, FCF YoY and debt YoY by absolute change. Margin changes receive weight 5; others weight 1. Changes below 0.5 are skipped. At most three signals appear. Increasing debt is classified negative, falling debt positive. Revenue growth with margin decline is marked mixed when revenue is selected. These are descriptive heuristics, not investment ratings. The improving and watch sections use only the selected signals.

## How AI Explanation Works

`services/explanation/` owns all AI behavior. Code supplies already calculated metrics and selected signals, never full filings. Default style rules require plain language, defined terms, neutral wording, conflicting evidence and no unsupported claims. Output uses strict JSON schema and Zod validation. A lexical neutrality check rejects direct advisory phrases. One OpenAI request per uncached company filing is the target; SDK retries are disabled. Invalid JSON, provider failures or rejected wording produce “Explanation temporarily unavailable” and are not cached. No hidden fallback labels an API error as a successful AI response. Structural checks do not guarantee factual or semantic correctness; developer review remains necessary.

## Database and Caching

Prisma’s JavaScript engine with a local libSQL SQLite adapter persists Company, Filing, FinancialMetric, Analysis and Evaluation. SQL migrations are checked in. `db:setup` generates the client without downloading unused native engines and applies migration files through the local SQLite driver, recording checksums in `_app_migrations`. Use this script rather than Prisma migrate deploy for this repository. Analyses store financial data, signals, structured explanations, model and generation time. The cache key includes ticker, filing accession, demo/live and pipeline version. A same-process promise lock prevents simultaneous page loads from duplicating generation; uniqueness also prevents duplicate database rows. Multiple server processes can still incur duplicate API calls on a first cache miss. Use a single Node process for this MVP. Live mode still checks SEC on page access through its fetch cache. Explanations are reused even when configuration changes; bump the pipeline version in `lib/analysis.ts` for deliberate invalidation. No refresh button is provided.

## Evaluation

In `npm run dev`, each analysis includes 1–5 inputs for accuracy, simplicity, relevance, evidence and neutrality, plus notes. The developer-only endpoint validates scores, requires same-origin requests and persists them. Mean below 4.0 does not meet public quality. This is a manual review threshold, not an automated publication workflow. Production hides the form and rejects writes.

## Future Book Style Guide Integration

`generateExplanation({ company, financialData, signals, styleGuide, referenceContext })` accepts an optional style guide and reference context. It defaults to the built-in guide. Book analysis should happen separately (e.g. ChatGPT Projects or NotebookLM); pass only the resulting guide. No RAG, book ingestion or vector store is implemented.

## Project File Structure

```text
app/                       Home, company pages, developer evaluation endpoint
components/                Developer evaluation form
lib/companies.ts           Supported CIK mappings
lib/analysis.ts            Pipeline and filing cache
lib/finance/               Types, calculations, deterministic signals
lib/sec/                   SEC client, facts fetcher, conservative normalizer
lib/db/                    Prisma singleton
services/explanation/      Prompt, style guide, mock/OpenAI service, schema
data/demo/                 Five synthetic fixtures
prisma/                    Schema and SQLite migration
tests/                     Calculation, period, signals, schema, SEC, cache tests
```

## Known Limitations

- SEC and OpenAI live calls require outbound access and configuration. This development environment does not provide API credentials or SEC/OpenAI network destinations; real provider integration is not verified here.
- Company-specific extension tags, historical submission pagination, YTD-to-quarter derivation, restatement reconciliation and comprehensive debt aggregation are intentionally unsupported. No estimates are substituted.
- Source links allow manual verification; there is no full XBRL audit interface.
- Cache invalidation is manual, and concurrent generation protection is process-local.
- AI JSON and wording validation is not a proof of factual accuracy; review outputs using the five evaluation criteria.
- Local SQLite requires a persistent disk. This repository targets Node hosting, not Cloudflare Workers or an ephemeral serverless filesystem.

## Recommended Next Steps

Validate each company's real filings with a configured SEC contact and network access. Extend fiscal-period and cash-flow normalization only with audited fixtures. Then evaluate actual configured-model outputs for accuracy and simplicity before any public release. Add distributed generation locking if deploying multiple Node instances.
