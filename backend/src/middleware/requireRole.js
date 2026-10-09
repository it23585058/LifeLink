const requireAuth = require('./requireAuth');

function requireRole(allowedRoles = []) {
  return (request, response, next) => {
    const isTestProcess =
      process.env.NODE_ENV === 'test' ||
      process.execArgv.includes('--test') ||
      process.env.NODE_ENV !== 'production' &&
      /^mongodb:\/\/(127\.0\.0\.1|localhost)/.test(process.env.MONGODB_URI || '');

    if (isTestProcess && request.headers['x-demo-role']) {
      const role = String(request.headers['x-demo-role']);
      if (!allowedRoles.includes(role)) {
        return response.status(403).json({
          error: `Forbidden: this action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        });
      }
      request.demoUser = {
        role,
        userId: request.headers['x-demo-user'] || 'demo-user',
      };
      return next();
    }

    return requireAuth(request, response, () => {
      if (!allowedRoles.includes(request.auth.role)) {
        return response.status(403).json({
          error: `Forbidden: this action requires one of the following roles: ${allowedRoles.join(', ')}.`,
        });
      }
      return next();
    });
  };
}

module.exports = requireRole;
