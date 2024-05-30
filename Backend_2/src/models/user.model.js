import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar: {
            type: String, // cloudinary url
            required: true,
        },

        coverImage: {
            type: String, // cloudinary url
        },

        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            }
        ],

        password: {
            type: String,
            required: [true, "password is required."]
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

// pre is a mongoose hook
// Pre hook is use to append a midddleware before an operation.
// In our code, middleware has been appended before the "save" operation.
// pre takes two things, opration and call back.
// this callback should not be a lambda function because we don't have a context reference(this)
userSchema.pre("save", async function (next) {

    // // .hash hashes the password
    // // It will hash in 10 rounds

    // this.password = bcrypt.hash(this.password, 10)
    // // then we will call next()
    // //next() is a reference which means to terminate the middleware and perform further tasks.

    // // But here is aproblem. 
    // // Now whenever there is change is any field, it will re hash the password.
    // // But we want change only when there is any modification in password only.

    // next()

    // So to solve the problem,use below code

    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()

})

// creating a custom method to check whether password is correct or not.
userSchema.methods.isPasswordcorrect = async function (password) {
    return await bcrypt.compare(password, this.password) //true and false
}

// Method to generate access token and refresh token
// .sign method is use to generate tokens.
userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id, // from database
        email: this.email,
        username: this.username,
        fullname: this.fullname,
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id, // from database
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)