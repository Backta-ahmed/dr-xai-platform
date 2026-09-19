# DR-XAI Platform — feature backlog

Work that is **known, justified and deliberately not done yet**. Nothing here is
a bug; the bugs get fixed as they are found. This is the list of things the
platform should eventually do, why, and what each one costs.

Audience for this file: whoever picks the next piece of work, and the teammate
building the grading model — items 1 and 5 change the interface they are
building against, so read those before freezing the model's output format.

Last reviewed: 19 September 2026.

---

## 1. "Ungradable / insufficient image quality" as a result state

**Effort:** medium · **Touches:** model contract, database, 4 screens, PDF
**Do it before:** the grading model ships. It is much cheaper now than after.

Today the platform cannot record *"I could not grade this image."* The
`diagnoses.dr_stage` column is `NOT NULL`, so every result must be an integer
0–4. A photograph that is blurred, over-exposed, or taken through an
insufficiently dilated pupil still gets assigned a stage.

Every cleared competitor treats this as a first-class outcome, not as a low
grade:

- **IDx-DR** distinguishes *"Exam Quality Insufficient"* — which overrides any
  diagnostic result — from *"Technical Failure – Exam not Suitable for
  Analysis"*. ([FDA DEN180001](https://www.accessdata.fda.gov/cdrh_docs/reviews/DEN180001.pdf),
  [PMC13267010](https://pmc.ncbi.nlm.nih.gov/articles/PMC13267010/))
- **EyeArt** gives real-time image-quality feedback so the operator can
  recapture *before the patient leaves the chair*, rather than report a grade
  derived from a bad image. ([Eyenuk FAQ](https://www.eyenuk.com/resources/faq))

This is a platform requirement rather than a model feature: the system has to
be able to represent "not gradable" regardless of whether a model or a human
decides it.

**What it involves**

- `backend/app/services/model_service.py` — `dr_stage: int | None`, an
  `ungradable` outcome on `DiagnosisResult`, validation, and the contract
  docstring at the top of the file.
- Alembic migration — `dr_stage` nullable, add `ungradable_reason`.
- `DiagnosisResponse` / `DiagnosisListItem` schemas.
- `DiagnosisResult.jsx`, `Reports.jsx`, `DRStageBadge`, both dashboard charts
  (exclude ungradable from the distribution, count it separately), and
  `pdf_service.py`.

---

## 2. Read / reviewed status on the reading list

**Effort:** small–medium · **Touches:** database, `Reports.jsx`

`Reports` is a flat table sorted newest-first with no notion of whether a
specialist has actually read a scan. Every radiology PACS worklist tracks each
study through explicit states — unread → in progress → read/signed — and lets
the reader filter on them.
([Managing radiology worklists](https://agentskills.med/skills/managing-radiology-worklists))

This platform is a second-reader tool, so "have I looked at this yet" is the
question its main list should answer. It currently cannot.

---

## 3. Severity triage above pure recency

**Effort:** medium · **Touches:** `Reports.jsx`, `/diagnosis/` endpoint

PACS worklists pin urgent studies above routine ones regardless of date, often
colour-coded. Ours orders strictly by recency, so a proliferative case
recorded this morning sits below three routine scans recorded this afternoon.
([PACS worklist priority sorting](https://www.researchgate.net/figure/A-radiology-departmental-PACS-worklist-showing-priority-studies-automatically-sorted-to_fig3_7516477))

Depends on nothing; can be done independently of item 2.

---

## 4. Paired OD/OS view for one visit

**Effort:** medium · **Touches:** `DiagnosisResult.jsx`, `/diagnosis/patient/{id}`

Partially done — the result page now has buttons through to the patient's other
scans, with the fellow eye tinted. The convention is stronger than that: both
eyes from the same visit shown **side by side, OD on the left and OS on the
right, as if facing the patient**. Zeiss FORUM advertises auto-selecting the
relevant images for OD/OS comparison in two clicks.
([Zeiss FORUM](https://www.zeiss.com/meditec/en/products/data-management-software/forum.html),
[NHANES III fundus photography manual](https://wwwn.cdc.gov/nchs/data/nhanes3/manuals/fundus.pdf))

---

## 5. Rethink how the AI grade is reported

**Effort:** medium · **Touches:** `DiagnosisResult.jsx`, model contract
**Needs a decision from you before any code is written.**

No FDA-cleared DR device shows a bare confidence percentage as its primary
output; they emit categorical, threshold-derived results. The informatics
literature is blunt about why: a displayed score "can imply false certainty"
and drives automation bias, where clinicians discount their own findings
because the number looked high.
([MedCity News](https://medcitynews.com/2024/12/the-hidden-dangers-of-ai-confidence-scores-in-healthcare/),
[Calibrating Reliance, AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/41457))

**But the obvious fix does not fit this product.** Those devices output
*refer / do not refer*, because they are operated by screeners who must decide
whether to send the patient onward. Our users **are** the referral endpoint —
an ophthalmologist does not refer to themselves. Copying the categorical
refer/no-refer readout would be importing a decision that does not exist in
this workflow.

So the question to answer is: *what decision does a specialist actually make
from this screen, and what output supports it?* Until that is settled, the page
states plainly what the number is and is not, which is the honest interim.

---

## 6. Prior-visit comparison / progression view

**Effort:** large · **Touches:** new view, image registration, storage

Registered current-vs-prior comparison is standard. Retmarker co-registers the
same retinal location between visits; Topcon Harmony advertises longitudinal
comparison.
([NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK401901/),
[Topcon Harmony](https://topconhealthcare.com/products/harmony/))

Large, and worth deferring until the segmentation model exists — lesion masks
are what make a progression view say something a side-by-side photo cannot.

---

## 7. "Last active" on Manage Doctors

**Effort:** small · **Touches:** `/admin/doctors`, `ManageDoctors.jsx`

The table shows NAME / EMAIL / STATUS / CREATED. For a paid platform, *created*
is the least useful of those and *last signed in* is the most useful — it is
the number that says whether an account is worth its subscription. The audit
log already holds it; it needs a join.

---

## Open from the original security audit

| Item | Why it is still open |
|---|---|
| **Rotate the Supabase database password** | Live credentials were committed to a folder with no `.gitignore` and synced to OneDrive. `.gitignore` is fixed; the password has never been rotated and must be treated as compromised. **User action — cannot be done from here.** |
| **JWT stored in `localStorage`** | Readable by any injected script. Moving to an httpOnly cookie means CSRF protection and a refresh-token flow — a real piece of work, not a one-liner. |
| **No automated test suite** | `pytest` is declared in `requirements.txt` and no tests exist. Every regression so far has been caught by a person driving the app. |
| **Supabase storage bucket** | Deferred by your instruction until the model is finished. Images currently go to local disk. |
| **Failed sign-ins attributed to the account owner** | The audit log resolves a failed attempt against a known email to that user's name, so the USER column reads as though they acted. The Record column carries the targeted address, so it is legible, but the attribution is arguably wrong. |

---

## Deliberately not doing

**Mobile image reading.** The European Society of Radiology position is that
mobile screens are unsuitable for primary interpretation and tablets are "not
recommended" for it either — uncalibrated displays, uncontrolled ambient light,
no worklist access. Legitimate mobile use is second opinion and bedside
display, never primary diagnosis.
([ESR position paper, PMC5893485](https://pmc.ncbi.nlm.nih.gov/articles/PMC5893485/))

The mobile layout works and should stay working as a status-glance surface —
check the worklist, read a note, see what is pending. No further investment in
mobile image-reading UI.
