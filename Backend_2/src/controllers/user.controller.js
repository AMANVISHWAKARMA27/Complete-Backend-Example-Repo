import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAcessAndrefreshTokens = async (userId) => {
    try {
        const existedUser = await User.findById(userId);
        const accessToken = existedUser.generateAccessToken();
        const refreshToken = existedUser.generateRefreshToken();

        existedUser.refreshToken = refreshToken;
        await existedUser.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new apiError(
            500,
            "Something went wrong while generating access and refresh token."
        );
    }
};

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
    const { fullname, email, username, password } = req.body;
    // console.log("email: ", email) // checking if we are able to access the fields

    // if (fullname === "") {
    //     throw new apiError(400, 'fullname is required')
    // }

    // The below one and above one, both are the different methods of validation
    // we can use either of the two.
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new apiError(400, "All fields are compulsory.");
    }

    // findOne with or will check if anyOne one of the filed satisfies a condition.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new apiError(409, "User wil email or username already exists.");
    }

    // -------------------step 4 and step 5----------------------//

    //multer adds a new field to req- files
    // files has a field named avatar which has object.So we want first object of avatar.
    // Then we access the path of the first object.

    // console.log("avatar: ", req.files)
    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        avatarLocalPath = req.files.avatar[0].path;
    }
    // console.log("avatarLocalPath", avatarLocalPath)

    // console.log("from req: ", req)
    // console.log("from req.files: ", req.files)
    // console.log("from req.files.avatar: ", req.files?.avatar)

    // const coverImageLocalPath = req.files?.coverImage[0]?.path // same as above
    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    // console.log("from req.files.coverImage: ", req.files?.coverImage)

    // if (!avatarLocalPath) {
    //     throw new apiError(400, "Avatar is required.")
    // }
    // console.log("avatar: ", avatarLocalPath)

    // upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
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
        username: username.toLowerCase(),
    });

    // this verffies if we really has a user or not
    // actually, mongodb automatically adda field call '_id', to differentiate between data
    // we are using this _id to clearify.
    const createdUser = await User.findById(user._id)
        // this will select all the field and remove password and refreshToken
        .select("-password -refreshToken");
    if (!createdUser) {
        throw new apiError(500, "Something went wrong registering the user.");
    }

    return res
        .status(201)
        .json(new apiResponse(200, createdUser, "User registered successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
    // req boyd -> data
    // username or email
    // find the user
    // password check
    // access and refresh token generation
    // send cookies

    const { email, username, password } = req.body;
    if (!username && !email) {
        throw new apiError(400, "username or email is required.");
    }

    //alternative code
    // if (!(username || email)) {
    //     throw new apiError(400, "username or email is required.")
    // }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (!existedUser) {
        throw new apiError(404, "User does not exist.");
    }

    const isPasswordValid = await existedUser.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new apiError(401, "Invalid user credentials.");
    }

    // create method to for access and refresh token.
    const { accessToken, refreshToken } = await generateAcessAndrefreshTokens(
        existedUser._id
    );

    // send them to cookies

    const loggedInUser = await User.findById(existedUser._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    existedUser: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully."
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    // get user
    // remove cookies
    // reset access and refresh token
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // update selected field
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new apiResponse(200, {}, "User logged out successfully."));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // refresh tokne sent by the user.
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    // if the incoming token is not present
    try {
        if (!incomingRefreshToken) {
            throw new apiError(401, "Unauthorized request.");
        }

        // verify token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const existedUser = await User.findById(decodedToken?._id);

        if (!existedUser) {
            throw new apiError(401, "Invalid refresh token.");
        }

        if (incomingRefreshToken !== existedUser?.refreshToken) {
            throw new apiError(401, "Refresh token is expired or used.");
        }

        // generate new access token
        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, newRefreshToken } =
            await generateAcessAndrefreshTokens(existedUser._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiResponse(200, { accessToken, refreshToken: newRefreshToken }),
                "Access token refreshed successfully."
            );
    } catch (error) {
        throw new apiError(401, error?.message || "invalid refresh token.");
    }
});

// ----------------------------- Update Controllers --------------------------------//

const changeCurrentPassword = asyncHandler(async (req, res) => {
    // get old and new password
    const { oldPassword, newPassword } = req.body;
    // get the user by using id
    const existedUser = await User.findById(req.existedUser?._id);
    // check if the entered old password correct
    const isPasswordCorrect = await existedUser.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid old password.");
    }

    // change the old password to the new one.
    existedUser.password = newPassword;
    await existedUser.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new apiResponse(200, {}, "Password changed successfuly."));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(200, req.existedUser, "Current user fetched.");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    // get the information needed to be updated
    const { fullname, email } = req.body;

    if (!fullname || !email) {
        throw new apiError(400, "All fields are required.");
    }

    User.findByIdAndUpdate(
        req.existedUser?._id,
        {
            $set: {
                fullname,
                email,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(
            new apiResponse(200, existedUser, "Account details updated successfully.")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new apiError(400, "Avatar file is missing.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new apiError(400, "Error while uploading on avatar.");
    }

    const existedUser = await User.findByIdAndUpdate(
        req.existedUser?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(new apiResponse(200, existedUser, "Avatar updated successfully."));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new apiError(400, "Cover image file is missing.");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new apiError(400, "Error while uploading on cover image.");
    }

    const existedUser = await User.findByIdAndUpdate(
        req.existedUser?._id,
        {
            $set: {
                coverImage: coverImage.url,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(
            new apiResponse(200, existedUser, "Cover iamge updated successfully.")
        );
});

// aggregation pipelines
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new apiError(400, "username is missing.");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase,
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new apiError(404, "Channel does not exist.");
    }

    return res
        .status(200)
        .json(
            new apiResponse(200, channel[0],
                "User channel fetched successfully."
            )
        )

});

console.log("getchanneluserprofile ", getUserChannelProfile);

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
};
