import {PrismaClient} from "@prisma/client";
import {PrismaLibSQL} from "@prisma/adapter-libsql";
import {resolve} from "node:path";
const globalDb=globalThis as unknown as {prisma?:PrismaClient};
const configured=process.env.DATABASE_URL??"file:./dev.db";
if(!configured.startsWith("file:"))throw Error("This MVP requires local SQLite (file: URL).");
const url="file:"+resolve(process.cwd(),"prisma",configured.slice(5));
export const db=globalDb.prisma??new PrismaClient({adapter:new PrismaLibSQL({url})});
if(process.env.NODE_ENV!=="production")globalDb.prisma=db;
