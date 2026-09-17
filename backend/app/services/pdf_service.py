"""Diagnosis report PDF.

The PDF is the artifact most likely to leave the application and be read out
of context — printed, emailed, filed. When a result did not come from a real
model, that has to be visible on the page itself, not just in the UI that
generated it. Hence the watermark.
"""

import io
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

MARGIN = 50

# Spelled out alongside the abbreviation. OD and OS are unambiguous to an
# ophthalmologist, but a report is read by other clinicians and by patients.
EYE_LABELS = {"od": "OD (right eye)", "os": "OS (left eye)"}


def _draw_simulation_watermark(c: canvas.Canvas, width: float, height: float) -> None:
    """Diagonal banner across the page for non-clinical output."""
    c.saveState()
    c.setFillColor(colors.Color(0.85, 0.15, 0.15, alpha=0.16))
    c.setFont("Helvetica-Bold", 46)
    c.translate(width / 2, height / 2)
    c.rotate(38)
    c.drawCentredString(0, 40, "SIMULATED OUTPUT")
    c.drawCentredString(0, -20, "NOT FOR CLINICAL USE")
    c.restoreState()


def _draw_wrapped(c: canvas.Canvas, text: str, x: float, y: float, width: float) -> float:
    """Draw text that wraps instead of running off the page edge.

    Returns the y coordinate below the drawn block. The previous implementation
    used drawString for clinical notes, so anything longer than the page width
    was silently cut off.
    """
    style = ParagraphStyle("body", fontName="Helvetica", fontSize=11, leading=15)
    para = Paragraph(text, style)
    _, used_height = para.wrap(width, 400)
    para.drawOn(c, x, y - used_height)
    return y - used_height


def generate_pdf_report(diagnosis: dict, patient: dict, doctor: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    content_width = width - (2 * MARGIN)
    is_simulated = bool(diagnosis.get("is_simulated"))

    if is_simulated:
        _draw_simulation_watermark(c, width, height)

    y = height - MARGIN

    c.setFont("Helvetica-Bold", 18)
    c.drawString(MARGIN, y, "Diabetic Retinopathy Diagnosis Report")
    y -= 22

    c.setFont("Helvetica", 10)
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    c.drawString(MARGIN, y, f"Report generated: {generated} UTC")
    y -= 14
    c.drawString(MARGIN, y, f"Report ID: {diagnosis['id']}")
    y -= 18

    # Prominent banner directly under the header, so it is readable even if the
    # watermark does not survive printing or conversion.
    if is_simulated:
        c.setFillColor(colors.Color(0.99, 0.93, 0.93))
        c.rect(MARGIN, y - 42, content_width, 40, stroke=0, fill=1)
        c.setFillColor(colors.Color(0.70, 0.10, 0.10))
        c.setFont("Helvetica-Bold", 12)
        c.drawString(MARGIN + 10, y - 18, "SIMULATED RESULT - NOT A MEDICAL DIAGNOSIS")
        c.setFont("Helvetica", 9)
        c.drawString(
            MARGIN + 10,
            y - 32,
            "No diagnostic model is connected. These values are placeholders and "
            "must not inform patient care.",
        )
        c.setFillColor(colors.black)
        y -= 56

    c.setStrokeColor(colors.lightgrey)
    c.line(MARGIN, y, width - MARGIN, y)
    y -= 24

    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN, y, "Patient Information")
    y -= 18
    c.setFont("Helvetica", 11)
    for line in (
        f"Name: {patient['full_name']}",
        f"Date of birth: {patient.get('date_of_birth') or 'N/A'}"
        f"    Gender: {patient.get('gender') or 'N/A'}",
        f"Diabetes type: {patient.get('diabetes_type') or 'N/A'}",
        f"Attending doctor: {doctor['full_name']}",
    ):
        c.drawString(MARGIN, y, line)
        y -= 16

    y -= 8
    c.line(MARGIN, y, width - MARGIN, y)
    y -= 24

    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN, y, "Assessment")
    y -= 22

    c.setFont("Helvetica", 11)
    c.drawString(MARGIN, y, f"Eye examined: {EYE_LABELS.get(diagnosis.get('eye'), 'Not recorded')}")
    y -= 20

    stage = diagnosis["dr_stage"]
    if stage == 0:
        stage_colour = colors.Color(0.15, 0.68, 0.38)
    elif stage < 3:
        stage_colour = colors.Color(0.90, 0.49, 0.13)
    else:
        stage_colour = colors.Color(0.75, 0.22, 0.17)

    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(stage_colour)
    c.drawString(MARGIN, y, f"Stage {stage} - {diagnosis['dr_label']}")
    c.setFillColor(colors.black)
    y -= 20

    c.setFont("Helvetica", 11)
    confidence = diagnosis.get("confidence")
    # Rendered as a percentage; previously printed as a raw float like "0.87".
    confidence_text = f"{confidence * 100:.0f}%" if confidence is not None else "N/A"
    c.drawString(MARGIN, y, f"Model confidence: {confidence_text}")
    y -= 16

    model_name = diagnosis.get("model_name") or "unknown"
    model_version = diagnosis.get("model_version") or "unknown"
    c.drawString(MARGIN, y, f"Model: {model_name} ({model_version})")
    y -= 24

    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, y, "Clinical notes")
    y -= 16
    notes = diagnosis.get("notes") or "No clinical notes provided."
    y = _draw_wrapped(c, notes, MARGIN, y, content_width)
    y -= 20

    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.dimgrey)
    disclaimer = (
        "This report is AI-assisted and must be reviewed and countersigned by a "
        "licensed ophthalmologist before it informs any clinical decision."
    )
    _draw_wrapped(c, disclaimer, MARGIN, 120, content_width)
    c.setFillColor(colors.black)

    c.setFont("Helvetica", 11)
    c.drawString(MARGIN, 70, "Doctor signature: _______________________")
    c.drawString(width - MARGIN - 200, 70, "DR-XAI Platform")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer
