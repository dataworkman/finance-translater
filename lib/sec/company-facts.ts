import {CompanyInfo} from "../companies";
import {secGet} from "./client";
import {CompanyFacts,normalize} from "./normalize";
type Submissions={filings:{recent:{form:string[];accessionNumber:string[];filingDate:string[];reportDate:string[];primaryDocument:string[]}}};
export async function fetchFinancialData(c:CompanyInfo){
const submissions=await secGet(`submissions/CIK${c.cik}.json`) as Submissions;
const r=submissions.filings.recent,index=r.form.findIndex(f=>f==="10-Q"||f==="10-K");
if(index<0)throw Error("Unable to retrieve financial data.");
const accession=r.accessionNumber[index];
const facts=await secGet(`api/xbrl/companyfacts/CIK${c.cik}.json`) as CompanyFacts;
return normalize(facts,{accession,form:r.form[index],filed:r.filingDate[index],end:r.reportDate[index],url:`https://www.sec.gov/Archives/edgar/data/${Number(c.cik)}/${accession.replaceAll("-","")}/${r.primaryDocument[index]}`});
}
