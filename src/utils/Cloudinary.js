import { v2 as cloudinary } from 'cloudinary';
import  fs from "fs"


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    

    const uploadToCloudinary = async (localFilePath) => {
        if(!localFilePath){
            console.error("Local path file is required ")
            return null;
           } 

        try {
            const uploadOptions = {
          resource_type: 'auto',
         };

            // UPLOAD ON CLOUDINARY 
         const responseOfCloudinary =  await cloudinary.uploader.upload(localFilePath , uploadOptions)
            //    FILE HAS BEEN UPLOADED SUCCESSFULLY 
            fs.unlinkSync(localFilePath)
             return responseOfCloudinary
        } catch (error) {
            console.error("error uploading file on cloudinary " , error)
            fs.unlinkSync(localFilePath)
            return null
        }
    }

    export {uploadToCloudinary}


  