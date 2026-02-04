import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import type { BrandConstitution, CanvasElement } from "@/lib/types";
import type { AuditResult } from "@/lib/types";

// Initialize Gemini client (server-side only)
function getGeminiClient(): GoogleGenerativeAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    return new GoogleGenerativeAI(apiKey);
}

// Get the model for analysis/reasoning
function getAnalysisModel(): GenerativeModel {
    return getGeminiClient().getGenerativeModel({ model: "gemini-2.0-flash" });
}

/**
 * Agent A: The Archivist
 * Analyzes canvas elements and generates the Brand Constitution
 */
export async function analyzeAndGenerateConstitution(
    elements: CanvasElement[]
): Promise<BrandConstitution> {
    const model = getAnalysisModel();

    // Build context from canvas elements
    const context = elements
        .map((el) => {
            if (el.type === "image") {
                return `[IMAGE: ${el.name || "Unnamed"} - URL: ${el.url}]`;
            }
            if (el.type === "note") {
                return `[NOTE: "${el.text}"]`;
            }
            if (el.type === "color") {
                return `[COLOR SWATCH: ${el.color}]`;
            }
            return "";
        })
        .filter(Boolean)
        .join("\n");

    const systemPrompt = `ROLE: You are the Guardian of the Brand Identity.
INPUT: A list of image URLs, text notes, and color swatches from the user's 'Moodboard'.
TASK: Analyze the inputs to deduce the 'Brand Constitution'.

OUTPUT FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "visual_identity": {
    "color_palette_hex": ["#HEXCOLOR1", "#HEXCOLOR2", ...],
    "photography_style": "Describe the visual style in detail",
    "forbidden_elements": ["Element 1", "Element 2", ...]
  },
  "voice": {
    "tone": "Describe the brand tone",
    "keywords": ["keyword1", "keyword2", ...]
  },
  "risk_thresholds": {
    "nudity": "STRICT_ZERO_TOLERANCE" or "ALLOW_ARTISTIC",
    "political": "STRICT_ZERO_TOLERANCE" or "ALLOW_SATIRE"
  }
}

CONSTRAINT: If conflicting images exist, prioritize the most recent and note the shift.`;

    const result = await model.generateContent([
        { text: systemPrompt },
        { text: `\nCANVAS ELEMENTS:\n${context}` },
    ]);

    const response = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
    const jsonStr = jsonMatch[1]?.trim() || response.trim();

    try {
        return JSON.parse(jsonStr) as BrandConstitution;
    } catch {
        // Return a default constitution if parsing fails
        console.error("Failed to parse constitution:", jsonStr);
        return {
            visual_identity: {
                color_palette_hex: ["#00FFCC", "#FF00FF", "#000000"],
                photography_style: "Unable to analyze - using defaults",
                forbidden_elements: [],
            },
            voice: {
                tone: "Modern, Bold",
                keywords: ["Brand", "Creative"],
            },
            risk_thresholds: {
                nudity: "STRICT_ZERO_TOLERANCE",
                political: "STRICT_ZERO_TOLERANCE",
            },
        };
    }
}

/**
 * Agent B: The Fabricator
 * Generates an enhanced prompt based on the constitution
 */
export function buildEnhancedPrompt(
    userPrompt: string,
    constitution: BrandConstitution
): string {
    const { visual_identity, voice } = constitution;

    return `Generate an image for: ${userPrompt}

MANDATORY STYLE GUIDE:
- Color Palette: Use ONLY these colors: ${visual_identity.color_palette_hex.join(", ")}
- Visual Style: ${visual_identity.photography_style}
- Tone/Mood: ${voice.tone}
- Keywords to embody: ${voice.keywords.join(", ")}

FORBIDDEN ELEMENTS (DO NOT INCLUDE):
${visual_identity.forbidden_elements.map((e) => `- ${e}`).join("\n")}

The final image MUST feel cohesive with the brand identity described above.`;
}

/**
 * Agent C: The Sentinel
 * Audits generated assets against the brand constitution
 */
export async function auditAsset(
    imageUrl: string,
    constitution: BrandConstitution
): Promise<AuditResult> {
    const model = getAnalysisModel();

    const systemPrompt = `ROLE: You are the ISO-9001 Compliance Auditor for brand assets.
INPUT: A generated image URL and the Brand Constitution JSON.
TASK: Perform a compliance audit of the image against the brand guidelines.

BRAND CONSTITUTION:
${JSON.stringify(constitution, null, 2)}

OUTPUT FORMAT: Return ONLY valid JSON matching this exact schema:
{
  "compliance_score": <number 0-100>,
  "pass": <boolean - true if score > 90>,
  "heatmap_coordinates": [
    {"x": <0-100>, "y": <0-100>, "issue": "Description of issue"}
  ],
  "fix_instructions": "Detailed instructions on how to fix issues"
}

Be strict in your evaluation. Check:
1. Color compliance - are only approved colors used?
2. Style compliance - does it match the photography style?
3. Forbidden elements - are any present?
4. Tone - does it match the brand voice?`;

    const result = await model.generateContent([
        { text: systemPrompt },
        { text: `\nIMAGE TO AUDIT: ${imageUrl}` },
    ]);

    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, response];
    const jsonStr = jsonMatch[1]?.trim() || response.trim();

    try {
        return JSON.parse(jsonStr) as AuditResult;
    } catch {
        // Return a default audit result if parsing fails
        console.error("Failed to parse audit result:", jsonStr);
        return {
            compliance_score: 50,
            pass: false,
            heatmap_coordinates: [],
            fix_instructions: "Unable to complete audit - please regenerate",
        };
    }
}
