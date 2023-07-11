require("dotenv").config();
const jwt = require("jsonwebtoken");
//const config = require("config");

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied. No token provided");
  // 401 is not authorised

  try {
    const decoded = jwt.verify(token, process.env("jwtPrivateKey"));
    req.user = decoded; // this is the payload part of the token
    next();
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

module.exports = auth;
