import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ message: "No token provided" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; 
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }
};



 export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer")) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked by admin",
        code: "USER_BLOCKED",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};



