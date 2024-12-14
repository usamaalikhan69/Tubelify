import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleLike = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid ID');
  }

  if (!['video', 'comment', 'tweet'].includes(type)) {
    throw new ApiError(400, 'Invalid content type');
  }

  const likeField = `${type}`;

  try {
    const like = await Like.findOne({ [likeField]: id, likedBy: req.user?._id });

    if (like) {
      await like.deleteOne();
      return res.status(200).json(new ApiResponse(200, `${type} like removed successfully`));
    } else {
      await Like.create({ [likeField]: id, likedBy: req.user?._id });
      return res.status(201).json(new ApiResponse(201, `${type} like created successfully`));
    }
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json(new ApiResponse(400, 'Validation error: ' + error.message));
    } else {
      console.error(error);
      return res.status(500).json(new ApiResponse(500, 'An error occurred'));
    }
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'likedVideos',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
            },
          },
          {
            $project: {
              _id: 1,
              videoFile: 1,
              thumbnail: 1,
              createdAt: 1,
              description: 1,
              title: 1,
              duration: 1,
              owner: {
                username: 1,
                'avatar.url': 1,
              },
            },
          },
        ],
      },
    },
    {
      $unwind: '$likedVideos',
    },
    {
      $sort: { 'likedVideos.createdAt': -1 },
    },
    {
      $project: {
        _id: '$likedVideos._id',
        videoFile: '$likedVideos.videoFile',
        thumbnail: '$likedVideos.thumbnail',
        createdAt: '$likedVideos.createdAt',
        description: '$likedVideos.description',
        title: '$likedVideos.title',
        duration: '$likedVideos.duration',
        owner: '$likedVideos.owner',
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, 'Liked videos', likedVideos));
});

export {
    toggleLike,
    getLikedVideos
}