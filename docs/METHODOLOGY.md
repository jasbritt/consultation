# Methodology

How this consultation is designed, why the questions are worded the way they are,
and what the results can and cannot be used to claim.

---

## 1. The design problem

A youth consultation that asks "what matters to you?" produces a list on which
everything matters. Mental health scores 9. Education scores 9. Housing scores 9.
The result is unusable: it tells a minister that young people care about things,
which they already knew, and gives them no basis for choosing between them.

This consultation is built to avoid that. It asks about the same twelve policy
areas three separate times, on three different dimensions:

| Battery | Question | What it measures |
| --- | --- | --- |
| **Works today** | How well is this working for young people right now? | Delivery |
| **Long term** | How important is this to a young person's long-term future? | Strategic priority |
| **Short term** | How urgent is this over the next twelve months? | Immediate pressure |

The useful numbers are the *differences* between them, not the levels.

### The priority gap

**Long-term importance minus how well it works today.** A large positive gap is
an area young people say matters enormously and say is being delivered badly.
This is the single most report-ready number the consultation produces, because
it points at a specific failure rather than a general concern — and because a
department cannot dismiss it by saying "we know young people care about this".

### The horizon split

**Long-term importance minus short-term urgency.** Areas that score high on the
long term and lower on the short term (climate is the usual example) are where
preventative investment is cheapest and where the political incentive to act is
weakest. Areas that score high on urgency and lower on the long term are crises
to manage rather than strategies to fund. Saying which is which is more useful
to a policy team than a ranked list of concerns.

---

## 2. On the wording of the rating questions

The brief for this consultation originally asked respondents to *"rate these
youth policies on how much you believe they work for young people, out of ten"*,
and asked whether there was a better way to phrase it. There is, and the form
uses it. Three changes were made:

**Separate performance from importance.** "How much do you believe this works"
conflates two things a respondent cannot answer at once: whether the policy area
matters, and whether it is being delivered well. Someone who thinks mental health
support is critical *and* catastrophically delivered has no way to say so in a
single score. Splitting it into three batteries is the standard fix — the same
structure as a priority–performance or gap analysis — and it is what makes the
priority gap computable.

**Ask about provision, not "policies".** Young people do not experience "youth
policy"; they experience whether there is a counsellor at their school and
whether the bus turns up. Each area is therefore described in plain terms
("Youth services and safe places to go") with a sub-line naming what it covers,
rather than as a policy instrument. This measurably reduces "don't know"
responses among younger respondents.

**Anchor the scale to other people, not to the respondent.** The performance
question asks *"thinking about young people you know, how well is each of these
working for young people right now?"* rather than "how well does this work for
you". A 15-year-old who has never needed housing support cannot rate it for
themselves, but can rate what they have seen. This keeps the response rate on
the rating grids high without inviting people to guess.

**On the scale itself.** 0–10 is kept, as asked. It gives enough granularity to
show movement between waves, it is familiar from NPS-style questions, and it
produces means that can be compared across areas. The trade-off is that eleven
points is wide on a phone; `form/create-form.gs` therefore defaults to a grid
layout and offers individual scale items as an alternative
(`USE_GRID_FOR_RATINGS = false`), which is longer but easier on a small screen.

---

## 3. The policy priority areas

The twelve areas are adapted from the priority areas and campaign themes carried
by the **British Youth Council** — its manifesto work, the topics chosen by the
Youth Select Committee, and the issues that repeatedly topped the UK Youth
Parliament's "Make Your Mark" ballot — consolidated into twelve areas short
enough to rate three times without exhausting a respondent.

Using these rather than inventing a fresh list is deliberate: it lets these
findings be compared against roughly a decade of existing youth-voice evidence,
rather than starting the argument from scratch. The British Youth Council ceased
operating in 2024, which makes carrying its framework forward more useful, not
less — there is a body of prior evidence expressed in these terms.

The areas are defined in `assets/js/taxonomy.js`. If you change them, change
`form/create-form.gs` to match and run `node scripts/check-taxonomy.js`.

---

## 4. The "bring it back" question

Asked as a structured choice (up to three from fourteen options) with an optional
free-text box, rather than as pure free text.

Pure free text would need manual coding of thousands of answers before anything
could be charted, and coding decisions made by the people writing the report are
exactly the kind of thing a sceptical reader should distrust. A fixed list is
chartable on arrival and auditable by anyone. The free-text box catches what the
list misses, and if a write-in answer recurs it should be promoted to a listed
option in the next wave.

Every option names provision that **existed and was withdrawn**. That is what
makes the answers actionable: each one can be costed and reinstated, which is a
different kind of ask from "do more about X".

---

## 5. Analysis

- **Rating questions** are reported as arithmetic means across respondents who
  answered that cell. Medians, the share rating 7 or above, the share rating 3 or
  below, and the full 0–10 distribution are all computed and available in the
  data tables under each chart.
- **Categorical questions** are reported as a share of those who answered that
  question, never as a share of all respondents. The denominator is stated in
  every chart footnote.
- **The "bring it back" question** allows up to three selections, so shares sum
  to more than 100%. This is stated on the chart.
- **Free-text answers** are reproduced without correction. They are selected to
  show the range of what was said, and are explicitly labelled as illustrative
  rather than representative.
- **Small bases** are flagged automatically: any chart drawn from fewer than 30
  responses carries a "treat with caution" note rather than being silently drawn.

All of this is implemented in `assets/js/data.js` and is the same code that
produces both the dashboard and the report, so the two cannot disagree.

---

## 6. Limitations — state these every time

**The sample is self-selecting.** Respondents chose to take part and were reached
largely through youth organisations, youth councils and schools. Young people
already engaged with youth voice structures will be over-represented, and the
least engaged under-represented. The findings describe the young people who
responded. They are not a probability sample, **no margin of error is quoted
because none would be meaningful**, and the report says so in those words.

**Coverage is uneven.** Regional response counts do not match regional youth
populations. Any regional breakdown with a small base should not be read as a
finding about that area. The site's region filter shows the base for exactly this
reason.

**The Commonwealth findings are UK young people's views, not the Commonwealth's.**
The consultation is open to young people living in the UK only. Where it asks
about the Commonwealth it is asking what UK young people think should change
across it — a mandate for the UK delegation to carry. It is not, and must never
be presented as, a survey of young people across Commonwealth member states.
Establishing that would need partner-led consultation in each country.

**Order effects.** The three rating batteries are presented in the same order to
every respondent, so later batteries may show mild fatigue. If the consultation
runs again, randomising battery order would remove this.

**Free-text selection.** Quotations are chosen by the delegation. They are not
weighted by frequency and are not a substitute for the coded answers.

---

## 7. Things to fix if this runs again

- Randomise the order of the rating batteries, and of the items within them.
- Add a deliberate booster sample of young people not reached through youth
  organisations — through schools, colleges, JobCentres and care leaver services —
  and report the two groups separately.
- Partner with youth councils in named Commonwealth member states to run a
  parallel consultation on the same questions, so the Commonwealth findings can
  be spoken to by young people in those countries rather than only by UK
  respondents.
- Ask one repeated question from a previous BYC or UK Youth Parliament exercise
  verbatim, to give an anchor point against earlier evidence.
