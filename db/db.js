import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const CONNECTION_INSTANCE = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongodb connection succss at : ${CONNECTION_INSTANCE.connection.host}`);
    } catch (error) {
        console.error("Failed to connect database error :: ", error);
        process.exit(1);
    }
}

export { connectDB }