/**
 * Date utility helpers
 */

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const isExpired = (date) => new Date(date) < new Date();

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

const endOfMonth = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
};

const daysBetween = (date1, date2) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(date2) - new Date(date1)) / msPerDay);
};

module.exports = {
  addDays,
  addMonths,
  addYears,
  isExpired,
  formatDate,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  daysBetween,
};