import express from "express";

import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // allow all origins

const PORT = process.env.PORT || 5000;



import apiRouter from './routes/apiRouter.js'



app.use('/api',apiRouter)





app.listen(PORT, () => {
  console.log("server is running on port ", PORT);
});
