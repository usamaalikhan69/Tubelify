import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (localFilePath, options = {}) => {
  if (!localFilePath) {
    throw new Error(`Local path file is required for ${localFilePath}`);
  }

  try {
    const uploadOptions = {
      resource_type: options.resource_type || 'auto',
      public_id: options.public_id || Date.now().toString(),
      overwrite: options.overwrite || false,
      eager: options.eager || [],
      transformation: options.transformation || [],
      quality: options.quality || 90,
    };

    const responseOfCloudinary = await cloudinary.uploader.upload(localFilePath, uploadOptions);
    fs.unlinkSync(localFilePath);
    return responseOfCloudinary;
  } catch (error) {
    
    console.error(`Cloudinary upload error: ${error.message}`);
    throw error; 
 }
};

const uploadAvatar = async (localFilePath, options = {}) => {
  const avatarOptions = {
    resource_type: 'image',
    eager: [
      { width: 150, height: 150, crop: 'fill' },
      { width: 50, height: 50, crop: 'fill' },
    ],
    ...options,
  };
  return uploadToCloudinary(localFilePath, avatarOptions);
};

const uploadCoverImage = async (localFilePath, options = {}) => {
  const coverImageOptions = {
    resource_type: 'image',
    eager: [
      { width: 1024, height: 512, crop: 'fill' },
      { width: 512, height: 256, crop: 'fill' },
    ],
    ...options,
  };
  return uploadToCloudinary(localFilePath, coverImageOptions);
};

const uploadVideo = async (localFilePath, options = {}) => {
  const videoOptions = {
    resource_type: 'video',
    eager: [
      {
        width: 1280,
        height: 720,
        crop: 'pad',
        format: 'mp4',
      },
      {
        width: 640,
        height: 360,
        crop: 'pad',
        format: 'mp4',
      },
    ],
    ...options,
  };
  return uploadToCloudinary(localFilePath, videoOptions);
};

const uploadThumbnail = async (localFilePath, options = {}) => {
  const thumbnailOptions = {
    resource_type: 'image',
    eager: [
      { width: 320, height: 180, crop: 'fill' },
      { width: 160, height: 90, crop: 'fill' },
    ],
    ...options,
  };
  return uploadToCloudinary(localFilePath, thumbnailOptions);
};

export {
  uploadAvatar,
  uploadCoverImage,
  uploadVideo,
  uploadThumbnail,
  uploadToCloudinary,
};