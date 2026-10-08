export const metricNames=["revenue","operating_income","net_income","operating_cash_flow","capital_expenditures","cash","total_debt"] as const;
export type MetricName=typeof metricNames[number];
export type Period={label:string;kind:"annual"|"quarter";fiscalYear:number;fiscalQuarter?:number;start:string;end:string};
export type Pair={current:number|null;previous:number|null};
export type FinancialData={current:Period;previous:Period;metrics:Record<MetricName,Pair>;filing:{accession:string;form:string;filed:string;url:string};demo:boolean};
export type FinancialMetrics=FinancialData & {comparable:boolean;derived:{revenue_yoy:number|null;net_income_yoy:number|null;operating_margin:Pair;free_cash_flow:Pair;cash_change:number|null;fcf_yoy:number|null;debt_yoy:number|null;margin_change:number|null}};
export type FinancialSignal={key:string;headline:string;number:string;plain:string;why:string;watch:string;classification:"positive"|"negative"|"mixed"|"neutral";score:number};
