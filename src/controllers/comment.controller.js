import mongoose, {isValidObjectId} from "mongoose";
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const getVideoComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id")
    }

    const options = {
        page: Number(page),
        limit: Number(limit)
    }

    const myAggregateComment = Comment.aggregate([
    {
        $match: {
        video: new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "commentor"
        }
    },
    { $unwind: "$commentor" },

    // 🔥 ADD LIKE LOOKUP
    {
        $lookup: {
        from: "likes",
        let: { commentId: "$_id" },
        pipeline: [
            {
            $match: {
                $expr: {
                $eq: ["$comment", "$$commentId"]
                }
            }
            }
        ],
        as: "likes"
        }
    },

    {
        $addFields: {
        likesCount: { $size: "$likes" },
        isLiked: {
            $in: [req.user._id, "$likes.likedBy"]
        }
        }
    },

    {
        $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        likesCount: 1,
        isLiked: 1,
        "commentor._id": 1,
        "commentor.username": 1,
        "commentor.avatar": 1,
        "commentor.fullName": 1
        }
    }
    ])

    Comment.aggregatePaginate(myAggregateComment, options, (err, result) => {
        if (err) {
            throw new ApiError(400, "Error fetching comments")
        }

        return res.status(200).json(
            new ApiResponse(200, result, "Got all video comments successfully")
        )
    })
})

const addComment = asyncHandler(async (req, res)=>{
    // TODO: add a comment to a video 

    /*
        1. take the content from the user
        2. check the existence of it 
        3. Then, get the video id from the server
        4. get the user id from the req.user (token)
        5. Then, save them in the comments db
    */

    const videoId = req.params.videoId
    const {content} = req.body
    const userId= req.user._id

    if(!content){
        throw new ApiError(400, "Content is Invalid")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user Id")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment added to the video successfully")
    )
})

const updateComment = asyncHandler(async (req, res)=>{
    // TODO: update a comment

    /*
        1. get the commentId from the params
        2. get and update the comment schema
        3. then, send the response
    */

    const {commentId} = req.params
    const {updateContent} = req.body
    const userId = req.user._id

    if(!updateContent){
        throw new ApiError(404, "Updated content of comment not found")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id")
    }

    const updatedComment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: userId }, // 👈 ownership check
        { $set: { content: updateContent } },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res)=>{
    // TODO: delete a comment 

    const {commentId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: userId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment, "Comment deleted successfully")
    )
})

export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}