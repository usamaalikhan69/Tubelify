import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user?._id;


    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }
    
    const [totalSubscribers, totalVideos] = await Promise.all([
        Subscription.countDocuments({ channelSubscriber: userId }),
        Video.aggregate([
            { $match: { owner: userId } },
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: "$likes" }
                }
            }
        ])
    ]);

    const channelStats = {
        totalSubscribers,
        totalVideos: totalVideos[0]?.totalVideos || 0,
        totalViews: totalVideos[0]?.totalViews || 0,
        totalLikes: totalVideos[0]?.totalLikes || 0
    };

    return res.status(200).json(new ApiResponse(200, channelStats, 'Channel stats fetched successfully'));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }
    
    const videos = await Video.aggregate([{
        $match: {
            owner: new mongoose.Types.ObjectId(userId)
        }

    },
    {
     $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'likes'
     }
    },
    {
        $addFields: {
            createdAt: {
                $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt'
                }
            },
            likesCount: {
                $size: '$likes'
            }
        }
    } ,
    {
        $sort: { createdAt: -1 }
    },
    {
        $skip: (page - 1) * limit
    },
    {
        $limit: parseInt(limit)
    },
    {
        $project: {
            _id: 1,
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            createdAt: {
                $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$createdAt'
                }
            },
            duration: 1,
            views: 1,
            likesCount: 1,
            isPublished: 1,
            likesCount: 1
        }
    }

])
    return res.status(200)
    .json(new ApiResponse(200, videos, 'Channel videos fetched successfully'));
})

export {
    getChannelStats,
    getChannelVideos
}