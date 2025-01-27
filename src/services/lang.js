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
         console: {
            log:(...arg) =>arg.join(' ')
         }
      }
   })
   try {
      const codeWithInput = `
      ${code}
       solution(${JSON.stringify(input)});
      `
      const startTime = process.hrtime.bigint()
      const result = vm.run(codeWithInput)
      const endTime = process.hrtime.bigint()
      const executeTime = Number(endTime-startTime)/1_000_000;
      return{
         success:true,
         executeTime: `${executeTime.toFixed(2)}ms`,
         result: result !== undefined ? JSON.stringify(result):''
      }
   } catch (error) {
      const errorType = error.message.includes('Script execution timed out') ? 'Time Limit Exceeded (TLE)':
      'Runtime Error';
      console.error(`JavaScript ${errorType}:`, error.message);
      return { success: false, error: errorType, details: error.message };
   }
}
const executePython =async(code,input)=>{
   const filename = `temp-${uuidv4()}.py`
   const filepath = path.join(__dirname,'../temp',filename)
   const startTime = process.hrtime.bigint()
   try {
      const codeWithInput =`
      ${code}
      if __name__ == "__main__":
    print(solution(${JSON.stringify(input)}))
      ` 
      await fs.outputFile(filepath,codeWithInput)
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
   } catch (error) {
      console.error('Python execution Error',error.message)
      await fs.remove(filepath)
      return {success:false,error:error.message}
   }
}
