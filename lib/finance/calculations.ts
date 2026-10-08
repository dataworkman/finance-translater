import {FinancialData,FinancialMetrics,Period} from "./types";
export const yoy=(a:number|null,b:number|null)=>a===null||b===null||b<=0?null:(a-b)/b*100;
export const margin=(a:number|null,b:number|null)=>a===null||b===null||b<=0?null:a/b*100;
export const subtract=(a:number|null,b:number|null)=>a===null||b===null?null:a-b;
export const fcf=subtract;
const days=(p:Period)=>(Date.parse(p.end)-Date.parse(p.start))/86400000;
export function comparable(a:Period,b:Period){const valid=(p:Period)=>p.kind==="annual"?days(p)>=350&&days(p)<=380:days(p)>=75&&days(p)<=105;return a.kind===b.kind&&a.fiscalYear===b.fiscalYear+1&&(a.kind==="annual"||a.fiscalQuarter===b.fiscalQuarter)&&Math.abs(days(a)-days(b))<=8&&valid(a)&&valid(b);}
export function calculate(data:FinancialData):FinancialMetrics {
const m=data.metrics,ok=comparable(data.current,data.previous);
const op={current:margin(m.operating_income.current,m.revenue.current),previous:margin(m.operating_income.previous,m.revenue.previous)};
const free={current:fcf(m.operating_cash_flow.current,m.capital_expenditures.current),previous:fcf(m.operating_cash_flow.previous,m.capital_expenditures.previous)};
return {...data,comparable:ok,derived:{revenue_yoy:ok?yoy(m.revenue.current,m.revenue.previous):null,net_income_yoy:ok?yoy(m.net_income.current,m.net_income.previous):null,operating_margin:op,free_cash_flow:free,cash_change:ok?subtract(m.cash.current,m.cash.previous):null,fcf_yoy:ok?yoy(free.current,free.previous):null,debt_yoy:ok?yoy(m.total_debt.current,m.total_debt.previous):null,margin_change:ok?subtract(op.current,op.previous):null}};
}
