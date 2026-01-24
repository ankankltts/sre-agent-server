import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

import {necessaryDataFunction} from '../utils/necessaryDataFunction.js'
import { stationMapData } from '../utils/stationMapData.js'
import { sortAndProjectByLmId } from '../utils/stations.js';

dotenv.config();
const router = express.Router();

const BASE_URL = process.env.PPBASE_URL;
const API_KEY = process.env.API_KEY;


router.get('/stations', async (req, res) => {

  try {
    const { startDate, endDate } = req.query
    
    const url = `${BASE_URL}/api/dcfc-data/station/all_stations`
    // console.log("API_URL ", url)
    const response = await axios.get(url, {
      params: {
        "startDate": startDate,
        "endDate": endDate,
      },
      headers: {
        Authorization: `Bearer ${API_KEY}`
      },
    })
   const apiData = response?.data ?? [];
   

const minimal = sortAndProjectByLmId(apiData, stationMapData, necessaryDataFunction);
    // console.log(minimal);

    res.status(200).json({
      success:true,
      data:minimal
    });


  } catch (error) {
    // console.log("error",error);
    res.status(500).json({ error});
  }

});

export default router