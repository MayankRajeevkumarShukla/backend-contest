const express = require('express')
const router = express.json()
const {executeCode,verifyCode} = require("../controllers/contestController")

router.post('/execute',executeCode)
router.post('/verify',verifyCode)
module.exports = router;