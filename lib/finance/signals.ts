import {FinancialMetrics,FinancialSignal} from "./types";
export const pct=(n:number)=>`${n>0?"+":""}${n.toFixed(1)}%`;
export function detectSignals(f:FinancialMetrics):FinancialSignal[]{
if(!f.comparable)return [];
const d=f.derived,all:FinancialSignal[]=[];
const add=(key:string,n:number|null,label:string,plain:string,why:string,watch:string,invert=false,weight=1)=>{if(n===null||Math.abs(n)<0.5)return;all.push({key,headline:label,number:key==="margin"?`${n>0?"+":""}${n.toFixed(1)} percentage points`:pct(n)+" YoY",plain,why,watch,classification:(invert?n<0:n>0)?"positive":"negative",score:Math.abs(n)*weight});};
add("revenue",d.revenue_yoy,"Sales "+((d.revenue_yoy??0)>=0?"grew":"declined"),"Revenue is money from sales. The company sold "+((d.revenue_yoy??0)>=0?"more":"less")+" than in the same period last year.","Sales show how much business the company is doing.","Watch whether sales growth continues.");
add("margin",d.margin_change,"Profit per dollar "+((d.margin_change??0)>=0?"improved":"fell"),"Operating margin is the share of sales left after operating costs. Each dollar of sales left "+((d.margin_change??0)>=0?"more":"less")+" operating profit.","More profit per dollar leaves more room to cover other costs.","Watch whether operating margin stabilizes or improves.",false,5);
add("fcf",d.fcf_yoy,"Cash generation "+((d.fcf_yoy??0)>=0?"improved":"declined"),"Free cash flow is cash from operations after spending on property and equipment. The business had "+((d.fcf_yoy??0)>=0?"more":"less")+" cash left after that spending.","Cash left after capital spending helps fund investment and debt repayments.","Watch whether cash generation follows the direction of profits.");
add("debt",d.debt_yoy,"Borrowing "+((d.debt_yoy??0)>=0?"increased":"decreased"),"Total debt is money owed to lenders. Reported borrowing "+((d.debt_yoy??0)>=0?"increased":"decreased")+".","More borrowing can increase future repayment obligations.","Watch debt alongside cash generation.",true);
const selected=all.sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key)).slice(0,3);
if((d.revenue_yoy??0)>0&&(d.margin_change??0)<0){const r=selected.find(s=>s.key==="revenue");if(r)r.classification="mixed";}
return selected;
}
