const bcrypt = require('bcryptjs');
const env = require('../config/env');

const hashPassword = async (password) => bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

module.exports = { hashPassword, comparePassword };