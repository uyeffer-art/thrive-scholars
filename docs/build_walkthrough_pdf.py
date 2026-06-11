# Builds a branded PDF of the platform walkthrough.
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable,
    ListItem, HRFlowable, KeepTogether
)

# Brand palette
NAVY   = colors.HexColor("#102b4e")
BLUE   = colors.HexColor("#005191")
TEAL   = colors.HexColor("#61aac6")
VLBLUE = colors.HexColor("#d9e9f1")
ORANGE = colors.HexColor("#ec5c29")
GREEN  = colors.HexColor("#18b853")
AMBER  = colors.HexColor("#f7b926")
GRAY   = colors.HexColor("#606673")
LIGHT  = colors.HexColor("#f4f8fb")

styles = getSampleStyleSheet()

def S(name, **kw):
    base = kw.pop("parent", styles["Normal"])
    return ParagraphStyle(name, parent=base, **kw)

title_s    = S("t", fontName="Helvetica-Bold", fontSize=24, textColor=BLUE, leading=28, spaceAfter=4)
subtitle_s = S("st", fontName="Helvetica", fontSize=11, textColor=GRAY, leading=15, spaceAfter=2)
h1_s       = S("h1", fontName="Helvetica-Bold", fontSize=15, textColor=NAVY, leading=19, spaceBefore=16, spaceAfter=8)
h2_s       = S("h2", fontName="Helvetica-Bold", fontSize=12, textColor=BLUE, leading=16, spaceBefore=10, spaceAfter=5)
body_s     = S("b", fontName="Helvetica", fontSize=10, textColor=NAVY, leading=15, spaceAfter=6)
small_s    = S("sm", fontName="Helvetica", fontSize=9, textColor=GRAY, leading=13)
bullet_s   = S("bu", fontName="Helvetica", fontSize=10, textColor=NAVY, leading=14)
cell_s     = S("cell", fontName="Helvetica", fontSize=8.5, textColor=NAVY, leading=11)
cellh_s    = S("cellh", fontName="Helvetica-Bold", fontSize=8.5, textColor=colors.white, leading=11)
note_s     = S("note", fontName="Helvetica-Oblique", fontSize=9, textColor=BLUE, leading=13)

def bullets(items, style=bullet_s):
    return ListFlowable(
        [ListItem(Paragraph(t, style), leftIndent=10, value="•") for t in items],
        bulletType="bullet", bulletColor=TEAL, start="•", leftIndent=14, spaceBefore=2, spaceAfter=8,
    )

story = []

# ---- Header ----
story.append(Paragraph("Thrive Scholars Mentorship Platform", title_s))
story.append(Paragraph("Platform Walkthrough &amp; Spec Coverage", S("st2", parent=subtitle_s, fontSize=13, textColor=ORANGE, fontName="Helvetica-Bold")))
story.append(Spacer(1, 4))
story.append(Paragraph("Live app: <b>https://thrive-scholars.vercel.app</b>", subtitle_s))
story.append(Spacer(1, 6))
story.append(HRFlowable(width="100%", thickness=2.5, color=ORANGE, spaceAfter=12))

# ---- Pitch ----
story.append(Paragraph("The 60-second pitch", h1_s))
story.append(Paragraph(
    "Thrive Scholars now has an end-to-end mentorship platform that takes a scholar from "
    "<b>sign-up &rarr; AI match &rarr; scheduled sessions &rarr; tracked outcomes</b>, with a full staff "
    "console to manage every step and automations that keep Salesforce and email in sync.", body_s))
story.append(Paragraph("Three roles, three tailored experiences:", body_s))
story.append(bullets([
    "<b>Scholars</b> &mdash; see their match, book sessions, complete prep, track progress.",
    "<b>Volunteers</b> &mdash; accept a mentee, share availability, run and log sessions.",
    "<b>Staff / PM</b> &mdash; review and approve matches, manage programs, monitor everything.",
]))

# ---- Coverage table ----
story.append(Paragraph("Spec coverage", h1_s))

rows = [
    ["Original requirement", "Status", "Where to see it"],
    ["Scholar & volunteer profiles (identity, interests, career, alma mater)", "Built", "Profile pages; staff detail pages"],
    ["AI-powered matching with tunable weights", "Built", "Staff → Programs; Scholar → Run matching"],
    ["Multiple program types (mentorship, coffee chat, mock interview, resume)", "Built", "Staff → Programs"],
    ["PM review & approval workflow", "Built", "Staff → Matches"],
    ["Two-sided accept / decline", "Built", "Scholar & Volunteer → My Matches"],
    ["Match timeout & escalation", "Built", "Staff → Matches (timeout banners)"],
    ["Scheduling (Cal.com)", "Built", "Volunteer booking link → auto sessions"],
    ["Interaction tracking (held/missed, ratings, notes)", "Built", "Sessions pages + Staff → Interactions"],
    ["Self-service confirmation + reminders", "Built", "Sessions pages; daily reminder emails"],
    ["Training / prep content per audience & program", "Built", "Training pages (incl. Summer Academy)"],
    ["Session prep guidance & custom comms", "Built", "Staff → Reminders (templates)"],
    ["Corporate partner & star-volunteer tracking", "Built", "Staff → Volunteer detail"],
    ["Inactivity nudges", "Built", "Staff → Volunteers (nudge email)"],
    ["Salesforce sync (contacts, matches, interactions)", "App-ready", "Staff → Salesforce; needs SF credentials"],
    ["Email comms (notifications, reminders, reset)", "App-ready", "Works in test mode; needs domain"],
    ["Automation audit trail", "Built", "Staff → Automation Log"],
]

table_data = []
for i, r in enumerate(rows):
    if i == 0:
        table_data.append([Paragraph(c, cellh_s) for c in r])
    else:
        status = r[1]
        if status == "Built":
            chip = Paragraph('<font color="#18b853">&#10004; Built</font>', S("ok", parent=cell_s, fontName="Helvetica-Bold"))
        else:
            chip = Paragraph('<font color="#b8860b">&#9679; App-ready</font>', S("wp", parent=cell_s, fontName="Helvetica-Bold"))
        table_data.append([Paragraph(r[0], cell_s), chip, Paragraph(r[2], cell_s)])

tbl = Table(table_data, colWidths=[3.0*inch, 0.95*inch, 2.55*inch], repeatRows=1)
tstyle = [
    ("BACKGROUND", (0,0), (-1,0), BLUE),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#dde8f0")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
]
tbl.setStyle(TableStyle(tstyle))
story.append(tbl)
story.append(Spacer(1, 6))
story.append(Paragraph(
    "<b>App-ready</b> = fully built on our side; needs Thrive's credentials/access to go live "
    "(Salesforce org + email domain). Nothing more to code &mdash; it's a connect step.", note_s))

# ---- Demo script ----
story.append(Paragraph("Live demo script", h1_s))
story.append(Paragraph(
    "Tip: open three browser windows to stay logged in as Staff, Scholar, and Volunteer at once. "
    "Staff login: <b>uyeffer+staff@gmail.com</b> / <b>Thrive2026!</b>. "
    "Scholar &amp; volunteer demo accounts use <b>ThriveTest123!</b>", small_s))

story.append(Paragraph("Part A &mdash; Staff console", h2_s))
story.append(Paragraph("Log in as <b>uyeffer+staff@gmail.com</b> (password <b>Thrive2026!</b>).", body_s))
story.append(bullets([
    "<b>Dashboard</b> &mdash; high-level overview.",
    "<b>Scholars / Volunteers</b> &mdash; rich profiles; volunteer <b>actions panel</b> (corporate partner, star, inactivity nudge).",
    "<b>Programs</b> &mdash; four program types and the <b>matching weight sliders</b> (the tunable AI matching).",
    "<b>Run a match</b> &mdash; generate AI suggestions from a scholar's page, then <b>approve</b> one.",
    "<b>Matches</b> &mdash; status tabs and <b>timeout escalation</b> banners.",
    "<b>Interactions</b> &mdash; held/missed management and 'send reminder'.",
    "<b>Reminders</b> &mdash; a template with merge tags + in-app prep content.",
    "<b>Salesforce</b> &mdash; the sync dashboard (linked vs. pending).",
    "<b>Automation Log</b> &mdash; every automated event, for audit.",
]))

story.append(Paragraph("Part B &mdash; Scholar experience", h2_s))
story.append(Paragraph("Log in as <b>jordan@test.com</b>.", body_s))
story.append(bullets([
    "<b>Home</b> &mdash; welcome, <b>getting-started checklist</b>, stats, and 'how mentorship works'.",
    "<b>My Matches</b> &mdash; review the mentor, <b>accept</b>, then <b>book a session</b>.",
    "<b>Sessions</b> &mdash; the <b>prep card</b> and held/missed self-confirmation + rating.",
    "<b>Training</b> &mdash; the Summer Academy video and completion tracking.",
    "<b>Profile</b> &mdash; the full editable scholar profile.",
]))

story.append(Paragraph("Part C &mdash; Volunteer experience", h2_s))
story.append(Paragraph("Log in as <b>priya.patel@test.com</b>.", body_s))
story.append(bullets([
    "<b>My Matches (landing)</b> &mdash; mentor <b>getting-started checklist</b> and 'how mentoring works'.",
    "<b>Accept a match</b>; show the booking-link reminder.",
    "<b>Sessions</b> &mdash; prep card + confirm/rate flow from the mentor side.",
    "<b>Training &amp; Profile</b> &mdash; volunteer modules, availability, booking link.",
]))

story.append(Paragraph("Part D &mdash; The automations", h2_s))
story.append(bullets([
    "<b>Email:</b> branded match notices, daily session reminders with prep content, confirmation prompts, password reset.",
    "<b>Salesforce:</b> outbound trigger + writeback endpoint are built; the Automation Log shows events flowing.",
]))

# ---- Go live ----
story.append(Paragraph("What's needed to go fully live", h1_s))
story.append(Paragraph("These are <b>access</b>, not engineering:", body_s))
story.append(bullets([
    "<b>Email domain</b> &mdash; verify a Thrive sending domain in Resend (DNS records). ~20 min once DNS access exists.",
    "<b>Salesforce</b> &mdash; a connected app / API user + their object model, so Make.com can read/write real records. The app endpoints are ready.",
]))
story.append(Paragraph("Everything else is built, deployed, and working today.", S("emph", parent=body_s, fontName="Helvetica-Bold", textColor=GREEN)))

# ---- Talking points ----
story.append(Paragraph("Likely questions", h1_s))
qa = [
    ("Is the matching real AI?",
     "Yes &mdash; scholar &amp; volunteer profiles are embedded (OpenAI), scored against tunable per-program weights, then surfaced for PM approval. Humans stay in the loop."),
    ("What about data in Salesforce?",
     "The schema already carries SF IDs on every relevant record, the dashboard tracks sync status, and the writeback endpoint is live. We just need their org credentials to flip it on."),
    ("Can staff customize the comms?",
     "Yes &mdash; reminder templates are fully editable (timing, audience, program, merge tags, prep content) without a deploy."),
    ("How do we know sessions actually happened?",
     "Both parties self-confirm held/missed, staff can override, and everything is rated and logged."),
]
for q, a in qa:
    story.append(Paragraph("Q: " + q, S("q", parent=body_s, fontName="Helvetica-Bold", textColor=BLUE, spaceAfter=2)))
    story.append(Paragraph("A: " + a, S("a", parent=body_s, spaceAfter=8)))

# Footer note
story.append(Spacer(1, 8))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=6))
story.append(Paragraph("Prepared for the Thrive Scholars review meeting.", small_s))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(GRAY)
    canvas.drawString(0.75*inch, 0.5*inch, "Thrive Scholars Mentorship Platform")
    canvas.drawRightString(letter[0]-0.75*inch, 0.5*inch, f"Page {doc.page}")
    canvas.setStrokeColor(VLBLUE)
    canvas.line(0.75*inch, 0.65*inch, letter[0]-0.75*inch, 0.65*inch)
    canvas.restoreState()

doc = SimpleDocTemplate(
    "Thrive-Scholars-Platform-Walkthrough.pdf", pagesize=letter,
    leftMargin=0.75*inch, rightMargin=0.75*inch, topMargin=0.7*inch, bottomMargin=0.8*inch,
    title="Thrive Scholars Platform Walkthrough",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("PDF written.")
