import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/Cloudinary.js"
import jwt from "jsonwebtoken"



// METHOD FOR USING GEBERATE AND ACCESSTOKEN

const generateAccessAndRefreshTokens = async (userId) => {
  try {
   const user =  await  User.findById(userId);
   const accessToken =   user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()
   user.refreshToken = refreshToken
   await user.save({validateBeforeSave: false})
   return {refreshToken , accessToken}
  } catch (error) {
    throw new ApiError(500 , "something went wrong while generating refresh and access Token");
    
  }
}


 const registerUser = asyncHandler(async (req , res) => {

    // get user details such  as username email password fullname etc
    // validate the user check user isnt sending a empty field 
    // check if user already exist with username and email
    // check both images - avator image is compulsory 
    // check  file images uploaded on multer successfully then upload on cloudinary
    // then create a databse object because this is no sql 
    // then send response on front end just not send password and refresh token

  const {fullName , email , username , password}  =  req.body
     
  console.log("body params " , req.body);
  

  
    if([fullName , email , username , password].some((field) => field?.trim()  ===  ""))
        {
            throw new ApiError(401 , "the Fields is required");
    }

 const existedUser = await User.findOne({
  $or: [ { username } , { email } ]
 })
 console.log(existedUser ,  "check existed user ");
 
 
 if(existedUser){
  throw new ApiError(409 , "User already exist");
 }

 const avatarLocalPath = req.files?.avatar[0]?.path
//  const coverImageLocalPath = req.files?.coverImage[0]?.path

 console.log(req.files);
 

 if (!avatarLocalPath) {
  throw new ApiError(400 , "Avatar is required");
 }


 let coverImageLocalPath;

 if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
  coverImageLocalPath = req.files.coverImage[0].path
 }

 const avatar = await uploadToCloudinary(avatarLocalPath)
 const coverImage = await uploadToCloudinary(coverImageLocalPath)

 if (!avatar) {
  throw new ApiError(400 , "Avatar is required");
 }
  



  const userCreation =  await User.create({
      fullName,
      email,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      username: username.toLowerCase(),
      password
    })
 const createdUser = await User.findById(userCreation._id).select(
  "-password -refreshToken"
 )

 console.log(createdUser , "check created user here");
 

if (!createdUser) {
  throw new ApiError(500 , "something went wrong while register the user");
  
}
 
return res.status(201).json( 
  new ApiResponse(200 , createdUser , 'User registerd successfully')
 )
 console.log(res.status , "check res.status");
 
})

const loginUser = asyncHandler(async (req , res ) => {
//  data extact user from => req body
//  user can login with username or email 
//  password is match with registration  password user can access 
//  when user give correct password then generate access token and refresh token 
//  send the data access token and refresh token with in cookies secure cookies 


   const {username , email , password } = req.body

   if (!(username || email)) {
    throw new ApiError(402 , "Username or Email is required ");      
   }
  
  const user =   await User.findOne({
      $or: [ { email } , { username } ]
    })

    if (!user) {
      throw new ApiError(404 ,"User doesnt   exist ");
      
    }
 
  const isPasswordvalid =  await user.isPasswordCorrect(password)

  if (!isPasswordvalid) {
    throw new ApiError(401 ,"invalid user credentials");
    
  }

   const { accessToken , refreshToken }  =  await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select(
  "-password -refreshToken"
)
const options = {
  httpOnly: true,
  secure: true,
}

return res.status(200)
.cookie("accessToken" , accessToken , options)
.cookie("refreshToken" , refreshToken , options)
.json(
  new ApiResponse(
    200,
{ user: loggedInUser , accessToken , refreshToken} , "User Logged In SuccessFully" )
)
    

})

const logoutUser = asyncHandler(async (req , res) => {
 await User.findByIdAndUpdate(req.user._id , {
    $set: {
      refreshToken: undefined
    }   
  }, {
    new: true
  })

  const options = {
    httpOnly: true,
    secure: true,
  }

  res
  .status(200)
  .clearCookie('accessToken' , options)
  .clearCookie('refreshToken' , options)
  .json(new ApiResponse(200 , {} , "User Logged Out"))
})


const refreshAccessToken = asyncHandler(async (req , res)=> {
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

 if (!incomingRefreshToken) {
throw new ApiError(401 , "Unauthorized Request");
}
 try {
  const decodedToken =   jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
   
 const user = await User.findById(decodedToken?._id)
 
 if (!user) {
   throw new ApiError(401  ,"Invalid Refresh Token");
   
 }
 
 if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401 ,"Refresh Token is expired or used");
    
 }
 const options = {
   httpOnly: true,
   secure: true 
 
 }
  const {accessToken , newrefreshToken} = await generateAccessAndRefreshTokens(user._id , options)
 
  return res
  .status(200)
  .cookie("accessToken" , accessToken , options)
  .cookie("refreshToken" , newrefreshToken , options)
  .json(
   new ApiResponse(200 , 
     {accessToken , refreshToken: newrefreshToken },
     "Access Token Refreshed"
   )
  )
 } catch (error) {
  throw new ApiError(401 , error?.message  || "invalid Refresh Token" );
  
 }


}) 






export  {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
}