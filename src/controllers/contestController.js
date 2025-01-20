const {executeCodeInLanguage} = require('../services/languageService')
const {validateTestCase} = require('../services/testRunnerService')
exports.executeCode = async(req,res)=>{
    const {code,language} = req.body;
    if(!code||!language){
        return res.status(400).json({ success: false, message: 'Code and language are required' });
    }
    try {
        const executionResult = await executeCodeInLanguage(code,language)
        return res.json({ success: true, result: executionResult})
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
} 
exports.verifyCode = async(req,res)=>{
    const {code,language,testCase} = req.body;
    if(!code || !language || !testCase){
        return res.status(400).json({ success: false, message: 'Code, language, and test cases are required' });
    }
    try {
        const testResult = await validateTestCase(code,language,testCase)
        return  res.json({ success: true, passed: testResults.passed, failed: testResults.failed });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
