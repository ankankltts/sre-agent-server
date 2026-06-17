
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
const SESSION_DATA=process.env.CHARGING_SESSION_DATA


export const getStationsData = async (startDate, endDate) => {
  const url = `${BASE_URL}/api/dcfc-data/station/all_stations`;

  const { data = [] } = await axios.get(url, {
    params: { startDate, endDate },
    headers: { Authorization: `Bearer ${API_KEY}` },
    // timeout: 100000
  });
  
   
   
   const sortedData=sortAndProjectByLmId(data, stationMapData, necessaryDataFunction)

   
  return sortedData;
};
