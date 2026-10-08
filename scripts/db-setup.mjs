import {spawnSync} from "node:child_process";
import {readFile,readdir,mkdir} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {createClient} from "@libsql/client";
import {createHash} from "node:crypto";
// This client uses the JS driver adapter. No Rust engine is executed during generation.
// Existing executable paths suppress Prisma's unused native-engine download probes.
const generation=spawnSync(process.execPath,["node_modules/prisma/build/index.js","generate"],{stdio:"inherit",env:{...process.env,PRISMA_SCHEMA_ENGINE_BINARY:process.execPath,PRISMA_QUERY_ENGINE_LIBRARY:process.execPath}});
if(generation.status!==0)process.exit(generation.status??1);
try{process.loadEnvFile(".env");}catch{}
const configured=process.env.DATABASE_URL??"file:./dev.db";
if(!configured.startsWith("file:"))throw Error("Only local SQLite is supported");
const path=resolve("prisma",configured.slice(5));await mkdir(dirname(path),{recursive:true});
const client=createClient({url:"file:"+path});
try{
await client.execute(`CREATE TABLE IF NOT EXISTS _app_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)`);
const dirs=(await readdir("prisma/migrations",{withFileTypes:true})).filter(d=>d.isDirectory()).map(d=>d.name).sort();
for(const name of dirs){const sql=await readFile(`prisma/migrations/${name}/migration.sql`,"utf8"),checksum=createHash("sha256").update(sql).digest("hex");const existing=await client.execute({sql:"SELECT checksum FROM _app_migrations WHERE name=?",args:[name]});if(existing.rows.length){if(existing.rows[0].checksum!==checksum)throw Error("Applied migration changed: "+name);continue;}const tx=await client.transaction("write");try{for(const statement of sql.split(";").map(s=>s.trim()).filter(Boolean))await tx.execute(statement);await tx.execute({sql:"INSERT INTO _app_migrations(name,checksum) VALUES (?,?)",args:[name,checksum]});await tx.commit();}catch(e){await tx.rollback();throw e;}finally{tx.close();}console.log("Applied migration:",name);}
console.log("SQLite ready.");
}finally{client.close();}
