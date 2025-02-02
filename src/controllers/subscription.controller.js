import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel ID');
    }
    const existingSubscription = await Subscription.find(
        {
            channel: channelId,
            subscriber: req.user._id
        }
    );

    if (existingSubscription) {
        await existingSubscription.remove();
        res.status(200).json(new ApiResponse(true, 'Subscription removed successfully'))
    } else {
        await Subscription.create(
            {
                channel: channelId,
                subscriber: req.user._id
            }
        );
        res
            .status(201)
            .json(new ApiResponse(true, 'Subscription created successfully'))
    }


})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, 'Invalid channel ID');
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriber'
            }
        },
        {
            $unwind: '$subscriber'
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    avatar: 1,
                    fullName: 1
                }
            }
        }
    ]);

    res.status(200).json(new ApiResponse(200, subscribers, 'Subscriber list retrieved successfully'));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, 'Invalid subscriber ID');
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate('channelSubscriber');

    res.status(200).json(new ApiResponse(200, subscriptions, 'Subscribed channels fetched successfully'));
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}