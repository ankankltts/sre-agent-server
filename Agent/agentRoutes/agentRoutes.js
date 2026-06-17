import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

import {langchainAgentController} from '../agentController/agentController.js'

const router=express.Router()


router.post("/query",langchainAgentController)

export default router
