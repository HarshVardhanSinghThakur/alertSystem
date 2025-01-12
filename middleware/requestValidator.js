const jwt = require('jsonwebtoken');

const validateRequest = (req, res, next) => {
  // Required headers check
  const requiredHeaders = ['authorization', 'x-api-key'];
  const missingHeaders = requiredHeaders.filter(header => !req.headers[header]);
  
  if (missingHeaders.length > 0) {
    return res.status(400).json({
      error: 'Missing required headers',
      details: `Missing headers: ${missingHeaders.join(', ')}`
    });
  }

  // Token validation
  const token = req.headers.authorization.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      details: error.message
    });
  }
};

module.exports = validateRequest;