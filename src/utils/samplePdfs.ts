import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates sample PDF files directly in the browser using pdf-lib.
 * This allows users and testers to test the merge flow immediately
 * without having to find sample PDF documents on their device.
 */
export async function createSamplePdfs(): Promise<File[]> {
  const files: File[] = [];

  // Document 1: Executive Summary (2 pages)
  {
    const pdf = await PDFDocument.create();
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Page 1
    const page1 = pdf.addPage([600, 800]);
    page1.drawRectangle({
      x: 0,
      y: 720,
      width: 600,
      height: 80,
      color: rgb(0.12, 0.28, 0.54), // Navy
    });
    page1.drawText('ANNUAL BUSINESS REPORT 2026', {
      x: 40,
      y: 750,
      size: 22,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    page1.drawText('Part 1: Executive Summary & Overview', {
      x: 40,
      y: 670,
      size: 16,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.3),
    });
    page1.drawText(
      'This document contains the strategic business overview for the fiscal year.\nKey achievements include 48% revenue growth and international market expansion.\n\nAll metrics have been verified by internal audit teams.',
      {
        x: 40,
        y: 610,
        size: 12,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
        lineHeight: 18,
      }
    );

    // Decorative box
    page1.drawRectangle({
      x: 40,
      y: 440,
      width: 520,
      height: 120,
      color: rgb(0.95, 0.97, 1.0),
      borderColor: rgb(0.7, 0.8, 0.95),
      borderWidth: 1,
    });
    page1.drawText('Key Milestones:', {
      x: 60,
      y: 530,
      size: 14,
      font: fontBold,
      color: rgb(0.12, 0.28, 0.54),
    });
    page1.drawText('• Launched Cross-Browser Modern Web Tools\n• Reached 100,000 Active Organizations\n• 99.99% Core Service Reliability', {
      x: 60,
      y: 470,
      size: 12,
      font: fontRegular,
      color: rgb(0.25, 0.25, 0.25),
      lineHeight: 18,
    });

    page1.drawText('Page 1 of 2  •  Confidential', {
      x: 40,
      y: 30,
      size: 10,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Page 2
    const page2 = pdf.addPage([600, 800]);
    page2.drawText('Executive Summary - Leadership Notes', {
      x: 40,
      y: 740,
      size: 18,
      font: fontBold,
      color: rgb(0.12, 0.28, 0.54),
    });
    page2.drawText(
      'Our team is committed to delivering frictionless, client-side browser utilities.\nZero server telemetry ensures complete enterprise confidentiality and privacy.',
      {
        x: 40,
        y: 680,
        size: 12,
        font: fontRegular,
        color: rgb(0.25, 0.25, 0.25),
        lineHeight: 18,
      }
    );
    page2.drawText('Page 2 of 2  •  Executive Summary', {
      x: 40,
      y: 30,
      size: 10,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    const bytes = await pdf.save();
    files.push(
      new File([bytes as unknown as BlobPart], '01_Executive_Summary.pdf', { type: 'application/pdf' })
    );
  }

  // Document 2: Financial Statements (3 pages)
  {
    const pdf = await pdfLibCreateDoc();
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Page 1
    const p1 = pdf.addPage([600, 800]);
    p1.drawRectangle({
      x: 0,
      y: 720,
      width: 600,
      height: 80,
      color: rgb(0.08, 0.45, 0.32), // Emerald
    });
    p1.drawText('FINANCIAL STATEMENTS Q1-Q4', {
      x: 40,
      y: 750,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    p1.drawText('Quarterly Revenue & Profitability Breakdown', {
      x: 40,
      y: 660,
      size: 15,
      font: fontBold,
      color: rgb(0.15, 0.25, 0.2),
    });
    p1.drawText('Q1 Revenue: $2,450,000\nQ2 Revenue: $3,120,000\nQ3 Revenue: $3,980,000\nQ4 Revenue: $5,210,000\n\nTotal Gross Margin: 74.2%', {
      x: 40,
      y: 530,
      size: 12,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 22,
    });
    p1.drawText('Document 2  •  Page 1 of 3', { x: 40, y: 30, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    // Page 2
    const p2 = pdf.addPage([600, 800]);
    p2.drawText('Operating Expenses & Capital Expenditures', {
      x: 40,
      y: 740,
      size: 16,
      font: fontBold,
      color: rgb(0.08, 0.45, 0.32),
    });
    p2.drawText('• R&D & Engineering: 42%\n• Sales & Marketing: 28%\n• Operations & Infrastructure: 18%\n• General & Administrative: 12%', {
      x: 40,
      y: 660,
      size: 12,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 22,
    });
    p2.drawText('Document 2  •  Page 2 of 3', { x: 40, y: 30, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    // Page 3
    const p3 = pdf.addPage([600, 800]);
    p3.drawText('Cash Flow & Balance Sheet Summary', {
      x: 40,
      y: 740,
      size: 16,
      font: fontBold,
      color: rgb(0.08, 0.45, 0.32),
    });
    p3.drawText('Net positive cash flow maintained across all four operational quarters.\nCash reserves: $14.8M at close of period.', {
      x: 40,
      y: 690,
      size: 12,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
      lineHeight: 18,
    });
    p3.drawText('Document 2  •  Page 3 of 3', { x: 40, y: 30, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    const bytes = await pdf.save();
    files.push(
      new File([bytes as unknown as BlobPart], '02_Financial_Statements.pdf', { type: 'application/pdf' })
    );
  }

  // Document 3: Appendix & Signatures (1 page)
  {
    const pdf = await pdfLibCreateDoc();
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const p1 = pdf.addPage([600, 800]);
    p1.drawRectangle({
      x: 0,
      y: 720,
      width: 600,
      height: 80,
      color: rgb(0.45, 0.18, 0.52), // Purple
    });
    p1.drawText('APPENDIX & AUTHORIZATION', {
      x: 40,
      y: 750,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    p1.drawText('Verification and Board Signatures', {
      x: 40,
      y: 670,
      size: 14,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    p1.drawText(
      'The undersigned officers attest that all statements and financial disclosures\npresented in this compiled documentation are true and accurate to the best of knowledge.\n\nDate of Execution: October 15, 2026',
      {
        x: 40,
        y: 620,
        size: 12,
        font: fontRegular,
        color: rgb(0.25, 0.25, 0.25),
        lineHeight: 18,
      }
    );

    // Signature line
    p1.drawLine({
      start: { x: 40, y: 480 },
      end: { x: 260, y: 480 },
      thickness: 1.5,
      color: rgb(0.3, 0.3, 0.3),
    });
    p1.drawText('Chief Executive Officer (Authorized Signatory)', {
      x: 40,
      y: 460,
      size: 10,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    p1.drawLine({
      start: { x: 320, y: 480 },
      end: { x: 540, y: 480 },
      thickness: 1.5,
      color: rgb(0.3, 0.3, 0.3),
    });
    p1.drawText('Audit Committee Chair', {
      x: 320,
      y: 460,
      size: 10,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    p1.drawText('Appendix  •  Page 1 of 1', { x: 40, y: 30, size: 10, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

    const bytes = await pdf.save();
    files.push(
      new File([bytes as unknown as BlobPart], '03_Appendix_Signatures.pdf', { type: 'application/pdf' })
    );
  }

  return files;
}

async function pdfLibCreateDoc() {
  return await PDFDocument.create();
}

/**
 * Creates an intentionally corrupt or empty file for testing validation handling.
 */
export function createCorruptedTestFile(): File {
  const badContent = 'This is plain text with a .pdf extension, not a real PDF format.';
  return new File([badContent], 'Corrupted_Test_Document.pdf', { type: 'application/pdf' });
}

export function createEmptyTestFile(): File {
  return new File([], 'Empty_Zero_Bytes.pdf', { type: 'application/pdf' });
}
