import { Router, type IRouter } from "express";
import "../types/session";

const router: IRouter = Router();

router.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: "Failed to logout" });
      return;
    }
    res.clearCookie("finn.sid");
    res.json({ message: "Logged out" });
  });
});

export default router;
