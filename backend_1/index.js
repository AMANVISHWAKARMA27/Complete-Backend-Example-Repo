require('dotenv').config()
const express = require('express')
const app = express()
const port = 4000

app.get('/', (req, res) => {
    res.send("Hello world")
})

app.get('/twitter', (req, res) => {
    res.send('Twitter Profile.')
})

app.get('/login', (req, res) => {
    res.send('Hey login.')
})

app.get('/whatsapp', (req, res) => {
    res.send("<h1>AMAN VISHWAKARMA</h1>")
})

app.listen(process.env.PORT, () => {
    console.log(`Example app listening on port ${port}`)
})

