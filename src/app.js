const express = require('express')
const bodyParser = require('body-parser')
const contestRoutes = require('./routes/contestRoutes')
// const testCaseRoutes  = require('./routes/testCaseRoutes')

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/contest',contestRoutes)
// app.use('/api/testCase',testCaseRoutes )
app.get('/',(req,res)=>{
    res.send('Welcome to the Contest Backend API')
})
module.exports = app;