import { open } from 'node:fs/promises';
import { analyzeAnswers } from './answer-analysis';

const args=process.argv.slice(2);
if(args.length===1&&args[0]==='--help'){
  console.log('Usage: pnpm analyze:answers --input <answers.json>\nOffline analysis of your saved AI answers. See docs/analyze-answers.md.');
}else{
  try{
    if(args.length!==2||args[0]!=='--input'||!args[1])throw new Error('usage: pnpm analyze:answers --input <answers.json>');
    // Bound the actual read as well as the stat; a growing file cannot exhaust memory.
    const file=await open(args[1],'r');let source:string;
    try{
      const size=(await file.stat()).size;
      if(!Number.isSafeInteger(size)||size>5*1024*1024)throw new Error('input_file_too_large');
      const buffer=Buffer.alloc(5*1024*1024+1);let bytesRead=0;
      while(bytesRead<buffer.length){const chunk=await file.read(buffer,bytesRead,buffer.length-bytesRead,bytesRead);if(chunk.bytesRead===0)break;bytesRead+=chunk.bytesRead;}
      if(bytesRead>5*1024*1024)throw new Error('input_file_too_large');
      source=buffer.subarray(0,bytesRead).toString('utf8').replace(/^\uFEFF/,'');
    }finally{await file.close();}
    let input:unknown;try{input=JSON.parse(source);}catch{throw new Error('invalid_json');}
    console.log(JSON.stringify(analyzeAnswers(input),null,2));
  }catch(error){
    const code=error instanceof Error?error.message:'';
    // Never echo answer contents, citation query strings or arbitrary filesystem errors.
    console.error(/^(?:invalid_[a-z_]+|input_file_too_large|unknown_input_field|duplicate_observation_id|unavailable_answer_has_evidence|observed_at_requires_timezone|usage: .+)$/.test(code)?code:'input_file_unreadable');
    process.exitCode=1;
  }
}
