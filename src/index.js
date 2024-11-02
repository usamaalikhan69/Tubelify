import { configDotenv } from "dotenv";
import { connectDataBase } from "./db/index.js";


configDotenv({
    path: './env'
})

connectDataBase()

















// import e from "express";
 
// const app = e()



//  ;( async () => {
//     try {
//    await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`)
//  app.on("error" , (error) => {
//     console.log("error cant connect with databse" , error);
// throw error


// app.listen(  process.env.PORT , () => {
// console.log(`app is running on PORT ${process.env.PORT}`)
// })
//  })
//     } catch (error) {
//         console.log(error , "error in connect Data base")
//         throw error
//     }
// })()