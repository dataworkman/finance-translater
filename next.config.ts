import type {NextConfig} from "next";
const config:NextConfig={serverExternalPackages:["@prisma/adapter-libsql","@libsql/client","libsql"],experimental:{cpus:2}};
export default config;
