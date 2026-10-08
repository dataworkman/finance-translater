import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {CompanyInfo,isDemo} from "./companies";
import {FinancialData,FinancialMetrics,FinancialSignal,metricNames} from "./finance/types";
import {calculate} from "./finance/calculations";
import {detectSignals} from "./finance/signals";
import {fetchFinancialData} from "./sec/company-facts";
import {db} from "./db/prisma";
import {generateExplanation} from "../services/explanation/explanation-service";
import {Explanation} from "../services/explanation/schema";
export type AnalysisResult={id:number;financialData:FinancialMetrics;signals:FinancialSignal[];explanation:Explanation;model:string;cached:boolean};
const pending=new Map<string,Promise<AnalysisResult>>();
export async function loadData(c:CompanyInfo):Promise<FinancialData>{return isDemo()?JSON.parse(await readFile(join(process.cwd(),"data/demo",c.ticker.toLowerCase()+".json"),"utf8")):fetchFinancialData(c);}
export async function getAnalysis(c:CompanyInfo):Promise<AnalysisResult>{const key=c.ticker+":"+isDemo();const existing=pending.get(key);if(existing)return existing;const task=build(c);pending.set(key,task);try{return await task;}finally{pending.delete(key);}}
async function build(c:CompanyInfo):Promise<AnalysisResult>{
const data=await loadData(c),key=`${c.ticker}:${data.filing.accession}:${data.demo?"demo":"live"}:v1`;
const old=await db.analysis.findUnique({where:{cacheKey:key}});
if(old)return {id:old.id,financialData:JSON.parse(old.financialDataJson),signals:JSON.parse(old.signalsJson),explanation:JSON.parse(old.analysisJson),model:old.model,cached:true};
const financialData=calculate(data),signals=detectSignals(financialData),generated=await generateExplanation({company:c,financialData,signals});
const saved=await db.$transaction(async tx=>{const company=await tx.company.upsert({where:{ticker:c.ticker},create:{ticker:c.ticker,name:c.name,cik:c.cik},update:{}});const filing=await tx.filing.upsert({where:{companyId_accessionNumber:{companyId:company.id,accessionNumber:data.filing.accession}},create:{companyId:company.id,accessionNumber:data.filing.accession,formType:data.filing.form,filingDate:data.filing.filed,periodEnd:data.current.end,sourceUrl:data.filing.url},update:{}});if(await tx.financialMetric.count({where:{filingId:filing.id}})===0){for(const n of metricNames)for(const side of ["current","previous"] as const){const value=data.metrics[n][side];if(value!==null)await tx.financialMetric.create({data:{filingId:filing.id,metricName:n,value,unit:"USD",periodStart:["cash","total_debt"].includes(n)?null:data[side].start,periodEnd:data[side].end}});}}return tx.analysis.upsert({where:{cacheKey:key},create:{companyId:company.id,filingId:filing.id,cacheKey:key,financialDataJson:JSON.stringify(financialData),signalsJson:JSON.stringify(signals),analysisJson:JSON.stringify(generated.explanation),model:generated.model},update:{}});});
return {id:saved.id,financialData,signals,explanation:generated.explanation,model:generated.model,cached:false};
}
