import { Router } from "express";
import   { registerUser ,  loginUser , logoutUser   }  from "../controllers/user.controller.js";
import  { upload }  from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";


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

export default router