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
            .describe("DEEP DIVE: Provide a professional, evocative description (MINIMUM 50 WORDS) of the photography and visual style, including lighting, composition, and texture."),
        forbidden_elements: z
            .array(z.string())
            .describe("Elements that should never appear in brand assets"),
    }),
    voice: z.object({
        tone: z
            .string()
            .describe("DEEP DIVE: Provide a detailed breakdown (MINIMUM 50 WORDS) of the brand's voice and tone. Explain the emotional impact and communication style."),
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
        .describe("Whether the image passes brand compliance (typically score >= 90)"),
    heatmap_coordinates: z
        .array(
            z.object({
                x: z.number().min(0).max(100),
                y: z.number().min(0).max(100),
                issue: z.string(),
            })
        )
        .describe("Coordinates of issues found in the image"),
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
 */
export function zodToGeminiSchema(schema: z.ZodType): any {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { zodToJsonSchema } = require("zod-to-json-schema");
        const jsonSchema = zodToJsonSchema(schema, { target: "openApi3" });

        // Gemini 3 responseSchema doesn't like $schema or definitions at the top level
        // It wants the actual schema object
        if (jsonSchema && typeof jsonSchema === "object") {
            const cleanSchema = { ...jsonSchema };
            delete (cleanSchema as any).$schema;
            delete (cleanSchema as any).definitions;
            return cleanSchema;
        }
        return jsonSchema;
    } catch (error) {
        console.warn("zod-to-json-schema error:", error);
        return {};
    }
}
