



import express from "express";
import "dotenv/config";
import { connectDB } from "./db/db.js";
import { globalErrorHandler } "./middlewares/global.middleware.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT;


app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));



app.use(express.json({ limit: "25mb" }));

// Routes 
import picklistRoutes from './routes/picklist.routes.js';
import picklistResponseRoutes from './routes/picklistResponse.routes.js';
import picklistHistoryRoutes from './routes/picklistHistory.routes.js';
import orderNotificationRoutes from "./routes/orderNotifier.routes.js";

app.use("/api/v1/picklist", picklistRoutes);
app.use("/api/v1/picklist-responses", picklistResponseRoutes);
app.use("/api/v1/picklist-history", picklistHistoryRoutes);
app.use("/api/v1/notification", orderNotificationRoutes);

app.use(globalErrorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
}).catch((error) => {
  console.log(`Failed to connect with database error :: ${error}`);
});


