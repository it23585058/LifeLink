/**
 * Temporary role-gate middleware for demonstration purposes.
 * Reads 'x-demo-role' and 'x-demo-user' headers.
 * 
 * Known security limitation:
 * This is a stand-in for Milestone 03 demonstrations and automated tests.
 * Headers can be spoofed by any client and do NOT constitute production authentication.
 * It will be replaced when centralized group authentication is merged.
 */
function requireRole(allowedRoles = []) {
  return (request, response, next) => {
    const roleHeader = request.headers['x-demo-role'];
    const userHeader = request.headers['x-demo-user'];

    if (!roleHeader || !allowedRoles.includes(roleHeader)) {
      return response.status(403).json({
        error: `Forbidden: this action requires one of the following roles: ${allowedRoles.join(', ')}. Received: ${roleHeader || 'none'}.`,
      });
    }

    request.demoUser = {
      role: roleHeader,
      userId: userHeader || 'demo-user',
    };

    next();
  };
}

module.exports = requireRole;
