import { Router, type IRouter } from "express";
import healthRouter from "./health";
import itemsRouter from "./items";
import storageStatsRouter from "./storageStats";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(itemsRouter);
router.use(storageStatsRouter);
router.use(storageRouter);

export default router;
