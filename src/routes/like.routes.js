import { Router } from 'express';
import {
    getLikedVideos,
    toggleLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); 

router.put('/like/:type/:id', asyncHandler(async (req, res) => {
    const { type, id } = req.params;

    try {
         toggleLike(req, res, { type, id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
}));

router.route("/videos").get(getLikedVideos);

export default router;