const svc = require('./documents.service');

const list = async (req, res, next) => {
  try { res.json({ success: true, ...await svc.list(req.query, req.orgFilter, req.user) }); } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getById(req.params.id, req.orgFilter) }); } catch (e) { next(e); }
};

const upload = async (req, res, next) => {
  try {
    const doc = await svc.upload(req.file, req.body, req.user.id, req.organizationId);
    res.status(201).json({ success: true, data: doc });
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id, req.orgFilter);
    res.json({ success: true, message: 'Document deleted.' });
  } catch (e) { next(e); }
};

module.exports = { list, getById, upload, remove };