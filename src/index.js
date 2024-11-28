import { configDotenv } from "dotenv";
import { connectDataBase } from "./db/index.js";
import { app } from "./app.js";


configDotenv({
    path: './env'
})

connectDataBase()
.then(()=> 
{
    // SERVER PORT STORE IN VARIABLE 
 const serverPort =  process.env.PORT || 3000

//  APP SERVER FUNCTION  TO START THE SERVER  
 app.listen( serverPort , () => 
{
    // LOG SUCCES MESSAGE YOUR SERVER IS RUNNING ON THIS PORT 
    console.log(`Your server  is running on this port  ${ serverPort} `)
})

})
.catch((error)=> 
{
    // LOG AN ERROR MESSAGE CONNECT WITH SERVER
    throw new Error(`THERE is ERORR IN SERVER IN MAIN FILE TO CONNECT WITH SERVOR  ${error.message}`);
    
})

















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