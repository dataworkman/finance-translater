import {FinancialData,metricNames,MetricName,Period} from "../finance/types";
export type Fact={start?:string;end:string;val:number;accn:string;filed:string;form:string;fy?:number;fp?:string};
export type CompanyFacts={facts:{"us-gaap":Record<string,{units?:{USD?:Fact[]}}>}};
export type FilingInfo={accession:string;form:string;filed:string;end:string;url:string};
const tags:Record<MetricName,string[]>={revenue:["RevenueFromContractWithCustomerExcludingAssessedTax","Revenues","SalesRevenueNet"],operating_income:["OperatingIncomeLoss"],net_income:["NetIncomeLoss"],operating_cash_flow:["NetCashProvidedByUsedInOperatingActivities"],capital_expenditures:["PaymentsToAcquirePropertyPlantAndEquipment"],cash:["CashAndCashEquivalentsAtCarryingValue"],total_debt:["LongTermDebtAndFinanceLeaseObligationsIncludingCurrentMaturities","LongTermDebtCurrent","LongTermDebtNoncurrent"]};
const duration=(f:Fact)=>(Date.parse(f.end)-Date.parse(f.start??f.end))/86400000;
export function normalize(facts:CompanyFacts,filing:FilingInfo):FinancialData {
const gaap=facts.facts["us-gaap"],annual=filing.form==="10-K";
const candidates=tags.revenue.flatMap(t=>gaap[t]?.units?.USD??[]).filter(f=>f.accn===filing.accession&&f.end===filing.end&&f.start&&(annual?duration(f)>=350&&duration(f)<=380:duration(f)>=75&&duration(f)<=105));
const anchor=candidates.sort((a,b)=>b.filed.localeCompare(a.filed))[0];
if(!anchor)throw Error("Comparable period unavailable");
const year=anchor.fy??Number(anchor.end.slice(0,4));
const q=anchor.fp?.match(/^Q([1-4])$/)?.[1];
if(!annual&&!q)throw Error("Comparable period unavailable");
const priorCandidates=tags.revenue.flatMap(t=>gaap[t]?.units?.USD??[]).filter(f=>f.start&&Number(f.end.slice(0,4))===Number(anchor.end.slice(0,4))-1&&Math.abs(duration(f)-duration(anchor))<=8&&Math.abs(Date.parse(anchor.end)-Date.parse(f.end)-365.25*86400000)<=10*86400000&&f.filed<=filing.filed);
const prior=priorCandidates.sort((a,b)=>b.filed.localeCompare(a.filed))[0];
if(!prior)throw Error("Comparable period unavailable");
const period=(f:Fact,y:number):Period=>({label:annual?`FY ${y}`:`Q${q} ${y}`,kind:annual?"annual":"quarter",fiscalYear:y,...(!annual?{fiscalQuarter:Number(q)}:{}),start:f.start!,end:f.end});
const value=(name:MetricName,f:Fact,current:boolean)=>{
// Never sum overlapping debt tags. Unsupported combined total debt stays missing.
const names=name==="total_debt"?["LongTermDebtAndFinanceLeaseObligationsIncludingCurrentMaturities"]:tags[name];
for(const t of names){const values=(gaap[t]?.units?.USD??[]).filter(x=>x.end===f.end&&x.filed<=filing.filed&&(current?x.accn===filing.accession:true)&&(name==="cash"||name==="total_debt"?!x.start:x.start===f.start));const match=values.sort((a,b)=>b.filed.localeCompare(a.filed))[0];if(match)return match.val;}return null;};
return {current:period(anchor,year),previous:period(prior,year-1),metrics:Object.fromEntries(metricNames.map(n=>[n,{current:value(n,anchor,true),previous:value(n,prior,false)}])) as FinancialData["metrics"],filing:{accession:filing.accession,form:filing.form,filed:filing.filed,url:filing.url},demo:false};
}
