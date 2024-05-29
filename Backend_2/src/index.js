// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import connectDb from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
})

connectDb() // databse connected
    .then(() => {
        try {
            app.listen(process.env.PORT || 8080, () => {
                console.log(`\nServer is running at port : ${process.env.PORT}`)
            })
        } catch (error) {
            console.log("Server side error - Connection failed !! ", error)
        }
    })
    .catch((err) => {
        console.log("MOngoDB connection failed !!! ", err)
    })




// Below is an approach , but not the professional one.
// Above is the professioanl approach

/*
import express from "express";
import { error } from "console";
const app = express();

// using efes ()() syntax
( async() => {
    try {
       await mongoose
       .connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

       app.on("error", (error) => {
        console.log("Error: ", error);
        throw error

    })

    app.listen(process.env.PORT, () => {
        console.log(`App is listening on port ${process.env.PORT}`)
    })
    } catch (error) {
        console.log('ERROR: ', error)
        throw error
    }
})()
*/