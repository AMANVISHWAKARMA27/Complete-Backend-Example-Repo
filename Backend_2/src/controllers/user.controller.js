import { asyncHandler } from "../utils/asynchandler.js"
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiResponse } from "../utils/apiResponse.js"

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
    const { username, email, fullname, password } = req.body
    console.log("email: ", email) // checking if we are able to access the fields

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
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiError(409, "User wil email or username alreadyu exists.")
    }

    // -------------------step 4 and step 5----------------------//

    //multer adds a new field to req- files
    // files has a field named avatar which has object.So we want first object of avatar.
    // Then we access the path of the first object.
    const avatarLocalPath = req.files?.avatar[0]?.path // its on s=our local
    console.log("from req: ",req)
    console.log("from req.files: ",req.files)
    console.log("from req.files.avatar: ",req.files?.avatar)

    const coverImageLocalPath = req.files?.coverImage[0]?.path // same as above
    console.log("from req.files.coverImage: ",req.files?.coverImage)

    if (!avatarLocalPath){
        throw new apiError(400, "Avatar is required.")
    }

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new apiError(400, "Avatar is required.")
    }

    // --------------------step 6 and step 7 and step 8-----------------------//
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // this verffies if we really has a user or not
    // actually, mongodb automatically adda field call '_id', to differentiate between data
    // we are using this _id to clearify.
    const createdUser = await User.findById(uer._id)
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

export { registerUser }