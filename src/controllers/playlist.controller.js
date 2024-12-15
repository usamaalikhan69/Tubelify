import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body    
    //TODO: create playlist

    if(!name.trim())
    {
        throw new ApiError(400 , `Name cannot be empty`)
    }
    
    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user?._id,
    })
    
    if (!playlist) {
        throw new ApiError(500 , `Error while creating a playlist  `)
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200 , playlist ,  `Playlist created successfully`)
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, 'Invalid user ID');
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                isPublished: true,
            },
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'videos',
                foreignField: '_id',
                as: 'videos',
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
                            title: 1,
                            description: 1,
                            thumbnail: 1,
                            owner: {
                                username: 1,
                                avatar: 1,
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                videosCount: { $size: '$videos' },
                totalViews: { $sum: '$videos.views' },
            },
        },
        {
            $sort: { [sortBy]: sortOrder },
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: parseInt(limit),
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                videosCount: 1,
                totalViews: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    username: 1,
                    avatar: 1,
                },
                videos: {
                    $slice: ['$videos', 5],
                },
            },
        },
    ]);

    if (!playlists) {
        throw new ApiError(404, 'Playlists not found');
    }

    return res.status(200).json(new ApiResponse(200, playlists, 'Playlists fetched successfully'));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID');
    }

    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: 'videos',
            populate: {
                path: 'owner',
                select: 'username avatar',
            },
        })
        .lean()
        .exec();

    if (!playlist) {
        throw new ApiError(404, 'Playlist not found');
    }

    playlist.videosCount = playlist.videos.length;
    playlist.totalViews = playlist.videos.reduce((acc, video) => acc + video.views, 0);

    return res.status(200).json(new ApiResponse(200, playlist, 'Playlist fetched successfully'));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid playlist or video ID');
    }

    const playlist = await Playlist.findOne({ _id: playlistId, owner: req.user._id });
    if (!playlist) {
        throw new ApiError(403, 'You do not have permission to add videos to this playlist');
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, 'Video already exists in the playlist');
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, 'Error adding video to playlist');
    }

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, 'Video added to playlist successfully'));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, 'Invalid playlist or video ID');
    }

    const playlist = await Playlist.findOne({ _id: playlistId, owner: req.user._id });
    if (!playlist) {
        throw new ApiError(403, 'You do not have permission to remove videos from this playlist');
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, 'Video not found in the playlist');
    }

    playlist.videos.pull(videoId);

    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, 'Video removed from playlist successfully'));
});
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, 'Invalid playlist id');
    }
    // Check if playlist exists and belongs to the user
    
    const playlist = await Playlist.findOne({ _id: playlistId, owner: req.user._id });
    if (!playlist) {
        throw new ApiError(403, 'You do not have permission to Delete  this playlist');
    }


    const playlistDelete = await Playlist.findByIdAndDelete(playlistId)
    if (!playlistDelete) {
        throw new ApiError(404, 'Playlist not found');
    }
    return res.status(200).json(new ApiResponse(200, null, 'Playlist deleted successfully'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, 'Invalid playlist ID');
    }
    if (!name) {
        throw new ApiError(400, 'Name  are required');
    }
    if (name.length > 50 || description.length > 255) {
        throw new ApiError(400, 'Name and description length limits exceeded');
    }

    const playlist = await Playlist.findOne({ _id: playlistId, owner: req.user._id });
    if (!playlist) {
        throw new ApiError(403, 'You do not have permission to update this playlist');
    }

    playlist.name = name;
    playlist.description = description;

    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, 'Playlist updated successfully'));
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}