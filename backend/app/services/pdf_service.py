import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime

def generate_pdf_report(diagnosis: dict, patient: dict, doctor: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(50, height - 50, "Diabetic Retinopathy Diagnosis Report")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, f"Report Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    c.drawString(50, height - 85, f"Report ID: {diagnosis['id']}")
    
    c.line(50, height - 95, width - 50, height - 95)
    
    # Patient Section
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 120, "Patient Information")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 140, f"Name: {patient['full_name']}")
    c.drawString(50, height - 160, f"DOB: {patient.get('date_of_birth') or 'N/A'} | Gender: {patient.get('gender') or 'N/A'}")
    c.drawString(50, height - 180, f"Diabetes Type: {patient.get('diabetes_type') or 'N/A'}")
    c.drawString(50, height - 200, f"Attending Doctor: {doctor['full_name']}")
    
    c.line(50, height - 215, width - 50, height - 215)
    
    # Diagnosis Section
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 240, "Diagnosis Results")
    
    c.setFont("Helvetica-Bold", 16)
    if diagnosis['dr_stage'] == 0:
        c.setFillColor(colors.green)
    elif diagnosis['dr_stage'] < 3:
        c.setFillColor(colors.orange)
    else:
        c.setFillColor(colors.red)
        
    c.drawString(50, height - 270, f"Stage: {diagnosis['dr_label']}")
    c.setFillColor(colors.black)
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 290, f"AI Confidence Score: {diagnosis['confidence']}")
    
    notes = diagnosis.get('notes') or "No clinical notes provided."
    c.drawString(50, height - 320, f"Clinical Notes: {notes}")
    
    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, 100, "This report is AI-assisted and must be reviewed by a licensed ophthalmologist.")
    c.setFont("Helvetica", 12)
    c.drawString(50, 70, "Doctor Signature: _______________________")
    c.drawString(400, 70, "Facility: DR-XAI Platform Clinic")
    
    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer
