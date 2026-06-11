# Builds a trimmed, shareable stakeholder overview PDF (no credentials / demo mechanics).
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, ListFlowable,
    ListItem, HRFlowable,
)

NAVY   = colors.HexColor("#102b4e")
BLUE   = colors.HexColor("#005191")
TEAL   = colors.HexColor("#61aac6")
VLBLUE = colors.HexColor("#d9e9f1")
ORANGE = colors.HexColor("#ec5c29")
GREEN  = colors.HexColor("#18b853")
GRAY   = colors.HexColor("#606673")
LIGHT  = colors.HexColor("#f4f8fb")

styles = getSampleStyleSheet()
def S(name, **kw):
    base = kw.pop("parent", styles["Normal"])
    return ParagraphStyle(name, parent=base, **kw)

title_s    = S("t", fontName="Helvetica-Bold", fontSize=24, textColor=BLUE, leading=28, spaceAfter=4)
subtitle_s = S("st", fontName="Helvetica", fontSize=11, textColor=GRAY, leading=15, spaceAfter=2)
h1_s       = S("h1", fontName="Helvetica-Bold", fontSize=15, textColor=NAVY, leading=19, spaceBefore=16, spaceAfter=8)
body_s     = S("b", fontName="Helvetica", fontSize=10, textColor=NAVY, leading=15, spaceAfter=6)
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
story.append(Paragraph("Thrive Scholars Mentorship Platform", title_s))
story.append(Paragraph("Project Overview", S("st2", parent=subtitle_s, fontSize=13, textColor=ORANGE, fontName="Helvetica-Bold")))
story.append(Spacer(1, 4))
story.append(Paragraph("Live app: <b>https://thrive-scholars.vercel.app</b>", subtitle_s))
story.append(Spacer(1, 6))
story.append(HRFlowable(width="100%", thickness=2.5, color=ORANGE, spaceAfter=12))

story.append(Paragraph("Overview", h1_s))
story.append(Paragraph(
    "Thrive Scholars now has an end-to-end mentorship platform that takes a scholar from "
    "<b>sign-up &rarr; AI match &rarr; scheduled sessions &rarr; tracked outcomes</b>, with a full staff "
    "console to manage every step and automations that keep Salesforce and email in sync.", body_s))
story.append(Paragraph("Three roles, three tailored experiences:", body_s))
story.append(bullets([
    "<b>Scholars</b> &mdash; see their match, book sessions, complete prep, track progress.",
    "<b>Volunteers</b> &mdash; accept a mentee, share availability, run and log sessions.",
    "<b>Staff / Program Managers</b> &mdash; review and approve matches, manage programs, monitor everything.",
]))

story.append(Paragraph("Requirement coverage", h1_s))
rows = [
    ["Requirement", "Status"],
    ["Scholar & volunteer profiles (identity, interests, career, alma mater)", "Built"],
    ["AI-powered matching with tunable, per-program weights", "Built"],
    ["Multiple program types (mentorship year, coffee chat, mock interview, resume review)", "Built"],
    ["Program-manager review & approval workflow", "Built"],
    ["Two-sided accept / decline with timeout escalation", "Built"],
    ["Scheduling via Cal.com", "Built"],
    ["Interaction tracking (held/missed, ratings, notes) & self-confirmation", "Built"],
    ["Training / prep content per audience & program", "Built"],
    ["Automated session reminders & customizable communications", "Built"],
    ["Corporate-partner & star-volunteer tracking; inactivity nudges", "Built"],
    ["Automation audit trail", "Built"],
    ["Salesforce sync (contacts, matches, interactions → case plan)", "Ready to connect"],
    ["Email delivery to all users (notifications, reminders, reset)", "Ready to connect"],
]
table_data = []
for i, r in enumerate(rows):
    if i == 0:
        table_data.append([Paragraph(c, cellh_s) for c in r])
    else:
        if r[1] == "Built":
            chip = Paragraph('<font color="#18b853">&#10004; Built</font>', S("ok", parent=cell_s, fontName="Helvetica-Bold"))
        else:
            chip = Paragraph('<font color="#b8860b">&#9679; Ready to connect</font>', S("wp", parent=cell_s, fontName="Helvetica-Bold"))
        table_data.append([Paragraph(r[0], cell_s), chip])

tbl = Table(table_data, colWidths=[4.7*inch, 1.8*inch], repeatRows=1)
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), BLUE),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT]),
    ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#dde8f0")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 6),
    ("BOTTOMPADDING", (0,0), (-1,-1), 6),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
    ("RIGHTPADDING", (0,0), (-1,-1), 7),
]))
story.append(tbl)
story.append(Spacer(1, 10))

story.append(Paragraph("Security &amp; privacy", h1_s))
story.append(Paragraph("The platform protects scholar information at the data layer, not just the interface:", body_s))
story.append(bullets([
    "<b>Access controls</b> &mdash; every record is protected by database-level Row Level Security. Users only ever see their own data, and a scholar's personal information is never exposed to other users.",
    "<b>Encryption</b> &mdash; all data is encrypted in transit (TLS) and at rest, on managed, automatically backed-up infrastructure.",
    "<b>Authentication</b> &mdash; passwords are securely hashed (never stored in plaintext), with secure, time-limited password resets.",
    "<b>Integrations</b> &mdash; the Salesforce connection is authenticated and exchanges only record identifiers, never bulk personal data.",
    "<b>Compliance-ready</b> &mdash; the access model is designed to support FERPA-style data minimization and need-to-know access.",
]))

story.append(Paragraph("Final steps to go live", h1_s))
story.append(Paragraph("Two items remain, and both require Thrive-side access rather than further development:", body_s))
story.append(bullets([
    "<b>Email domain</b> &mdash; verify a Thrive sending domain so notifications, reminders, and password resets reach real scholars and volunteers.",
    "<b>Salesforce connection</b> &mdash; provide API access and the object model so matches, interactions, and contacts sync to the case plan. The platform's sync endpoints are already built and waiting.",
]))
story.append(Paragraph("Everything else is built, deployed, and working today.",
                       S("emph", parent=body_s, fontName="Helvetica-Bold", textColor=GREEN)))

story.append(Spacer(1, 10))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=6))
story.append(Paragraph("Prepared for Thrive Scholars.", S("sm", parent=note_s, fontName="Helvetica", textColor=GRAY)))

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
    "Thrive-Scholars-Project-Overview.pdf", pagesize=letter,
    leftMargin=0.75*inch, rightMargin=0.75*inch, topMargin=0.7*inch, bottomMargin=0.8*inch,
    title="Thrive Scholars Project Overview",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("Overview PDF written.")
