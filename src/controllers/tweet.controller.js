import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body



    if (!content.trim()) {
        throw new ApiError(`Content cannot be empty`)
    }

    const userTweet = await Tweet.create(
        {
            owner: req.user?._id,
            content,
        }

    )
    if (!userTweet) {
        throw new ApiError(500, "Failed to create tweet")
    }

    await userTweet.save()

    return res.status(201).json(
        new ApiResponse(201, userTweet.toJSON(), "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
  
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }
  
    const userTweets = await Tweet.aggregate([
      {
        $match: { owner: new mongoose.Types.ObjectId(userId) },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            { $project: { username: 1, "avatar.url": 1 } },
          ],
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet",
          as: "likes",
          pipeline: [
            { $project: { likedBy: 1 } },
          ],
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          isLiked: { $in: [req.user?._id, "$likes.likedBy"] },
        },
      },
      {
        $project: {
          content: 1,
          createdAt: 1,
          owner: { $first: "$owner" }, 
          likesCount: 1,
          isLiked: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
  
    return res
    .status(200)
    .json(new ApiResponse(200, userTweets, "Tweets fetched successfully"));
  });

  const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
  
    if (!isValidObjectId(tweetId)) {
      throw new ApiError(401, "Invalid tweet id");
    }
  
    if (!content.trim()) {
      throw new ApiError(401, "content must not be empty");
    }
  
    const tweet = await Tweet.findById(tweetId);
  
    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
  
    if (tweet.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(400, "only owner can edit their tweet");
    }
  
    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      { $set: { content } },
      { new: true }
    );
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
  });

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
      throw new ApiError(400, "Invalid tweet id");
    }

    const tweet = await Tweet.findById(tweetId);

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
      throw new ApiError(400, "only owner can delete thier tweet");
    }
 
    await Tweet.findByIdAndDelete(tweetId);

    return res.status(200).json(
      new ApiResponse(200, {}, "Tweet deleted successfully")
    );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}