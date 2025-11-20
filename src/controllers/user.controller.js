import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import router from "../routes/user.routes.js"



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



export {registerUser}

