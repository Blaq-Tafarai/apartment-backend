const PDFDocument = require('pdfkit');

/**
 * Generate a PDF buffer from content.
 * @param {Function} builder - receives (doc) and draws content
 * @returns {Promise<Buffer>}
 */
const generatePDF = (builder) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    builder(doc);
    doc.end();
  });

/**
 * Generate a lease agreement PDF.
 */
const generateLeaseAgreementPDF = (lease) =>
  generatePDF((doc) => {
    doc.fontSize(20).text('LEASE AGREEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Tenant: ${lease.tenantName}`);
    doc.text(`Apartment: ${lease.unitNumber}`);
    doc.text(`Building: ${lease.buildingName}`);
    doc.text(`Start Date: ${lease.startDate}`);
    doc.text(`End Date: ${lease.endDate}`);
    doc.text(`Monthly Rent: ${lease.rentAmount}`);
    doc.moveDown();
    doc.text('Terms and Conditions', { underline: true });
    doc.text(lease.terms || 'Standard lease terms apply.');
    doc.moveDown(2);
    doc.text('Tenant Signature: _____________________');
    doc.text('Manager Signature: _____________________');
  });

/**
 * Generate a billing invoice PDF.
 */
const generateInvoicePDF = (billing) =>
  generatePDF((doc) => {
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice #: ${billing.id}`);
    doc.text(`Tenant: ${billing.tenantName}`);
    doc.text(`Due Date: ${billing.dueDate}`);
    doc.text(`Amount Due: ${billing.amount}`);
    doc.text(`Status: ${billing.status}`);
    doc.moveDown();
    doc.text('Please make payment before the due date.');
  });

/**
 * Generate an expense report PDF.
 */
const generateExpenseReportPDF = (data) =>
  generatePDF((doc) => {
    doc.fontSize(20).text('EXPENSE REPORT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Building: ${data.buildingName}`);
    doc.text(`Period: ${data.from} — ${data.to}`);
    doc.moveDown();

    data.expenses.forEach((e, i) => {
      doc.text(`${i + 1}. ${e.category} — ${e.amount} (${e.description || 'N/A'})`);
    });

    doc.moveDown();
    doc.text(`Total: ${data.total}`, { bold: true });
  });

module.exports = { generatePDF, generateLeaseAgreementPDF, generateInvoicePDF, generateExpenseReportPDF };