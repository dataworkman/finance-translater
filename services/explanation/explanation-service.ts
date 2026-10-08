import OpenAI from "openai";
import {ExplanationInput,buildPrompt,systemPrompt} from "./prompt-builder";
import {Explanation,validateExplanation} from "./schema";
export function mockExplanation(i:ExplanationInput):Explanation {
const s=i.signals,positive=s.some(x=>x.classification==="positive"||x.classification==="mixed"),negative=s.some(x=>x.classification==="negative");
return validateExplanation({headline:positive&&negative?"The numbers tell a mixed story":positive?"Several measures improved":negative?"Some measures weakened":"More evidence is needed",what_happened:s.length?s.map(x=>`${x.headline}: ${x.number}.`).join(" "):"Comparable changes are unavailable or below the signal thresholds.",plain_english:s.length?s.map(x=>x.plain).join(" "):"The supplied data does not establish a meaningful change. This is not enough to judge the overall business.",why_it_matters:s.length?s.map(x=>x.why).join(" "):"A matched comparison helps distinguish changes from seasonal differences.",watch_next:s.length?s.map(x=>x.watch).join(" "):"Look for a comparable reporting period."});
}
export async function generateExplanation(input:ExplanationInput):Promise<{explanation:Explanation;model:string}>{
if(input.financialData.demo||!process.env.OPENAI_API_KEY)return {explanation:mockExplanation(input),model:"mock-v1"};
if(!process.env.OPENAI_MODEL)throw Error("Explanation temporarily unavailable.");
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:30000,maxRetries:0});
const keys=["headline","what_happened","plain_english","why_it_matters","watch_next"];
try {const completion=await client.chat.completions.create({model:process.env.OPENAI_MODEL,messages:[{role:"system",content:systemPrompt},{role:"user",content:buildPrompt(input)}],response_format:{type:"json_schema",json_schema:{name:"financial_explanation",strict:true,schema:{type:"object",properties:Object.fromEntries(keys.map(k=>[k,{type:"string"}])),required:keys,additionalProperties:false}}}});return {explanation:validateExplanation(JSON.parse(completion.choices[0]?.message.content??"")),model:process.env.OPENAI_MODEL};}catch{throw Error("Explanation temporarily unavailable.");}
}
