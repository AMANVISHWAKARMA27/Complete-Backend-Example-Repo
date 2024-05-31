import { asyncHandler } from "../utils/asynchandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"

const generateAcessAndrefreshTokens = async (userId) => {
    try {
        const existedUser = await User.findById(userId)
        const accessToken = existedUser.generateAccessToken()
        const refreshToken = existedUser.generateRefreshToken()

        existedUser.refreshToken = refreshToken
        await existedUser.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new apiError(500, "Something went wrong while generating access and refresh token.")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username and email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh toke from response
    // check or user creation 
    // return response/error

    // ----------------step 1 and step 2 and step 3--------------------
    const { fullname, email, username, password } = req.body
    // console.log("email: ", email) // checking if we are able to access the fields

    // if (fullname === "") {
    //     throw new apiError(400, 'fullname is required')
    // }

    // The below one and above one, both are the different methods of validation
    // we can use either of the two.
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are compulsory.")
    }

    // findOne with or will check if anyOne one of the filed satisfies a condition.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User wil email or username already exists.")
    }

    // -------------------step 4 and step 5----------------------//

    //multer adds a new field to req- files
    // files has a field named avatar which has object.So we want first object of avatar.
    // Then we access the path of the first object.

    // console.log("avatar: ", req.files)
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }
    // console.log("avatarLocalPath", avatarLocalPath)

    // console.log("from req: ", req)
    // console.log("from req.files: ", req.files)
    // console.log("from req.files.avatar: ", req.files?.avatar)

    // const coverImageLocalPath = req.files?.coverImage[0]?.path // same as above
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    // console.log("from req.files.coverImage: ", req.files?.coverImage)

    // if (!avatarLocalPath) {
    //     throw new apiError(400, "Avatar is required.")
    // }
    // console.log("avatar: ", avatarLocalPath)

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    // console.log("coverimage: ", coverImageLocalPath)

    // if (!avatar) {
    //     throw new apiError(400, "Avatar is required.")
    // }

    // --------------------step 6 and step 7 and step 8-----------------------//
    const user = await User.create({
        fullname,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // this verffies if we really has a user or not
    // actually, mongodb automatically adda field call '_id', to differentiate between data
    // we are using this _id to clearify.
    const createdUser = await User.findById(user._id)
        // this will select all the field and remove password and refreshToken
        .select(
            "-password -refreshToken"
        )
    if (!createdUser) {
        throw new apiError(500, "Something went wrong registering the user.")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User registered successfully.")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // req boyd -> data
    // username or email
    // find the user
    // password check
    // access and refresh token generation
    // send cookies

    const { email, username, password } = req.body
    if (!username || !email) {
        throw new apiError(400, "username or email is required.")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!existedUser) {
        throw new apiError(404, "User does not exist.")
    }

    const isPasswordValid = await existedUser.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new apiError(401, "Invalid user credentials.")
    }

    // create method to for access and refresh token.
    const { accessToken, refreshToken } = await generateAcessAndrefreshTokens(existedUser._id)

    // send them to cookies

    const loggedInUser = await User.findById(existedUser._id)
        .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookies("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200, {
                existedUser: loggedInUser, accessToken, refreshToken
            }, "User logged in successfully.")
        )

})

const logoutUser = asyncHandler(async(req, res) => {
    // get user
    // remove cookies
    // reset access and refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // update selected field
            $set:{
                refreshToken: undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, {}, "User logged out duccessfully."))

})

export {
    registerUser,
    loginUser,
    logoutUser
}