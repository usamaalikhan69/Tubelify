import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadThumbnail, uploadVideo } from "../utils/Cloudinary.js"




const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  // TODO: get video, upload to cloudinary, create video

  if ([title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "title and description is required")
  }

  const videoLocalPath = req.file?.videoFile[0].path
  const thumbnailLocalPath = req.file?.thumbnail[0].path

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required")
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required")
  }

  const videoData = await uploadVideo(videoLocalPath, "video")
  const thumbnailData = await uploadThumbnail(thumbnailLocalPath, "thumbnail")

  if (!videoData.url) {
    throw new ApiError(400, "Error while uploading on video on cloudinary ")
  }

  if (!thumbnailData.url) {
    throw new ApiError(400, "Error while uploading on thumbnail on cloudinary ")
  }

  const video = await Video.create(
    {
      title,
      description,
      videoFile: {
        url: videoFile.url,
        public_id: videoFile.public_id

      },
      thumbnail: {
        url: thumbnailData.url,
        public_id: thumbnailData.public_id,
      },
      duration: videoData?.info?.duration,
      isPublished: false,
      owner: req.user?._id,
    }
  )

  if (!video) {
    throw new ApiError(403, "Video not found")
  }

  res.
    status(201)
    .json(
      new ApiResponse(200, video, "Video Uploaded Successfully"))
})


const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {

    // Validate input
    if (!isValidObjectId(videoId) || !isValidObjectId(req.user?._id)) {
      throw new ApiError(400, "Invalid videoId or userId");
    }


    const video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $lookup: {
                from: "subscriptions",
                let: { userId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$subscriber", "$$userId"]
                      }
                    }
                  }
                ],
                as: "subscribers"
              }
            },
            {
              $addFields: {
                subscribersCount: { $size: "$subscribers" },
                isSubscribed: { $gt: [{ $size: "$subscribers" }, 0] }
              }
            },
            {
              $project: {
                username: 1,
                "avatar.url": 1,
                subscribersCount: 1,
                isSubscribed: 1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          owner: { $first: "$owner" },
          isLiked: {
            $in: [req.user?._id, "$likes.likedBy"]
          }
        }
      },
      {
        $project: {
          "videoFile.url": 1,
          title: 1,
          description: 1,
          views: 1,
          createdAt: 1,
          duration: 1,
          comments: 1,
          owner: 1,
          likesCount: 1,
          isLiked: 1
        }
      }
    ]);

    if (!video || !video.length) {
      throw new ApiError(500, "Failed to fetch video");
    }

    // Increment views and add to watch history

    await Promise.all([
      Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }),
      User.findByIdAndUpdate(req.user?._id, { $addToSet: { watchHistory: videoId } }),
    ]);

    return res.status(200)
      .json(
        new ApiResponse(200, video[0], "Video details fetched successfully")
      );
  } catch (error) {
    console.error('Error fetching video:', error);
    throw new ApiError(500, "Failed to fetch video");
  }
});


const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  const pipeline = [
    ...(query
      ? [
        {
          $match: {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
            ],
          },
        },
      ]
      : []),
    { $match: { isPublished: true } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              avatar: 1,
              username: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
    {
      $project: {
        _id: 1,
        owner: 1,
        videoFile: 1,
        thumbnail: 1,
        createdAt: 1,
        description: 1,
        title: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $facet: {
        totalCount: [{ $count: 'count' }],
        results: [
          { $skip: (page - 1) * limit },
          { $limit: parseInt(limit) },
        ],
      },
    },
  ];

  try {
    const result = await Video.aggregate(pipeline);
    const videos = result[0].results;
    const totalCount = result[0].totalCount[0].count;

    if (!videos.length) {
      throw new ApiError(404, "No videos found");
    }

    return res.status(200).json({
      data: videos,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new ApiError(500, 'Failed to fetch videos');
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  // Validate input

  if (!isValidObjectId(videoId) || !isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid videoId or userId");
  }

  if (![title, description].some((field) => field.trim() === "")) {
    throw new ApiError(400, "Invalid title or description");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Unauthorized to update this video");
  }

  let videoData = video.videoFile;
  let thumbnailData = video.thumbnail;

  if (req.file) {

    await Promise.all([
      cloudinary.uploader.destroy(video.videoFile.public_id),
      cloudinary.uploader.destroy(video.thumbnail.public_id),
    ]);

    const { videoData: newVideoData, thumbnailData: newThumbnailData } = await Promise.all([
      uploadVideo(req.file.path, 'video'),
      uploadThumbnail(req.file.thumbnail[0].path, 'thumbnail'),
    ]);

    videoData = newVideoData;
    thumbnailData = newThumbnailData;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { title, description, videoFile: videoData, thumbnail: thumbnailData },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, 'Failed to update video');
  }

  return res
  .status(200)
  .json(new ApiResponse(200, updatedVideo, 'Video updated successfully')
);
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate input
  if (!isValidObjectId(videoId) || !isValidObjectId(req.user?._id)) {
    throw new ApiError(400, "Invalid videoId or userId");
  }

  const video = await Video.findById(videoId);
  

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete this video");
  }

  try {
    await Promise.all([
      Video.findByIdAndDelete(videoId),
      Like.deleteMany({ video: videoId }),
      Comment.deleteMany({ video: videoId }),
      cloudinary.uploader.destroy(video.thumbnail.public_id),
      cloudinary.uploader.destroy(video.videoFile.public_id, { resource_type: 'video' }),
    ]);

    res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    console.error('Error deleting video:', error);
    throw new ApiError(500, 'Failed to delete video');
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!(isValidObjectId(videoId) || isValidObjectId(req.user?._id))) {
    throw new ApiError(400, "Invalid videoId or userId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video?.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "Unauthorized to delete this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, {} , "Video status updated successfully"
      ));

})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
}