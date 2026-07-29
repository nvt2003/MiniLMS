import express from "express";
import { getSettings } from "../controllers/setting.controller.js";

const router = express.Router();

router.get("/:group", getSettings);

export default router;