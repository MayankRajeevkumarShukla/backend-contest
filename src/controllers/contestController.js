// src/controllers/contestController.js
const { executeCodeInLanguage } = require('../services/languageService');

// Example function to handle code execution
const executeCode = async (req, res) => {
    const { code, language } = req.body;
    
    if (!code || !language) {
        return res.status(400).json({ success: false, error: 'Code and language are required' });
    }

    try {
        const result = await executeCodeInLanguage(code, language);
        if (result.success) {
            return res.json({ success: true, result: result.result });
        } else {
            return res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { executeCode };
