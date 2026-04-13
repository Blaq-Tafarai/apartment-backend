const svc = require('./audit-logs.service');

const list = async (req, res, next) => {
  try { res.json({ success: true, ...await svc.list(req.query, req.orgFilter) }); } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const item = await svc.getById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Audit log not found.' });
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
};

module.exports = { list, getById };