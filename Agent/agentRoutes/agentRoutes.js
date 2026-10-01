import express from "express";
import multer from "multer";

import { evQueryController } from "../agentController/agentController.js";
import { proactiveAgentStreamController } from "../agentController/proactiveAgentController.js";

import {logAnalyserController } from "../agentController/logAnalyserController.js"


const router = express.Router();


const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});


router.post("/query", evQueryController);

router.get("/proactive-stream", proactiveAgentStreamController);

router.post("/logs/analyse", upload.single("file"), logAnalyserController)

export default router;