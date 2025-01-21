const { VM } = require('vm2');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const executeJavascript = (code) => {
    const vm = new VM({
        timeout: 1000,
        sandbox: {
            console: {
                log: (...args) => {
                    return args.join(' ');
                },
            },
        },
    });

    try {
        const result = vm.run(code);
        return { success: true, result: result !== undefined ? result.toString() : 'Code executed without explicit return' };
    } catch (error) {
        console.error("JavaScript execution error:", error.message);
        return { success: false, error: error.message };
    }
};

const executePython = async (code) => {
    const filename = `temp-${uuidv4()}.py`;
    const filepath = path.join(__dirname, '../tmp', filename);
    
    try {
        await fs.outputFile(filepath, code);

        const result = await new Promise((resolve, reject) => {
            exec(`python ${filepath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error("Python execution error:", stderr || error.message);
                    reject({ success: false, error: stderr || error.message });
                } else {
                    resolve({ success: true, result: stdout.trim() });
                }
            });
        });

        await fs.remove(filepath);
        return result;
    } catch (error) {
        console.error("Error executing Python:", error.message);
        return { success: false, error: error.message };
    }
};

const executeJava = async (code) => {
    const uniqueId = uuidv4();
    const className = `TempClass${uniqueId.replace(/-/g, '')}`;
    const filename = `${className}.java`;
    const filepath = path.join(__dirname, '../tmp', filename);
    
    try {
        let modifiedCode = code.replace(/class\s+([A-Za-z0-9_]+)/, `class ${className}`);
        modifiedCode = modifiedCode.replace(/System\.out\.println\('([^']*)'\)/g, 'System.out.println("$1")');
        modifiedCode = modifiedCode.replace(/System\.out\.print\('([^']*)'\)/g, 'System.out.print("$1")');
        
        await fs.outputFile(filepath, modifiedCode);

        const result = await new Promise((resolve, reject) => {
            const compileCommand = `javac -source 1.8 -target 1.8 "${filepath}"`;
            const runCommand = `java -cp "${path.dirname(filepath)}" ${className}`;
            
            exec(compileCommand, (compileError, compileStdout, compileStderr) => {
                if (compileError) {
                    reject({ success: false, error: compileStderr || compileError.message });
                    return;
                }

                exec(runCommand, (runError, runStdout, runStderr) => {
                    if (runError) {
                        reject({ success: false, error: runStderr || runError.message });
                    } else {
                        resolve({ success: true, result: runStdout.trim() });
                    }
                });
            });
        });

        await fs.remove(filepath);
        await fs.remove(filepath.replace('.java', '.class'));
        return result;
    } catch (error) {
        try {
            await fs.remove(filepath);
            await fs.remove(filepath.replace('.java', '.class'));
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
        return { success: false, error: error.message };
    }
};

const executeCpp = async (code) => {
    const uniqueId = uuidv4();
    const filename = `temp-${uniqueId}.cpp`;
    const executableName = `temp-${uniqueId}${process.platform === 'win32' ? '.exe' : ''}`;
    const filepath = path.join(__dirname, '../tmp', filename);
    const executablePath = path.join(__dirname, '../tmp', executableName);
    
    try {
    
        await fs.ensureDir(path.join(__dirname, '../tmp'));
        
        await fs.writeFile(filepath, code);

        const result = await new Promise((resolve, reject) => {
           
            const compileCommand = process.platform === 'win32'
                ? `g++ "${filepath}" -o "${executablePath}" -std=c++11`
                : `g++ "${filepath}" -o "${executablePath}" -std=c++11`;
            exec(compileCommand, (compileError, compileStdout, compileStderr) => {
                if (compileError) {
                    console.error("C++ compilation error:", compileStderr || compileError.message);
                    reject({ success: false, error: compileStderr || compileError.message });
                    return;
                }
                exec(`"${executablePath}"`, (runError, runStdout, runStderr) => {
                    if (runError) {
                        console.error("C++ runtime error:", runStderr || runError.message);
                        reject({ success: false, error: runStderr || runError.message });
                    } else {
                        resolve({ success: true, result: runStdout.trim() });
                    }
                });
            });
        });

        await Promise.all([
            fs.remove(filepath),
            fs.remove(executablePath)
        ]);

        return result;
    } catch (error) {
        try {
            await Promise.all([
                fs.remove(filepath),
                fs.remove(executablePath)
            ]);
        } catch (cleanupError) {
            console.error("Cleanup error:", cleanupError);
        }
        return { success: false, error: error.message };
    }
};

const executeCodeInLanguage = async (code, language) => {
    switch (language.toLowerCase()) {
        case 'javascript':
            return executeJavascript(code);
        case 'python':
            return await executePython(code);
        case 'java':
            return await executeJava(code);
        case 'cpp':
            return await executeCpp(code);
        default:
            return { success: false, error: 'Unsupported language' };
    }
};

module.exports = { executeCodeInLanguage };