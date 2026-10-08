export async function secGet(path:string):Promise<unknown>{
const ua=process.env.SEC_USER_AGENT;
if(!ua||!ua.includes("@"))throw Error("SEC_USER_AGENT must identify your application and contact email.");
const response=await fetch(`https://data.sec.gov/${path}`,{headers:{"User-Agent":ua,Accept:"application/json"},signal:AbortSignal.timeout(20000),next:{revalidate:3600}});
if(!response.ok)throw Error("Unable to retrieve financial data.");return response.json();
}
