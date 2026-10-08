import {test} from "node:test";
import assert from "node:assert/strict";
import {companies} from "../lib/companies";
import {getAnalysis} from "../lib/analysis";
import {db} from "../lib/db/prisma";
test("Demo analysis persists; repeated and concurrent requests reuse filing",async()=>{process.env.DEMO_MODE="true";try{const first=await getAnalysis(companies[0]);const [a,b]=await Promise.all([getAnalysis(companies[0]),getAnalysis(companies[0])]);assert.equal(a.id,first.id);assert.equal(b.id,first.id);assert.equal(a.cached,true);assert.equal(await db.analysis.count({where:{id:first.id}}),1);assert.equal(await db.financialMetric.count({where:{filingId:(await db.analysis.findUniqueOrThrow({where:{id:first.id}})).filingId}}),14);}finally{await db.$disconnect();}});
