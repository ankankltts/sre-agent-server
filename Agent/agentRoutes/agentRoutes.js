import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

import {agentController} from '../agentController/agentController.js'

const router=express.Router()


router.post("/query",agentController)

export default router
