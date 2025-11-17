
import express from "express";
import "dotenv/config";
import { connectDB } from "./db/db.js";
import { globalErrorHandler } from "./middlewares/global.middleware.js";
import cors from "cors";
const app = express();
const PORT = process.env.PORT;

app.use(express.json({}));
app.use(cors());

// Routes 
import picklistRoutes from './routes/picklist.routes.js';
import picklistResponseRoutes from './routes/picklistResponse.routes.js';
import picklistHistoryRoutes from './routes/picklistHistory.routes.js';
import orderNotificationRoutes from "./routes/orderNotifier.routes.js"
import secondAttemptRoutes from "./routes/secondAttempt.routes.js";


app.use((req, res, next) => {
    console.log("Request received:", req.method, req.originalUrl);
    next();
});

// Registering Routes 

app.use("/api/v1/picklist", picklistRoutes);
app.use("/api/v1/picklist-responses", picklistResponseRoutes);
app.use("/api/v1/picklist-history", picklistHistoryRoutes);

// order notification routes 

app.use("/api/v1/notification", orderNotificationRoutes)

// second attempt routes 
app.use("/api/v1/second_attempt", secondAttemptRoutes);


app.use(globalErrorHandler)
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on ${PORT}`)
    })
}).catch((error) => {
    console.log(`Failed to connect with database error :: ${error}`);
})


