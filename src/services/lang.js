const {VM} = require('vm2')
const {exec} = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid');
const  TIMEOUT_LIMIT =2000
const executeJavascript = (code,input)=>{
 const vm = new VM({
    timeout:TIMEOUT_LIMIT,
    sandbox:{
        console:{
            log:(...args) =>args.join(' ')
        }
    }
 })
 try {
    const codeWithInput = `
    ${code}
    console.log(solution(${JSON.stringify(input)}));
    `;
    const result = vm.run(codeWithInput)
    return {success: true, result: result !== undefined ? result.toString() : '' }
    
 } catch (error) {
    const errorType = error.message.includes('Script execution timed out')
    ? 'Time Limit Exceeded (TLE)'
    : 'Syntax Error'
 }
}
