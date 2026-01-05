import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import router from "../routes/user.routes.js"
import jwt from "jsonwebtoken"
import { json } from "express"
import mongoose from "mongoose"


const generateAccessAndRefreshToken = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        
        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating Access and Refresh token")
    }
}



const registerUser = asyncHandler( async (req, res) =>{

// console.log("REQ FILES:", req.files);
// console.log("REQ BODY:", req.body);
    
// get user details from frontend
// validation - not empty
// check if user already exists - username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from response
// check for user createtion
// return response


// get user details from frontend
const {fullName, email, password, username} = req.body
// console.log("email: ", email);


// validation - not empty

// if(fullName === ""){
//     throw new ApiError(400, "fullname is required");
// }
// This can be used for easy code but following is simpler approach

if(
    [fullName, username, email, password].some((field) =>
    field?.trim() === "")
) {
    throw new ApiError(400, "All fields are required")
}


// check if user already exists - username, email
const existedUser = await User.findOne({
    $or: [{ username },{ email }]
})

if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
}


// check for images, check for avatar

const avatarLocalPath = req.files?.avatar[0]?.path;
// const coverImageLocalPath =  req.files?.coverImage[0]?.path;

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
}

if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required");
}


// upload them to cloudinary, avatar

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400, "Avatar file is required to be uploaded")
}


// create user object - create entry in db

const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
})
// if a new user is created then mongodb always create it using a id i.e. _id
// let us check if a user is actually created

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)
// with checking we also removed refreshToken and password 

// check for user createtion

if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering user")
}


// check for user createtion

return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
)


} )



const loginUser = asyncHandler(async (req, res) => {

    // req body -> data
    // username or email
    // find the user
    // password verification
    // access and refresh token
    // send cookie

    // req body -> data
    const {email, username, password} = req.body

    if(!username && !email){
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(("-password -refreshToken"))

    // const options = {
    //     httpOnly: true,
    //     secure: true
    // }   // to make the cookie secure and cookie cannot be updated from frontend

    const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In successfully"
        )
    )

})



const logoutUser = asyncHandler(async(req, res) => {
    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {refreshToken: 1},  // this removes field from the document
        },
        {
            new: true
        }
    )

    //     const options = {
    //     httpOnly: true,
    //     secure: true
    // }  
    const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})


// const refreshAccessToken = asyncHandler(async (req,res) => {

//     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

//     if(!incomingRefreshToken){
//         throw new ApiError(401, "unathorized access")
//     }

//     try {
//         const decodedToken = jwt.verify(
//             token,
//             process.env.REFRESH_TOKEN_SECRET
//         )
    
//         const user = await User.findById(decodedToken?._id)
    
//         if(!user){
//             throw new ApiError(401, "Invalid refresh token")
//         }
    
//         if(incomingRefreshToken !== user.refreshToken){
//             throw new ApiError(401, "Refresh token is expired or used")
//         }
    
//         const options = {
//             httpOnly: true,
//             secure: true
//         }
    
//         const {accessToken, newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
//         return res
//         .status(200)
//         .cookie("accessToken", accessToken, options)
//         .cookie("refreshToken", newrefreshToken, options)
//         .json(
//             new ApiResponse(
//                 200,
//                 {accessToken, newrefreshToken},
//                 "Access token refreshed successfully"
//             )
//         )
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid refresh token")
//     }


// })

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or already used")
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user._id)

        // const options = {
        //     httpOnly: true,
        //     secure: true,
        //     sameSite: "strict" // ✅ recommended
        // }
        const options = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
};

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed successfully"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    
    user.password = newPassword
    await user.save({validateBeforeSave: false})


    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))


})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})


// const updateAccountDetails = asyncHandler(async(req,res) => {
//     const {fullName, email} = req.body

//     if(!fullName || !email){
//         throw new ApiError(400, "All fields are required")
//     }

//     const user = await User.findByIdAndUpdate(
//         req.body?._id,
//         {
//             $set: {
//                 fullName,
//                 email: email
//             }
//         },
//         {new: true}

//     ).select("-password")

//     return res
//     .status(200)
//     .json(new ApiResponse(200, user, "Account details upadated successfully"))

// })

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email,
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        )
})



const updateUserAvatar = asyncHandler(async(req,res) => {
    
    const avatarLocalPath = req.file.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

// const updateCoverImageAvatar = asyncHandler(async(req,res) => {
    
//     const coverImageLocalPath = req.file.path

//     if(!coverImageLocalPath){
//         throw new ApiError(400, "Cover image file is missing")
//     }

//     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

//     if(!coverImage.url){
//         throw new ApiError(500, "Error while uploading on cover image")
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user._id,
//         {
//             $set: {
//                 avatar: coverImage.url
//             }
//         },
//         {new: true}
//     ).select("-password")

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200, user, "Cover image updated successfully")
//     )
// })

const updateCoverImageAvatar = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage?.url) {
        throw new ApiError(500, "Error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { coverImage: coverImage.url }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})



// const getUserChannelProfile = asyncHandler(async(req, res) => {
    
//     const {username} = req.params

//     if(!username?.trim()){
//         throw new ApiError(400, "username is missing")
//     }

//     const channel = await User.aggregate([
//         {
//             $match: {
//                 username: username?.toLowerCase()
//             }
//         },
//         {
//             $lookup: {
//                 from: "subscriptions",
//                 localField: "_id",
//                 foreignField: "channel",
//                 as: "subscribers"
//             }
//         },
//         {
//             $lookup: {
//                 from: "subscriptions",
//                 localField: "_id",
//                 foreignField: "subscriber",
//                 as: "subscribedTo"
//             }
//         },
//         {
//             $addFields: {
//                 subscribersCount: {
//                     $size: "$subscribers"
//                 },
//                 channelsSubscribedToCount: {
//                     $size: "$subscribedTo"
//                 },
//                 isSubscribed: {
//                     $cond: {
//                         if: {$in: [req.user?._id, "$subscribers.subscriber"]},
//                         then: true,
//                         else: false
//                     }
//                 }
//             }
//         },
//         {
//             $project: {
//                 fullName: 1,
//                 username: 1,
//                 subscribersCount: 1,
//                 channelsSubscribedToCount: 1,
//                 isSubscribed: 1,
//                 avatar: 1,
//                 coverImage: 1,
//                 email: true
//             }
//         }
//     ])

//     if(!channel?.length){
//         throw new ApiError(404, "channel does not exists")
//     }

//     return res
//     .status(200)
//     .json(
//         new ApiResponse(200, channel[0], "User channel fetched successfully")
//     )

// })

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const viewerId = req.user?._id
        ? new mongoose.Types.ObjectId(req.user._id)
        : null

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: viewerId
                    ? { $in: [viewerId, "$subscribers.subscriber"] }
                    : false
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User channel fetched successfully"
            )
        )
})




const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            },
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch History fetched successfully"
        )
    )
})

    



export {registerUser,
    loginUser,
    logoutUser,refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    updateAccountDetails,
    updateCoverImageAvatar,
    getUserChannelProfile,
    getWatchHistory
}

