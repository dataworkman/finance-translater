export const companies = [
{name:"Apple",ticker:"AAPL",cik:"0000320193",sector:"Consumer technology"},
{name:"NVIDIA",ticker:"NVDA",cik:"0001045810",sector:"Semiconductors"},
{name:"Tesla",ticker:"TSLA",cik:"0001318605",sector:"Electric vehicles"},
{name:"Costco",ticker:"COST",cik:"0000909832",sector:"Membership retail"},
{name:"Coca-Cola",ticker:"KO",cik:"0000021344",sector:"Beverages"}] as const;
export type CompanyInfo = typeof companies[number];
export const findCompany=(ticker:string)=>companies.find(c=>c.ticker===ticker);
export const isDemo=()=>process.env.DEMO_MODE!=="false";
