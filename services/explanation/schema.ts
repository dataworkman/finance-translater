import {z} from "zod";
export const explanationSchema=z.object({headline:z.string().min(1).max(200),what_happened:z.string().min(1).max(1500),plain_english:z.string().min(1).max(1500),why_it_matters:z.string().min(1).max(1000),watch_next:z.string().min(1).max(1000)}).strict();
export type Explanation=z.infer<typeof explanationSchema>;
export function validateExplanation(value:unknown){const result=explanationSchema.parse(value);if(/\b(buy|sell|hold|avoid|overvalued|undervalued)\b|target price|stock price prediction/i.test(Object.values(result).join(" ")))throw Error("Non-neutral explanation");return result;}
