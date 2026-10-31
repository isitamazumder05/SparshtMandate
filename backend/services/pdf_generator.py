"""
SpashtMandate AI - Branded PDF Transparency Report Generator
Generates publication-quality subscription transparency audit reports using ReportLab.
Auditable scorecards, deterministic timelines, and honest absent-mandate handling.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from backend.schemas import AnalysisResponse

def generate_pdf_report(analysis: AnalysisResponse) -> bytes:
    """Generates a downloadable PDF transparency audit report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Palette Colors
    c_espresso = colors.HexColor("#211611")
    c_dark_coffee = colors.HexColor("#2B211D")
    c_burnished_copper = colors.HexColor("#85543A")
    c_gold = colors.HexColor("#C28B3D")
    c_ivory_bg = colors.HexColor("#F9F6F0")
    c_light_gray = colors.HexColor("#EAE4DC")
    c_emerald = colors.HexColor("#1B6B44")
    c_amber = colors.HexColor("#A86008")
    c_red = colors.HexColor("#9E2A2B")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=c_espresso,
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        textColor=c_burnished_copper,
        spaceAfter=12
    )
    
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        textColor=colors.HexColor("#5C4B40"),
        leading=10,
        spaceAfter=10
    )

    section_heading = ParagraphStyle(
        'SectionHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=c_dark_coffee,
        spaceBefore=10,
        spaceAfter=5
    )

    normal_text = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        textColor=c_espresso,
        leading=11
    )

    table_header = ParagraphStyle(
        'THeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        textColor=colors.white
    )

    table_cell = ParagraphStyle(
        'TCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        textColor=c_espresso,
        leading=9.5
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("SPASHTMANDATE AI &bull; PRODUCT TRANSPARENCY AUDIT REPORT", title_style))
    story.append(Paragraph("Subscription Commitment &amp; Recurring Payment Clarity Intelligence", subtitle_style))
    story.append(Paragraph("<b>Notice:</b> This document presents an algorithmic Product Transparency Rating and evidence-backed disclosure audit based on inspected merchant terms. It does not constitute a statutory regulatory compliance certification or legal opinion.", disclaimer_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_gold, spaceAfter=10))

    # 2. Executive Summary Block
    summary_data = [
        [
            Paragraph("<b>Target Merchant:</b>", normal_text),
            Paragraph(analysis.merchant_name, normal_text),
            Paragraph("<b>Audit Date:</b>", normal_text),
            Paragraph(analysis.analyzed_at[:19].replace("T", " "), normal_text)
        ],
        [
            Paragraph("<b>Source URL:</b>", normal_text),
            Paragraph((analysis.source_url[:45] + "...") if len(analysis.source_url) > 45 else (analysis.source_url or "Manual Input"), normal_text),
            Paragraph("<b>Transparency Score:</b>", normal_text),
            Paragraph(f"<b>{analysis.transparency_score}/100 (Grade {analysis.transparency_grade})</b>", normal_text)
        ],
        [
            Paragraph("<b>Verification Coverage:</b>", normal_text),
            Paragraph(f"{analysis.verification_coverage_pct}%", normal_text),
            Paragraph("<b>Extraction Engine:</b>", normal_text),
            Paragraph(analysis.extraction_mode, normal_text)
        ]
    ]

    t_summary = Table(summary_data, colWidths=[110, 180, 110, 130])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_ivory_bg),
        ('BOX', (0,0), (-1,-1), 1, c_light_gray),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_light_gray),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 10))

    # 3. Disclosed Recurring Payment Terms
    story.append(Paragraph("1. Disclosed Recurring Payment Terms", section_heading))
    terms = analysis.extracted_terms
    terms_data = [
        [Paragraph("Parameter", table_header), Paragraph("Extracted Value", table_header), Paragraph("Status", table_header), Paragraph("Grounding Evidence Snippet", table_header)],
        [Paragraph("Subscription Amount", table_cell), Paragraph(f"{terms.currency.value or ''} {terms.subscription_amount.value or 'N/A'}", table_cell), Paragraph(terms.subscription_amount.verification_status, table_cell), Paragraph(str(terms.subscription_amount.supporting_text or '')[:80], table_cell)],
        [Paragraph("Billing Cadence", table_cell), Paragraph(str(terms.billing_frequency.value or 'N/A'), table_cell), Paragraph(terms.billing_frequency.verification_status, table_cell), Paragraph(str(terms.billing_frequency.supporting_text or '')[:80], table_cell)],
        [Paragraph("Trial Conversion", table_cell), Paragraph(f"Trial: {terms.free_trial_available.value} ({terms.trial_duration_days.value or 0}d)", table_cell), Paragraph(terms.free_trial_available.verification_status, table_cell), Paragraph(str(terms.free_trial_available.supporting_text or '')[:80], table_cell)],
        [Paragraph("Cancellation Rights", table_cell), Paragraph(str(terms.cancellation_policy.value or 'N/A'), table_cell), Paragraph(terms.cancellation_policy.verification_status, table_cell), Paragraph(str(terms.cancellation_policy.supporting_text or '')[:80], table_cell)],
        [Paragraph("Refund Terms", table_cell), Paragraph(str(terms.refund_policy.value or 'N/A'), table_cell), Paragraph(terms.refund_policy.verification_status, table_cell), Paragraph(str(terms.refund_policy.supporting_text or '')[:80], table_cell)],
    ]

    t_terms = Table(terms_data, colWidths=[100, 100, 70, 260])
    t_terms.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark_coffee),
        ('BOX', (0,0), (-1,-1), 0.5, c_light_gray),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_light_gray),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_terms)
    story.append(Spacer(1, 10))

    # 4. Auditable Product Transparency Scorecard
    if hasattr(analysis, "scorecard") and analysis.scorecard and analysis.scorecard.categories:
        story.append(Paragraph("2. Auditable Product Transparency Scorecard", section_heading))
        score_data = [
            [
                Paragraph("Rule / Category", table_header),
                Paragraph("Assessment Area", table_header),
                Paragraph("Max", table_header),
                Paragraph("Earned", table_header),
                Paragraph("Deducted", table_header),
                Paragraph("Status", table_header),
                Paragraph("Audit Evidence / Reason for Deduction", table_header)
            ]
        ]
        for cat in analysis.scorecard.categories:
            audit_note = cat.reason_for_deduction or (cat.evidence_used[:90] if cat.evidence_used else "Criterion fully satisfied.")
            score_data.append([
                Paragraph(cat.title, table_cell),
                Paragraph(cat.assessment_area.replace("_", " "), table_cell),
                Paragraph(str(cat.max_points), table_cell),
                Paragraph(str(cat.points_earned), table_cell),
                Paragraph(str(cat.points_deducted), table_cell),
                Paragraph(cat.status, table_cell),
                Paragraph(audit_note, table_cell)
            ])
        t_score = Table(score_data, colWidths=[105, 85, 30, 35, 35, 55, 185])
        t_score.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_burnished_copper),
            ('BOX', (0,0), (-1,-1), 0.5, c_light_gray),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_light_gray),
            ('PADDING', (0,0), (-1,-1), 3),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_score)
        
        pre_debit_note = (
            "<b>Payment-System Safeguard Notice:</b> In accordance with RBI Master Directions on Recurring Transactions "
            "(RBI/2019-20/47) Section 3(a), the 24-hour pre-debit notification is an obligation executed by the issuer bank / "
            "payment ecosystem. Merchants are evaluated strictly on merchant-controlled disclosures."
        )
        story.append(Spacer(1, 4))
        story.append(Paragraph(pre_debit_note, disclaimer_style))
        story.append(Spacer(1, 8))

    # 5. Chronological Subscription Timeline
    if hasattr(analysis, "timeline") and analysis.timeline:
        story.append(Paragraph("3. Chronological Subscription &amp; Payment Timeline", section_heading))
        timeline_data = [
            [Paragraph("Step", table_header), Paragraph("Phase", table_header), Paragraph("Timing", table_header), Paragraph("Amount", table_header), Paragraph("Lifecycle Description", table_header)]
        ]
        for ev in analysis.timeline:
            timeline_data.append([
                Paragraph(str(ev.step_number), table_cell),
                Paragraph(f"<b>{ev.phase_name}</b>", table_cell),
                Paragraph(f"{ev.date_display}<br/><font color='#85543A'>({ev.timing_type.replace('_', ' ')})</font>", table_cell),
                Paragraph(ev.amount_display or "—", table_cell),
                Paragraph(ev.description, table_cell)
            ])
        t_timeline = Table(timeline_data, colWidths=[30, 115, 110, 75, 200])
        t_timeline.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_espresso),
            ('BOX', (0,0), (-1,-1), 0.5, c_light_gray),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_light_gray),
            ('PADDING', (0,0), (-1,-1), 3.5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_timeline)
        story.append(Spacer(1, 10))

    # 6. Regulatory Audit Findings
    story.append(Paragraph("4. Regulatory &amp; Disclosure Audit Findings", section_heading))
    findings_data = [
        [Paragraph("Finding Rule", table_header), Paragraph("Status", table_header), Paragraph("Severity", table_header), Paragraph("Regulatory Citation &amp; Impact", table_header)]
    ]
    for f in analysis.findings[:5]:
        findings_data.append([
            Paragraph(f.title, table_cell),
            Paragraph(f.status, table_cell),
            Paragraph(f.severity, table_cell),
            Paragraph(f"<b>{f.applicable_authority or 'Official Standards'}:</b> {f.explanation[:120]}...", table_cell)
        ])

    t_findings = Table(findings_data, colWidths=[120, 60, 50, 300])
    t_findings.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark_coffee),
        ('BOX', (0,0), (-1,-1), 0.5, c_light_gray),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_light_gray),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_findings)
    story.append(Spacer(1, 10))

    # 7. Mandate Verification / Absent-Mandate Handling
    mandate = analysis.mandate_verification
    if not mandate.mandate_provided:
        story.append(Paragraph("5. Mandate Verification &bull; Absent-Mandate Handling (Status: UNVERIFIED)", section_heading))
        mandate_msg = (
            "<b>Mandate Status: UNVERIFIED</b><br/>"
            "No authentic, customer-authorized UPI AutoPay mandate record was submitted for this audit. "
            "In strict accordance with SpashtMandate AI's honest verification architecture, mandate reconciliation is "
            "recorded as <b>UNVERIFIED</b>. SpashtMandate AI does not fabricate test data, simulate imaginary banking confirmations, "
            "or convert missing mandate records into verified approval."
        )
    else:
        story.append(Paragraph("5. UPI AutoPay Mandate Verification", section_heading))
        mandate_msg = (
            f"<b>Status: {mandate.status_summary}</b><br/>"
            f"Comparison between disclosed merchant terms and authorized mandate configuration."
        )
    story.append(Paragraph(mandate_msg, normal_text))
    story.append(Spacer(1, 10))

    # 8. Corrective Recommendations
    if analysis.ai_recommendations:
        story.append(Paragraph("6. Transparency Enhancement Recommendations", section_heading))
        for idx, rec in enumerate(analysis.ai_recommendations, 1):
            story.append(Paragraph(f"&bull; {rec}", normal_text))

    # Footer note
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_light_gray, spaceAfter=8))
    footer_text = Paragraph(
        "SpashtMandate AI &bull; Product Transparency Audit Report &bull; Generated deterministically based on authentic merchant disclosures and NPCI / RBI guidelines.",
        ParagraphStyle('Footer', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=7, textColor=colors.gray, alignment=1)
    )
    story.append(footer_text)

    doc.build(story)
    return buffer.getvalue()
