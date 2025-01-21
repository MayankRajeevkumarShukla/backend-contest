const { executeCodeInLanguage } = require('../services/languageService');

const executeCode = async (req, res) => {
    const { code, language, testCases } = req.body;
    
    // Input validation
    if (!code || !language) {
        return res.status(400).json({
            success: false,
            error: 'Code and language are required'
        });
    }

    // Ensure testCases is an array, default to empty array if not provided
    const validatedTestCases = Array.isArray(testCases) ? testCases : [];
    
    try {
        const result = await executeCodeInLanguage(code, language, validatedTestCases);
        return res.json(result);
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = { executeCode };