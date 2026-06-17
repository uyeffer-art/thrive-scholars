# Builds a brief, branded self-guided preview PDF for a staff reviewer (Kevin).
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, HRFlowable, Table, TableStyle
)

NAVY   = colors.HexColor("#102b4e")
BLUE   = colors.HexColor("#005191")
TEAL   = colors.HexColor("#61aac6")
VLBLUE = colors.HexColor("#d9e9f1")
ORANGE = colors.HexColor("#ec5c29")
GRAY   = colors.HexColor("#606673")
LIGHT  = colors.HexColor("#f4f8fb")

styles = getSampleStyleSheet()
def S(name, **kw):
    base = kw.pop("parent", styles["Normal"])
    return ParagraphStyle(name, parent=base, **kw)

title_s    = S("t", fontName="Helvetica-Bold", fontSize=22, textColor=BLUE, leading=26, spaceAfter=4)
subtitle_s = S("st", fontName="Helvetica", fontSize=11, textColor=GRAY, leading=15, spaceAfter=2)
h2_s       = S("h2", fontName="Helvetica-Bold", fontSize=13, textColor=BLUE, leading=17, spaceBefore=12, spaceAfter=2)
body_s     = S("b", fontName="Helvetica", fontSize=10, textColor=NAVY, leading=15, spaceAfter=6)
bullet_s   = S("bu", fontName="Helvetica", fontSize=10, textColor=NAVY, leading=14)
cred_s     = S("cr", fontName="Helvetica", fontSize=9.5, textColor=GRAY, leading=13, spaceAfter=4)

def steps(items):
    return ListFlowable(
        [ListItem(Paragraph(t, bullet_s), leftIndent=12) for t in items],
        bulletType="1", bulletColor=BLUE, leftIndent=18, spaceBefore=2, spaceAfter=6,
    )

def cred(label, email, pw):
    return Paragraph(
        f'<b>{label}</b> &nbsp;&middot;&nbsp; <font color="#005191">{email}</font> &nbsp;&middot;&nbsp; '
        f'password <font color="#005191">{pw}</font>', cred_s)

story = []
story.append(Paragraph("Thrive Scholars Platform", title_s))
story.append(Paragraph("Quick Self-Guided Preview", S("st2", parent=subtitle_s, fontSize=13, textColor=ORANGE, fontName="Helvetica-Bold")))
story.append(Spacer(1, 4))
story.append(Paragraph("Sign in at <b>https://thrive-scholars.vercel.app</b>", subtitle_s))
story.append(HRFlowable(width="100%", thickness=2.5, color=ORANGE, spaceBefore=8, spaceAfter=10))

story.append(Paragraph(
    "Everything below is demo data, so click freely — nothing is real or breakable. To see each role, "
    "sign out and back in with the logins shown. Tip: use a separate private/incognito window per role "
    "to keep all three open at once.", body_s))

# Staff
story.append(Paragraph("1. Staff / Admin console", h2_s))
story.append(cred("Staff", "kshaw@kippteamandfamily.org", "ThriveKevin2026!"))
story.append(Paragraph("The control center. A good loop:", body_s))
story.append(steps([
    "<b>Dashboard</b> — overview landing page.",
    "<b>Scholars / Volunteers</b> — open any record for the full profile; on a volunteer, note the staff actions (star, corporate partner, inactivity nudge).",
    "<b>Programs</b> — the four program types and the matching-weight sliders (tunable AI matching).",
    "<b>Matches</b> — browse pending/active matches; open one to see approval actions.",
    "<b>Interactions</b> — sessions logged as held/missed, with ratings.",
    "<b>Reminders</b> — open a template to see the automated, customizable comms.",
    "<b>Salesforce &amp; Automation Log</b> — sync status and an audit trail.",
]))

# Scholar
story.append(Paragraph("2. Scholar experience", h2_s))
story.append(cred("Scholar", "jordan@test.com", "ThriveTest123!"))
story.append(Paragraph("What a student sees:", body_s))
story.append(steps([
    "<b>Home</b> — welcome, a getting-started checklist, and 'how mentorship works.'",
    "<b>My Matches</b> — review the matched mentor, accept, and book a session.",
    "<b>Sessions</b> — an upcoming session with prep tips, plus a past session with a rating.",
    "<b>Training</b> — the Summer Academy video and progress tracking.",
]))

# Volunteer
story.append(Paragraph("3. Volunteer (mentor) experience", h2_s))
story.append(cred("Volunteer", "priya.patel@test.com", "ThriveTest123!"))
story.append(Paragraph("What a mentor sees:", body_s))
story.append(steps([
    "<b>My Matches</b> — the mentor's getting-started checklist and 'how mentoring works.'",
    "<b>Accept a match</b> and note the booking-link prompt.",
    "<b>Sessions</b> — prep tips and the confirm/rate flow from the mentor's side.",
    "<b>Training &amp; Profile</b> — volunteer modules, availability, and booking link.",
]))

story.append(Spacer(1, 8))
story.append(HRFlowable(width="100%", thickness=1, color=TEAL, spaceAfter=6))
story.append(Paragraph("Questions as you explore? Just reach out — happy to walk through anything.", cred_s))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8); canvas.setFillColor(GRAY)
    canvas.drawString(0.75*inch, 0.5*inch, "Thrive Scholars Mentorship Platform")
    canvas.drawRightString(letter[0]-0.75*inch, 0.5*inch, f"Page {doc.page}")
    canvas.setStrokeColor(VLBLUE); canvas.line(0.75*inch, 0.65*inch, letter[0]-0.75*inch, 0.65*inch)
    canvas.restoreState()

doc = SimpleDocTemplate("Thrive-Scholars-Preview-Guide.pdf", pagesize=letter,
    leftMargin=0.75*inch, rightMargin=0.75*inch, topMargin=0.7*inch, bottomMargin=0.8*inch,
    title="Thrive Scholars — Self-Guided Preview")
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print("Preview PDF written.")
