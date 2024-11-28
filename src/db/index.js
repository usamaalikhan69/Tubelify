import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


// CONNECTION DATABASE FUNCTION 
const connectDataBase = async () => {
try {
    // Validate environment variables
    if (!process.env.MONGO_DB_URI || !DB_NAME) {
        throw new Error("Missing required environment variables");
      }
    // ESTABLISH  SUCCESS DATA CONNECTION 
    const connectionInstance =   await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);

    // LOG SUCCESS MESSAGE 
    console.log(`\n Mongo DB CONNECTED !! DB HOST : ${connectionInstance.connection.host}`)


} 
catch (error) 
{
    // LOG ERROR MESSAGE 
    console.log(`caught error in connecting dataBase MONGO DB in DataBase File js  ${error}` )
    process.exit(1)
} 
}

export {connectDataBase}