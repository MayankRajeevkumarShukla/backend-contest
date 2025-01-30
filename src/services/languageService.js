const { VM } = require('vm2');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');
const TIMEOUT_LIMIT = 2000; 

// Execute JavaScript
const executeJavascript = (code, input) => {
    const vm = new VM({
        timeout: TIMEOUT_LIMIT,
        sandbox: {
            console: {
                log: (...args) => args.join(' '),
            },
        },
    });

    try {
        const codeWithInput = `
            ${code}
            solution(${JSON.stringify(input)});
        `;
        const startTime = process.hrtime.bigint();
        const result = vm.run(codeWithInput);
        const endTime = process.hrtime.bigint();
        const executeTime = Number(endTime - startTime) / 1_000_000;
        return {
            success: true,
            executeTime: `${executeTime.toFixed(2)}ms`,
            result: result !== undefined ? JSON.stringify(result) : '',
        };
    } catch (error) {
        const errorType = error.message.includes('Script execution timed out')
            ? 'Time Limit Exceeded (TLE)'
            : 'Runtime Error';
        console.error(`JavaScript ${errorType}:`, error.message);
        return { success: false, error: errorType, details: error.message };
    }
};

// Execute Python
const executePython = async (code, input) => {
    const filename = `temp-${uuidv4()}.py`;
    const filepath = path.join(__dirname, '../tmp', filename);
    const startTime = process.hrtime.bigint();

    try {
        const codeWithInput = `
${code}

if __name__ == "__main__":
    print(solution(${JSON.stringify(input)}))
`;
        await fs.outputFile(filepath, codeWithInput);

        const result = await new Promise((resolve, reject) => {
            exec(`python ${filepath}`, { timeout: TIMEOUT_LIMIT }, (error, stdout, stderr) => {
                const endTime = process.hrtime.bigint();
                const executeTime = Number(endTime - startTime) / 1_000_000;
                if (error) {
                    const errorType = error.signal === 'SIGTERM' ? 'Time Limit Exceeded (TLE)' : 'Syntax Error';
                    console.error(`Python ${errorType}:`, stderr || error.message);
                    reject({ success: false, error: errorType });
                } else {
                    resolve({ success: true, result: stdout.trim(),executeTime: `${executeTime.toFixed(2)}ms` });
                }
            });
        });

        await fs.remove(filepath);
        return result;
    } catch (error) {
        console.error('Python Execution Error:', error.message);
        await fs.remove(filepath);
        return { success: false, error: error.message };
    }
};

const executeJava = async (code, input) => {
    const uniqueId = uuidv4();
    const className = `Solution${uniqueId.replace(/-/g, '')}`;
    const filename = `${className}.java`;
    const filepath = path.join(__dirname, '../tmp', filename);
   

    try {
        // Wrap the code properly
        const modifiedCode = `
public class ${className} {
${code.replace(/public\s+class\s+\w+\s*{/, '').trim().slice(0, -1)}

    public static void main(String[] args) {
        int input = Integer.parseInt(args[0]);
        System.out.println(solution(input));
    }
}`;
        // console.log('Generated Java Code:', modifiedCode);

        await fs.outputFile(filepath, modifiedCode);

        const compileCommand = `javac -source 1.8 -target 1.8 "${filepath}"`;
        // console.log('Compile Command:', compileCommand);

        const runCommand = `java -cp "${path.dirname(filepath)}" ${className} ${input}`;
        // console.log('Run Command:', runCommand);

        const result = await new Promise((resolve, reject) => {
            const startTime = process.hrtime.bigint();
            exec(compileCommand, (compileError, compileStdout, compileStderr) => {
                const endTime = process.hrtime.bigint();
                const executeTime = Number(endTime - startTime) / 1_000_000;
                if (compileError) {
                    console.error('Compilation Error:', compileStderr || compileError.message);
                    reject({ success: false, error: 'Syntax Error' });
                    return;
                }

                exec(runCommand, { timeout: TIMEOUT_LIMIT }, (runError, runStdout, runStderr) => {
                    if (runError) {
                        const errorType = runError.signal === 'SIGTERM' ? 'Time Limit Exceeded (TLE)' : 'Runtime Error';
                        console.error('Execution Error:', runStderr || runError.message);
                        reject({ success: false, error: errorType });
                    } else {
                        // console.log('Execution Output:', runStdout);
                        resolve({ success: true, result: runStdout.trim(),executeTime: `${executeTime.toFixed(2)}ms` });
                    }
                });
            });
        });

        // Clean up the temporary files
        await fs.remove(filepath);
        await fs.remove(filepath.replace('.java', '.class'));
        return result;
    } catch (error) {
        console.error('Unexpected Error:', error.message);
        await fs.remove(filepath);
        await fs.remove(filepath.replace('.java', '.class'));
        return { success: false, error: error.message };
    }
};
// without version sepcification use the below code 
/*const executeJava = async (code, input) => {
    const uniqueId = uuidv4();
    const className = `Solution${uniqueId.replace(/-/g, '')}`;
    const filename = `${className}.java`;
    const filepath = path.join(__dirname, '../tmp', filename);

    try {
        const modifiedCode = `
public class ${className} {
    ${code.replace(/public\s+class\s+\w+\s*\{/, '').slice(0, -1)}
    
    public static void main(String[] args) {
        System.out.println(solution(${JSON.stringify(input)}));
    }
}`;
        await fs.outputFile(filepath, modifiedCode);

        const result = await new Promise((resolve, reject) => {
            const compileCommand = `javac "${filepath}"`;
            const runCommand = `java -cp "${path.dirname(filepath)}" ${className}`;

            exec(compileCommand, (compileError, compileStdout, compileStderr) => {
                if (compileError) {
                    reject({ success: false, error: 'Syntax Error' });
                    return;
                }

                exec(runCommand, { timeout: TIMEOUT_LIMIT }, (runError, runStdout, runStderr) => {
                    if (runError) {
                        const errorType = runError.signal === 'SIGTERM' ? 'Time Limit Exceeded (TLE)' : 'Runtime Error';
                        reject({ success: false, error: errorType });
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
        await fs.remove(filepath);
        await fs.remove(filepath.replace('.java', '.class'));
        return { success: false, error: error.message };
    }
}; */
const executeCpp = async (code, input) => {
    const uniqueId = uuidv4();
    const filename = `temp-${uniqueId}.cpp`;
    const executableName = `temp-${uniqueId}${process.platform === 'win32' ? '.exe' : ''}`;
    const filepath = path.join(__dirname, '../tmp', filename);
    const executablePath = path.join(__dirname, '../tmp', executableName);
    const startTime = process.hrtime.bigint();

    try {
        
        await fs.outputFile(filepath, code);

        const result = await new Promise((resolve, reject) => {
            
            const compileCommand = `g++ "${filepath}" -o "${executablePath}"`;
            
            exec(compileCommand, (compileError, compileStdout, compileStderr) => {
                if (compileError) {
                    reject({ success: false, error: 'Compilation Error', details: compileStderr });
                    return;
                }
                const startTime = process.hrtime.bigint();
                const child = exec(`"${executablePath}"`, { 
                    timeout: TIMEOUT_LIMIT 
                }, (runError, runStdout, runStderr) => {
                    const endTime = process.hrtime.bigint();
                    const executeTime = Number(endTime - startTime) / 1_000_000;

                    if (runError) {
                        const errorType = runError.signal === 'SIGTERM' ? 'Time Limit Exceeded (TLE)' : 'Runtime Error';
                        reject({ success: false, error: errorType, details: runStderr });
                    } else {
                        resolve({ 
                            success: true, 
                            result: runStdout.trim(),
                            executeTime: `${executeTime.toFixed(2)}ms` 
                        });
                    }
                });
                if (input) {
                    child.stdin.write(input + '\n');
                    child.stdin.end();
                }
            });
        });
        await fs.remove(filepath);
        await fs.remove(executablePath);
        return result;
    } catch (error) {
        await fs.remove(filepath).catch(() => {});
        await fs.remove(executablePath).catch(() => {});
        return { 
            success: false, 
            error: error.error || 'Execution Error',
            details: error.details || error.message 
        };
    }
};


// Main Execution
const executeCodeInLanguage = async (code, language, testCases) => {
    let allPassed = true;
    const results = [];
    const totalStartTime = process.hrtime.bigint();

    // Track execution times for Java and C++
    let javaExecutionTimes = [];
    let cppExecutionTimes = [];
    let totalExecutionTime = 0; // To track the total execution time for non-Java and non-C++ languages

    for (const testCase of testCases) {
        const { input, expectedOutput } = testCase;
        let result;

        switch (language.toLowerCase()) {
            case 'javascript':
                result = executeJavascript(code, input);
                totalExecutionTime += parseFloat(result.executeTime); // Add execution time as a number
                break;
            case 'python':
                result = await executePython(code, input);
                totalExecutionTime += parseFloat(result.executeTime); // Add execution time as a number
                break;
            case 'java':
                result = await executeJava(code, input);
                if (result.executeTime) javaExecutionTimes.push(parseFloat(result.executeTime)); // Convert to number
                break;
            case 'cpp':
                result = await executeCpp(code, input);
                if (result.executeTime) cppExecutionTimes.push(parseFloat(result.executeTime)); // Convert to number
                break;
            default:
                return { success: false, error: 'Unsupported language' };
        }

        if (result.success) {
            const passed = result.result === expectedOutput.toString();
            allPassed = allPassed && passed;
            results.push({
                input,
                expectedOutput,
                actualOutput: result.result,
                executeTime: result.executeTime,
                passed,
            });
        } else {
            allPassed = false;
            results.push({
                input,
                expectedOutput,
                actualOutput: result.error,
                passed: false,
            });
        }
    }

    const totalEndTime = process.hrtime.bigint();
    const totalExecutionTimeMs = Number(totalEndTime - totalStartTime) / 1_000_000;

    // Calculate the average execution time for Java
    const averageJavaTime = javaExecutionTimes.length > 0
        ? javaExecutionTimes.reduce((sum, time) => sum + time, 0) / javaExecutionTimes.length
        : 0;

    // Calculate the average execution time for C++
    const averageCppTime = cppExecutionTimes.length > 0
        ? cppExecutionTimes.reduce((sum, time) => sum + time, 0) / cppExecutionTimes.length
        : 0;

    // Calculate the average execute time for Java and C++ combined
    const averageJavaCppTime = (averageJavaTime + averageCppTime) / 2;

    // Use average execute time for Java and C++ or total execution time for others
    const finalExecuteTime = (language === 'java' || language === 'cpp')
        ? averageJavaCppTime
        : totalExecutionTimeMs;

    return {
        success: allPassed,
        results,
        summary: {
            totalTests: testCases.length,
            passedTests: results.filter(r => r.passed).length,
            failedTests: results.filter(r => !r.passed).length,
            score: Math.round((results.filter(r => r.passed).length / testCases.length) * 100),
            totalExecuteTime: `${finalExecuteTime.toFixed(2)}ms`, // Ensure the value is a number
        },
    };
};




module.exports = { executeCodeInLanguage };
