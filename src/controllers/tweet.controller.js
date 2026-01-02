import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import ApiError from "../utils/ApiError";
import { Tweet } from "../models/tweet.model";
import { ApiResponse } from "../utils/ApiResponse";
import { use } from "react";


const createTweet = asyncHandler(async (req, res) => {
    // TODO: create tweet 
    /*
    1. getting the content from the req.body
    2. Check the availability of the content
    3. using the user from the req.user and then save it to the tweet db schema
    4. sending the response
    */ 

    const { content } = req.body

    if(!content){
        throw new ApiError(400, "Content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(400, "Tweet creation failed")
    }

    return res
    .status(201)
    .json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

// const getUserTweet = asyncHandler(async (req, res) => {
//     const {userId} = req.params

//     if(!isValidObjectId(userId)){
//         throw new ApiError(400, "Invalid user access")
//     }

//     const tweet = await Tweet.aggregate([
//         {
//             $match: {
//                 owner: new mongoose.Types.ObjectId(userId)
//             }
//         },
//         {
//             $lookup:  {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "ownerDetails"
//             }
//         },
//         {
//             $unwind: "$ownerDetails"
//         },
//         {
//             $project: {
//                 _id: 1,
//                 content: 1,
//                 createdAt: 1,
//                 username: "$ownerDetails.username",
//                 avatar: "$ownerDetails.avatar"
//             }
//         }
//     ])

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200, tweet, "User tweet fetched successfully")
//     )
// })

const getUserTweet = asyncHandler(async (req,res)=> {
    // TODO: get user tweet

    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User Id")
    }

    const tweet = await Tweet.find({owner: userId}).sort({createdAt: -1})

    if(!tweet){
        throw new ApiError(404, "Tweets not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "User tweet fetched")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    // TODO: update tweet 

    const { tweetId } = req.params
    const { newContent } = req.body

    if(!newContent){
        throw new ApiError(400, "Invalid Content")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId, 
        {
            $set: {
                content: newContent
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Updated tweet successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(404, "Tweet not found or unauthorized")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, tweet, "Deleted tweet successfully")
    )
})


export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}