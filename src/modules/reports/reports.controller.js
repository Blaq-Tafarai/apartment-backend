const svc = require('./reports.service');

const occupancy = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.occupancyReport(req.orgFilter) }); } catch (e) { next(e); }
};

const revenue = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    res.json({ success: true, data: await svc.revenueReport(req.orgFilter, Number(year), Number(month)) });
  } catch (e) { next(e); }
};

const expenses = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    res.json({ success: true, data: await svc.expenseReport(req.orgFilter, Number(year), Number(month)) });
  } catch (e) { next(e); }
};

const maintenance = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.maintenanceReport(req.orgFilter) }); } catch (e) { next(e); }
};

const leaseExpiry = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 30;
    res.json({ success: true, data: await svc.leaseExpiryReport(req.orgFilter, days) });
  } catch (e) { next(e); }
};

const paymentSummary = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    res.json({ success: true, data: await svc.paymentSummaryReport(req.orgFilter, Number(year), Number(month)) });
  } catch (e) { next(e); }
};

module.exports = { occupancy, revenue, expenses, maintenance, leaseExpiry, paymentSummary };