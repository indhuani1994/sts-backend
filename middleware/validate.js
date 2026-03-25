const ApiError = require('../utils/ApiError');

const validate = (rules) => (req, _res, next) => {
  try {
    const errors = [];

    rules.forEach((rule) => {
      const sourceValue = req[rule.source || 'body']?.[rule.field];
      const value = sourceValue ?? rule.defaultValue;

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (rule.type === 'number' && Number.isNaN(Number(value))) {
          errors.push(`${rule.field} must be a number`);
        }

        if (rule.type === 'date' && Number.isNaN(new Date(value).getTime())) {
          errors.push(`${rule.field} must be a valid date`);
        }

        if (rule.enum && !rule.enum.includes(value)) {
          errors.push(`${rule.field} must be one of: ${rule.enum.join(', ')}`);
        }
      }
    });

    if (errors.length > 0) {
      return next(new ApiError(400, errors.join('; ')));
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
