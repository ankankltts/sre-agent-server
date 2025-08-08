import express from "express";
import axios from "axios";
import dotevn from "dotenv";
import cors from "cors";

dotevn.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;
const BASE_URL = process.env.PPBASE_URL;
const API_KEY = process.env.API_KEY;


app.get("/api/stations", async (req, res) => {
  try {
     const {startDate,endDate}=req.query
    const url = `${BASE_URL}/api/dcfc-data/station/all_stations`
     console.log("Calling DEV API: ",url)
     const response=await axios.get(url,{
        params:{
             "start-date": startDate,
        "end-date": endDate,
        },
          headers: {
        Authorization: `Bearer ${API_KEY}`
      },
     })
     console.log("Status API: ",response.status)

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});




app.listen(PORT, () => {
  console.log("server is running on port ", PORT);
});
