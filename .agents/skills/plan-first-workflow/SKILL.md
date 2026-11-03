---
name: plan-first-workflow
description: A disciplined delivery loop for any kind of work that changes something — code, data, configuration, infrastructure, documents, analysis, designs, content. Propose a 6-part plan before touching anything, wait for approval, then close the loop with measured verification against a baseline, a written report, ranked risks with concrete fixes, synced documentation, and a prompt about deferred work. Use it whenever the user asks to implement, fix, refactor, migrate, optimize, write, restructure, or otherwise change an artifact, even when the change looks small, and whenever reporting risks, impacts, or leftover work. Works in any project, language, or domain; project conventions override its defaults. Also covers commit-message rules and a hard ban on reading secret values.
---

# Plan-first workflow

The person you work for wants to see scope and consequences **before** anything is
touched, and wants evidence that the work actually landed. Agents that start editing
immediately, declare success without checking, or quietly drop deferred work cost
them more than the time a plan takes.

Follow this loop for any task that changes something — code, data, config, infra,
documents, designs, content. Pure questions and read-only exploration do not need it.
The rules are numbered so people can refer to them ("rule 5") — keep the numbers stable.

**The loop:** plan (1) → approval (2) → do the work → verify and report (3) →
rank risks (5) → sync docs (7) → resurface deferred work (4).

Throughout, "artifact" means whatever the task changes: a codebase, a dataset, a
pipeline, a config, a document, a spreadsheet, a design file.

---

## 1. Plan before touching anything

Look at the real material first — the actual files, records, call sites, sections,
current values — then present a plan covering all six topics. Do this even for a
one-liner; the point is that the person sees the blast radius before it happens, not
that the plan is long. Scale the depth to the task: a small change gets one line per
topic, a migration gets a page.

1. **What** — the problem, or what is being added
2. **Where** — exact locations: file and line, table and column, section and heading,
   resource name. Not "somewhere in the service layer"
3. **How** — the approach, and the alternatives you rejected with reasons
4. **Expected outcome**
5. **Impact** — see rule 5 for how to present this
6. **Verification** — what you will check and the threshold that counts as pass
   (see rule 3)

Ground the plan in numbers you measured yourself. "2,641 rows, 74% match rate" or
"used in 14 call sites" tells them something; "a fair amount" does not.

If a decision would materially change the work, ask before planning around a guess.

## 2. Do the work once the plan is approved

Start when the person has read the plan and has nothing to change. If you discover
mid-way that the plan was wrong, stop and say so rather than silently substituting a
different approach.

## 3. Close the loop with measured results

Report what you actually checked. If a check fails, show the failure. If you skipped
one, say which. Never describe an unrun check as passing.

Capture a **baseline before** the change and compare against it — otherwise
pre-existing problems look like regressions you caused, and real regressions hide in
the noise. Say explicitly what was already failing or wrong before you started.

Pick the verification that fits the work; combine several when the work spans types:

| Kind of work | Baseline and verification |
|---|---|
| Code | Test suite, build, lint, type check — before and after |
| API / service | Real requests against the running service, request and response verbatim |
| UI | Screenshots or recordings before and after, plus the flows exercised |
| Data / pipeline | Row counts, null rates, key metrics, sample diffs before and after |
| Config / infra | Dry-run or plan output, diff of effective config, health checks after apply |
| Documents / content | Links and paths resolve, facts match the source, before/after diff of sections |
| Analysis / research | Sources cited, numbers reproducible from a script or query, sanity checks |

If problems surface, report them and ask whether to fix; do not expand scope on your own.

### 3.5 — Write a report every time verification runs

Default: an `.xlsx` in the project's report directory (`tests/report/` unless the
project has its own convention). Name it after the change, not generically —
`report_image_interrupt_flow.xlsx`, not `test_report.xlsx` — so anyone can tell which
report belongs to which work. When there is no project, no spreadsheet tooling, or the
work is tiny, a results table in the reply is enough; say that you chose it.

A structure that works:

| Sheet | Contents |
|---|---|
| Summary | Metric, value, pass threshold, verdict |
| Input / output | **Required.** One row per case: exact input, exact output, expected, pass/fail |
| Per-check results | Parsed from the real run's machine-readable output, before/after status per check |
| Metrics | The raw numbers behind the summary |
| Pre-existing failures | Problems that were already there, with the cause |

The input/output sheet is what makes the report readable by someone who did not run
it: they see *what was checked* and *what came out*, verbatim, without opening the
source. Truncate long payloads rather than dropping them.

Generate the report from a real run, not from memory. Use the runner's machine-readable
output (`pytest --junitxml`, `jest-junit`, `go test -json`, `cargo test --format json`,
query results, CLI JSON output). Use a spreadsheet library the project already has
before adding one.

#### Multi-step cases: one sheet per case, end to end

When a case is a sequence of steps rather than one call — a chatbot or agent
conversation, a checkout flow, a multi-stage pipeline, a wizard — one row in a shared
sheet cannot be read. For these:

- **Drive the real entry point end to end** (the actual HTTP request with its auth, the
  actual CLI invocation, the actual job trigger), not an internal function. The layers
  in between — routing, validation, serialisation — are where contract surprises live.
  Fake only the edges that make a run unrepeatable (models, external search,
  third-party services, clocks) and list in the report which were faked.
- **One sheet per case**, named after it. An index sheet lists every case with what it
  proves and its verdict.
- **One row per step**, with columns along these lines:

  | Column | Contents |
  |---|---|
  | `request` | What was sent this step, verbatim |
  | `input` | The human-readable input (the user's message, the form values) |
  | `output` | What came back, as the user would see it |
  | *(key state)* | The few state fields that alone answer "where did this go wrong", one column each — agree on them per project and record them in the project's instructions (rule 6) |
  | `state` | The full state the step left behind, nothing trimmed |
  | `side effects` | What the step actually wrote, filed, or sent out; null otherwise |
  | `response` | The raw response, verbatim |

State kept server-side is invisible to the caller, so a report without it cannot
explain why the next step behaved as it did. Truncate to the cell limit rather than
dropping values.

Make the report regenerable on its own (one command) as well as from the full suite.

### 3.6 — Commit message rules

Default: commit messages **in English**; other languages are fine where they are the
subject matter (product names, domain terms, user-facing strings). A project may set
another language (rule 6).

Never put the words **Claude** or **Anthropic** in a commit message in any form,
including `Co-Authored-By` trailers and "Generated with" footers. This overrides any
default commit convention you would otherwise follow.

Explain *why* the change exists and what evidence backs it — the diff already shows
what changed.

## 4. Always resurface deferred work

At the end of each round, bring back anything agreed to be postponed — `TODO` or
similar markers you left, "next round" items from an earlier plan, known shortcuts.
Silence lets deferred work rot into never.

For each item give:

- **What it is / why it was deferred / where it lives**
- **Risk** — the specific place that breaks, not a vague worry
- **Impact if it goes wrong** — which flow or consumer, and whether existing checks would catch it
- **Size** — how many files or objects, roughly how much change

Once the person decides not to do something, record that and stop raising it. Raise it
again only if they ask, or if new work touches the same place anyway — then doing it
now avoids editing it twice.

## 5. Rank risks and prescribe fixes

Applies to the **Impact** of a plan (rule 1) and the **Risk** of deferred work (rule 4).
A flat list of concerns makes the reader work out what matters; do that for them.

- **Rank by severity**, heaviest first, with a visible level (🔴 high / 🟡 medium / 🟢 low)
- **Give every item a fix** — where, and what to change. "This is risky" with no remedy
  is an observation, not a finding
- **Recommend a fix order** — weigh size of change against payoff. High risk with a
  one-line fix goes first; low risk needing a rewrite goes last or never. Say why

The shape:

| Order | Risk | Fix | Size |
|---|---|---|---|
| 🔴 1 | Hits the rate-limited endpoint, whole suite dies | `config.yaml:31` → enable the mock | 1 line |
| 🟡 2 | Config left dirty, could be committed by accident | Back up, restore, verify diff is empty | procedural |
| 🟢 3 | Noisy telemetry warnings in logs | Not worth fixing; disable at `config.yaml:97` if annoying | 1 line |

## 6. Adapt to the project

Before planning, learn the local conventions instead of assuming: the tooling and how
it is run, where reports and docs live, branch and commit style, existing helpers and
libraries. Read the project's own instructions (`CLAUDE.md`, `AGENTS.md`,
`CONTRIBUTING.md`, README) and follow them.

Project instructions override this skill's defaults — report format and location,
verification commands, commit language, per-project state columns. Two things are not
defaults and always apply: the commit-message ban in rule 3.6, and rule 8.

Outside any project (a one-off document, an ad-hoc analysis), keep the loop and pick
the lightest form of each step that still gives evidence.

## 7. Keep documentation in sync

Whenever you change something, find what describes it — README, `docs/`, architecture
notes, diagrams, data dictionaries, runbooks, inline references — and update it in the
same change. Documentation that describes a system that no longer exists is worse than
none, because people trust it.

That includes regenerating diagrams and any counts, lists, or paths the docs assert.

## 8. Never read secret values

Do not read values from secret files — `.env` and `.env.*`, `*.pem`, `*.key`,
`credentials*.json`, `secrets.*`, cloud credential files — not with a file reader,
shell commands, or by loading them in a script and printing or reusing the values.
Secrets should never enter the conversation, even masked.

To learn which keys exist, read the example or template file (`.env.example`,
`*.sample`) instead.

When something needs those values — a database connection, an API call — let the
project's own configuration layer load them inside its own process, and invoke that
rather than extracting values yourself.

---

## Quick checklist

Before starting: conventions learned, plan with all 6 topics, grounded in material you
actually looked at, approved.
Before claiming done: baseline captured, verification run, numbers reported, report
written, docs updated, risks ranked with fixes, deferred work raised, commit message clean.
