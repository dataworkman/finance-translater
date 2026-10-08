import {CompanyInfo} from "../../lib/companies";
import {FinancialMetrics,FinancialSignal} from "../../lib/finance/types";
import {defaultStyleGuide} from "./default-style-guide";
export type ExplanationInput={company:CompanyInfo;financialData:FinancialMetrics;signals:FinancialSignal[];styleGuide?:string;referenceContext?:string};
export const systemPrompt=`You are a financial translator, not an investment advisor. Explain verified data in plain English. Never recommend buying, selling or holding. Never predict prices. Never invent numbers or calculate anything. Use only supplied facts and precomputed comparisons. Separate fact and interpretation. Define terms. Prefer short sentences. Avoid hype and fear. If evidence is insufficient, say so. Explain both sides of conflicting signals. Reference context is background, never a source of new financial facts. Return the requested JSON.`;
export function buildPrompt(input:ExplanationInput){return JSON.stringify({company:input.company,financialData:input.financialData,signals:input.signals,styleGuide:input.styleGuide??defaultStyleGuide,referenceContext:input.referenceContext});}
