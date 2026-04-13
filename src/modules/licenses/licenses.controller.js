const svc = require('./licenses.service');

const list = async (req, res, next) => {
  try { res.json({ success: true, ...await svc.list(req.query) }); } catch (e) { next(e); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getById(req.params.id) }); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await svc.create(req.body) }); } catch (e) { next(e); }
};
const update = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.update(req.params.id, req.body) }); } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); res.json({ success: true, message: 'License deleted.' }); } catch (e) { next(e); }
};

module.exports = { list, getById, create, update, remove };