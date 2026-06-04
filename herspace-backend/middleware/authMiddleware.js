const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated. Please login." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, name }

    next();

  } catch (error) {
    return res.status(401).json({ message: "Session expired. Please login again." });
  }
};

module.exports = protect;