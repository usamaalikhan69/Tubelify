import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    try {
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, 'Invalid video ID');
        }

        const comments = await Comment.aggregate([
            {
                $match: { video: new mongoose.Types.ObjectId(videoId) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        { $project: { username: 1, "avatar.url": 1 } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likesCount: { $size: "$likes" },
                    isLiked: { $in: [req.user?._id, "$likes.likedBy"] }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    owner: { $first: "$owner" },
                    likesCount: 1,
                    isLiked: 1
                }
            }
        ]);

        if (comments.length === 0) {
            throw new ApiError(404, "No comments found for this video");
        }

        return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw new ApiError(500, 'Failed to fetch comments');
    }
});
const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.query
    const { content } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID provided")
    }

    if (!content.trim()) {
        throw new ApiError(401, "content cannot be empty")
    }

    // NOW WE HAVE TO CREATE A NEW COMMENT INSTANCE 

    const newComment = await Comment.create(
        {
            video: videoId,
            owner: req.user._id,
            content,
        }
    )

    if (!newComment) {
        throw new ApiError(404, "Comment not found Please try again")
    }

    await newComment.save()

    await Video.findByIdAndUpdate(videoId, { $inc: { commentCount: 1 } })

    return res
        .status(201)
        .json(
            new ApiResponse(201, newComment.toJSON(), " Comment Created Successfully ")
        )


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID provided")
    }

    if (!content.trim()) {
        throw new ApiError(401, "content cannot be empty")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }


    if (commentId?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorized to Update  this Comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(

        comment?._id,
        { $set: { content } },
        { new: true }

    )

    if (!updatedComment) {
        throw new ApiError(404, "Comment not found Please try again")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment.toJSON(), "Comment Updated Successfully")
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    try {
        // Validate input
        if (!isValidObjectId(commentId)) {
            throw new ApiError(400, 'Invalid comment ID');
        }

        const comment = await Comment.findById(commentId).populate('likes');
        if (!comment) {
            throw new ApiError(404, 'Comment not found');
        }

        if (comment.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Unauthorized to delete this comment');
        }

        await comment.deleteOne();

        await Video.findByIdAndUpdate(comment.video, { $inc: { commentCount: -1 } });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Comment deleted successfully'));
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw new ApiError(500, 'Failed to delete comment');
    }
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}