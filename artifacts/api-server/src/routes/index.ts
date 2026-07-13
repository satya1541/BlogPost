import { Router, type IRouter } from "express";
import healthRouter from "./health";
import articlesRouter from "./articles";
import topicsRouter from "./topics";
import seriesRouter from "./series";
import searchRouter from "./search";
import newsletterRouter from "./newsletter";

const router: IRouter = Router();

router.use(healthRouter);
router.use(articlesRouter);
router.use(topicsRouter);
router.use(seriesRouter);
router.use(searchRouter);
router.use(newsletterRouter);

export default router;
