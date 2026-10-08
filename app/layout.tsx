import Link from "next/link";
import "./globals.css";
export const metadata={title:"Financial Translator",description:"Understand company financial data in plain English."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><header><Link href="/" className="brand"><span className="brand-icon">ft</span>Financial Translator<span className="beta">MVP</span></Link><span className="header-note">A little clarity goes a long way.</span></header>{children}<footer><span>Financial Translator</span><span>Financial understanding. No investment recommendations.</span></footer></body></html>;}
