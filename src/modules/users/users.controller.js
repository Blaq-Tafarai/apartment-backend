const svc = require('./users.service');

const list = async (req, res, next) => {
  try { res.json({ success: true, ...await svc.list(req.query, req.orgFilter) }); } catch (e) { next(e); }
};
const getById = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getById(req.params.id, req.orgFilter) }); } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try {
    res.status(201).json({
      success: true,
      message: 'User created. Login credentials have been sent to their email.',
      data: await svc.create(req.body, req.organizationId),
    });
  } catch (e) { next(e); }
};
const update = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.update(req.params.id, req.body, req.orgFilter) }); } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id, req.orgFilter); res.json({ success: true, message: 'User deleted.' }); } catch (e) { next(e); }
};

// Admin resets a user's password and re-sends credentials
const resetPassword = async (req, res, next) => {
  try {
    const result = await svc.resetPassword(req.params.id, req.orgFilter);
    res.json({ success: true, message: result.message });
  } catch (e) { next(e); }
};

const assignBuilding = async (req, res, next) => {
  try {
    const result = await svc.assignBuilding(req.params.id, req.body.buildingId, req.orgFilter);
    res.status(201).json({ success: true, data: result });
  } catch (e) { next(e); }
};
const unassignBuilding = async (req, res, next) => {
  try {
    await svc.unassignBuilding(req.params.id, req.params.buildingId);
    res.json({ success: true, message: 'Building unassigned.' });
  } catch (e) { next(e); }
};
const getManagerBuildings = async (req, res, next) => {
  try { res.json({ success: true, data: await svc.getManagerBuildings(req.params.id) }); } catch (e) { next(e); }
};

module.exports = {
  list, getById, create, update, remove,
  resetPassword,
  assignBuilding, unassignBuilding, getManagerBuildings,
};