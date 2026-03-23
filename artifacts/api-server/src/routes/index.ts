import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import providersRouter from "./providers";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/openai", openaiRouter);
router.use(providersRouter);

export default router;
