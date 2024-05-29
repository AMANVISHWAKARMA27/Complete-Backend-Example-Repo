// const express = require('express')
import express from 'express'

const app = express()

// app.get('/', (req, res) => {
//     res.send('Serves is ready');
// })

// get a list of 5 jokes


// withour cors solution
// app.get('/jokes', (req, res) => {
//     const jokes = [
//         {
//             id: 1,
//             title : 'A joke',
//             content : 'This is the first joke.'
//         },
//         {
//             id: 2,
//             title : 'A joke',
//             content : 'This is the second joke.'
//         },
//         {
//             id: 3,
//             title : 'A joke',
//             content : 'This is the third joke.'
//         },
//         {
//             id: 4,
//             title : 'A joke',
//             content : 'This is the fourth joke.'
//         },
//         {
//             id: 5,
//             title : 'A joke',
//             content : 'This is the fifth joke.'
//         },
//     ]

//     res.send(jokes)
// })


// with cors solution
app.get('/api/jokes', (req, res) => {
    const jokes = [
        {
            id: 1,
            title : 'A joke',
            content : 'This is the first joke.'
        },
        {
            id: 2,
            title : 'A joke',
            content : 'This is the second joke.'
        },
        {
            id: 3,
            title : 'A joke',
            content : 'This is the third joke.'
        },
        {
            id: 4,
            title : 'A joke',
            content : 'This is the fourth joke.'
        },
        {
            id: 5,
            title : 'A joke',
            content : 'This is the fifth joke.'
        },
    ]

    res.send(jokes)
})

const port = process.env.PORT || 3000; // take port from env or 3000

app.listen(port, () => {
    console.log(`Serve at http://localhost:${port}.`);
})