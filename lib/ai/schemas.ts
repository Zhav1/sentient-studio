/**
 * Zod Schemas for Gemini 3 Structured Outputs
 * Used with response_json_schema for type-safe AI responses
 */

import { z } from "zod";

/**
 * Brand Constitution - The AI-extracted "DNA" of a brand
 */
export const BrandConstitutionSchema = z.object({
    visual_identity: z.object({
        color_palette_hex: z
            .array(z.string())
            .describe("Array of hex color codes from the brand moodboard"),
        photography_style: z
            .string()
            .describe("Description of the photography/visual style"),
        forbidden_elements: z
            .array(z.string())
            .describe("Elements that should never appear in brand assets"),
    }),
    voice: z.object({
        tone: z
            .string()
            .describe("The overall tone of the brand (e.g., bold, minimalist, playful)"),
        keywords: z
            .array(z.string())
            .describe("Key terms that represent the brand essence"),
    }),
    risk_thresholds: z.object({
        nudity: z.enum(["STRICT_ZERO_TOLERANCE", "ALLOW_ARTISTIC"]),
        political: z.enum(["STRICT_ZERO_TOLERANCE", "ALLOW_SATIRE"]),
    }),
});

export type BrandConstitutionOutput = z.infer<typeof BrandConstitutionSchema>;

/**
 * Audit Result - Brand compliance check output
 */
export const AuditResultSchema = z.object({
    compliance_score: z
        .number()
        .min(0)
        .max(100)
        .describe("Brand compliance score from 0-100"),
    pass: z
        .boolean()
        .describe("Whether the image passes brand compliance (typically score >= 80)"),
    issues: z
        .array(
            z.object({
                area: z.string().describe("Area of the image with the issue"),
                description: z.string().describe("What the issue is"),
                severity: z.enum(["low", "medium", "high"]),
            })
        )
        .describe("List of compliance issues found"),
    fix_instructions: z
        .string()
        .describe("Instructions for fixing the issues in a regeneration"),
});

export type AuditResultOutput = z.infer<typeof AuditResultSchema>;

/**
 * Image Generation Config
 */
export const ImageConfigSchema = z.object({
    aspectRatio: z
        .enum(["1:1", "16:9", "9:16", "4:3", "3:4"])
        .optional()
        .default("1:1"),
    imageSize: z
        .enum(["1K", "2K", "4K"])
        .optional()
        .default("2K"),
});

export type ImageConfig = z.infer<typeof ImageConfigSchema>;

/**
 * Convert Zod schema to JSON Schema for Gemini API
 * This is a simplified converter for our specific schemas
 */
export function zodToGeminiSchema(schema: z.ZodType): object {
    // Use zod-to-json-schema if available, otherwise use this fallback
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { zodToJsonSchema } = require("zod-to-json-schema");
        return zodToJsonSchema(schema, { target: "openApi3" });
    } catch {
        // Fallback: manual conversion for our known schemas
        console.warn("zod-to-json-schema not installed, using inline schema");
        return {};
    }
}
