import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";



const connectDataBase = async () => {
try {
    const connectionInstance =   await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`);
    console.log(`\n Mongo DB CONNECTED !! DB HOST : ${connectionInstance.connection.host}`)


} catch (error) {
    console.log(`caught error in connecting dataBase MONGO DB in DataBase File js  ${error}` )
    process.exit(1)
} 
}

export {connectDataBase}