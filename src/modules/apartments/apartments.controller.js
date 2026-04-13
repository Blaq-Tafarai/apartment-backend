const svc = require('./apartments.service');

const list = async (req, res, next) => {
  try { res.json({ success: true, ...await svc.list(req.query, req.orgFilter, req.user) }); } catch (e) { next(e); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getById(req.params.id, req.orgFilter, req.user) }); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.create(req.body, req.organizationId) }); } catch (e) { next(e); }
};
const update = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.update(req.params.id, req.body, req.orgFilter) }); } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id, req.orgFilter); res.json({ success: true, message: 'Apartment deleted.' }); } catch (e) { next(e); }
};

module.exports = { list, getById, create, update, remove };