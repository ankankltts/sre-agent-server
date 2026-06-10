import { processAgentQuery } from "../agentServices/agentService.js";
import {getStationsData} from '../../services/getStationsData.js'


export const agentController = async (req, res) => {
  try {
    const { query, startDate, endDate  } = req.body;

    const stationsData = await getStationsData(startDate, endDate);
    // console.log("[AgentController] Stations data:", stationsData);


    const result = await processAgentQuery({
      query,
      stationsData,
     
      
    });

    res.status(200).json(result);

  } catch (err) {
    console.error("[AgentController Error]", err.message);

    res.status(500).json({
      error: err.message
    });
  }
};