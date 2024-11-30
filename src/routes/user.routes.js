import { Router } from "express";
import   { registerUser ,  loginUser , logoutUser  , refreshAccessToken , changeCurrentPassword , getCurrentUser , updateUserProfile , updateUserAvatar , updateUserCoverImage , getUserChannelprofile , getUserWatchHistory}  from "../controllers/user.controller.js";
import  { upload }  from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/registers").post( 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }]),
    registerUser 
)

router.route('/login').post( loginUser )

//SECURED ROUTES

router.route("/logout").post( verifyJwt , logoutUser )
router.route("/refresh-token").post(refreshAccessToken)
router.route("change-password").post(verifyJwt , changeCurrentPassword)
router.route("/current-user").get(verifyJwt , getCurrentUser)
router.route("/update-profile").patch(verifyJwt , updateUserProfile)
router.route("/profile-avatar").patch(verifyJwt ,upload.single("avatar")  , updateUserAvatar)
router.route("/profile-coverImage").patch(verifyJwt ,upload.single("coverImage")  , updateUserCoverImage)
router.route("/c/:username").get(verifyJwt ,  getUserChannelprofile)
router.route("/watch-history").get(verifyJwt , getUserWatchHistory)



export default router