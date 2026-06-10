import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

import {getStationsData} from '../services/getStationsData.js'


dotenv.config();
const router = express.Router();


router.get("/stations", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Invalid dates" });
    }
   
    const data = await getStationsData(startDate, endDate);
    // console.log("data:;;;;;",data);
    

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});




export default router