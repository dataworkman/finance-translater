import {NextResponse} from "next/server";
import {z} from "zod";
import {db} from "@/lib/db/prisma";
const score=z.coerce.number().int().min(1).max(5);
const schema=z.object({analysisId:z.number().int().positive(),accuracy:score,simplicity:score,relevance:score,evidence:score,neutrality:score,notes:z.string().max(2000)}).strict();
export async function POST(request:Request){if(process.env.NODE_ENV!=="development")return NextResponse.json({error:"Developer mode only"},{status:403});if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Invalid origin"},{status:403});try{const data=schema.parse(await request.json());await db.evaluation.create({data});const average=(data.accuracy+data.simplicity+data.relevance+data.evidence+data.neutrality)/5;return NextResponse.json({average,publishable:average>=4});}catch{return NextResponse.json({error:"Unable to save evaluation. Check the analysis and scores."},{status:400});}}
