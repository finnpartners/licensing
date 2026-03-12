import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import logoutRouter from "./logout";
import adminDashboardRouter from "./admin-dashboard";
import adminClientsRouter from "./admin-clients";
import adminProductsRouter from "./admin-products";
import adminLicensesRouter from "./admin-licenses";
import adminSettingsRouter from "./admin-settings";
import publicRouter from "./public";
import { requireAuth } from "../middlewares/auth";
import { csrfProtection, getCsrfToken } from "../middlewares/csrf";

const router: IRouter = Router();

router.use(healthRouter);
router.use(publicRouter);

router.use(authRouter);

router.get("/csrf-token", getCsrfToken);
router.use(csrfProtection);

router.use(logoutRouter);

router.use(requireAuth);
router.use(adminDashboardRouter);
router.use(adminClientsRouter);
router.use(adminProductsRouter);
router.use(adminLicensesRouter);
router.use(adminSettingsRouter);

export default router;
