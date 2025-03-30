// Image style analyzer for accurately preserving visual characteristics
import { config } from './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(config.apiKey);

/**
 * Analyzes an image to extract its style, colors, and visual characteristics
 * @param {string} imageDataUrl - The data URL of the image to analyze
 * @returns {Promise<Object>} - Object containing style information
 */
export async function analyzeImageStyle(imageDataUrl) {
    try {
        const thinkingModel = genAI.getGenerativeModel({
            model: config.thinkingModel,
        });
        
        // Extract base64 data from the data URL
        const base64Image = imageDataUrl.split(',')[1];
        
        // Create the content with the image
        const parts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            },
            { text: `
            Analyze this image and extract detailed style information:
            1. Main color palette (list the top 5-7 colors with their approximate hex codes)
            2. Overall style (realistic, cartoon, 3D render, painting, etc.)
            3. Lighting characteristics (bright, dark, high contrast, etc.)
            4. Texture details (smooth, grainy, detailed, etc.)
            5. Background description
            
            Return ONLY a JSON object with this structure:
            {
                "palette": ["#HEXCODE1", "#HEXCODE2", ...],
                "dominantColor": "#HEXCODE",
                "backgroundColor": "#HEXCODE",
                "style": "brief style description",
                "lighting": "lighting description",
                "texture": "texture description",
                "background": "background description"
            }
            `}
        ];
        
        const result = await thinkingModel.generateContent(parts);
        const text = result.response.text();
        
        // Extract JSON object from response
        try {
            // Find anything that looks like a JSON object in the response
            const jsonMatch = text.match(/{[\s\S]*}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Could not find JSON object in response");
            }
        } catch (parseError) {
            console.error("Error parsing style analysis:", parseError);
            // Return a default style object
            return {
                palette: [],
                dominantColor: null,
                backgroundColor: null,
                style: "unknown",
                lighting: "unknown",
                texture: "unknown",
                background: "unknown"
            };
        }
    } catch (error) {
        console.error("Error analyzing image style:", error);
        return null;
    }
}

/**
 * Automatically suggests diverse alternatives based on image content
 * @param {string} imageDataUrl - The data URL of the image to analyze
 * @param {string} mode - The transformation mode ('character' or 'design')
 * @returns {Promise<Array>} - Array of suggested transformation targets
 */
export async function suggestTransformationTargets(imageDataUrl, mode = 'character') {
    try {
        const thinkingModel = genAI.getGenerativeModel({
            model: config.thinkingModel,
        });
        
        // Extract base64 data from the data URL
        const base64Image = imageDataUrl.split(',')[1];
        
        let instructions = "";
        if (mode === 'character') {
            instructions = `Analyze this image and suggest 6 diverse characters that would look interesting if this image were transformed into them while maintaining the same style, colors, and setting.`;
        } else if (mode === 'design') {
            instructions = `Analyze this image and suggest 6 different design variations that would maintain the same style, color palette, and overall feel but with different layouts or elements.`;
        } else {
            instructions = `Analyze this image and suggest 6 diverse alternatives or variations that would look interesting while maintaining the same visual style and aesthetic.`;
        }
        
        // Create the content with the image
        const parts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            },
            { text: `
            ${instructions}
            
            First determine what type of content this image contains (character, product, interior design, landscape, etc.).
            
            Return ONLY a JSON object with this structure:
            {
                "contentType": "brief description of what the image contains",
                "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5", "suggestion6"]
            }
            `}
        ];
        
        const result = await thinkingModel.generateContent(parts);
        const text = result.response.text();
        
        // Extract JSON object from response
        try {
            // Find anything that looks like a JSON object in the response
            const jsonMatch = text.match(/{[\s\S]*}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Could not find JSON object in response");
            }
        } catch (parseError) {
            console.error("Error parsing suggestions:", parseError);
            // Return default suggestions
            return {
                contentType: "unknown",
                suggestions: mode === 'character' ? 
                    ["rabbit", "dragon", "fox", "owl", "tiger", "raccoon"] : 
                    ["variation 1", "variation 2", "variation 3", "variation 4", "variation 5", "variation 6"]
            };
        }
    } catch (error) {
        console.error("Error suggesting transformations:", error);
        return {
            contentType: "unknown",
            suggestions: ["option 1", "option 2", "option 3", "option 4", "option 5", "option 6"]
        };
    }
}

/**
 * Creates a style-preserving prompt by enhancing user input with style information
 * @param {string} basePrompt - User's original prompt
 * @param {Object} styleInfo - Style information from analyzeImageStyle
 * @returns {string} - Enhanced prompt with style preservation instructions
 */
export function createStylePreservingPrompt(basePrompt, styleInfo) {
    if (!styleInfo) return basePrompt;
    
    let enhancedPrompt = basePrompt;
    
    // Add detailed style preservation instructions (minimum 20 words)
    let styleDescription = "";
    
    if (styleInfo.style && styleInfo.style !== "unknown") {
        styleDescription += `the ${styleInfo.style} style, `;
    }
    
    if (config.styleAnalysis && config.styleAnalysis.preserveColors && styleInfo.dominantColor) {
        styleDescription += `with dominant color ${styleInfo.dominantColor} and the specific color palette, `;
    }
    
    if (config.styleAnalysis && config.styleAnalysis.preserveBackground && styleInfo.background && styleInfo.background !== "unknown") {
        styleDescription += `the original background details (${styleInfo.background}), `;
    }
    
    if (styleInfo.lighting && styleInfo.lighting !== "unknown") {
        styleDescription += `the ${styleInfo.lighting} lighting characteristics, `;
    }
    
    if (styleInfo.texture && styleInfo.texture !== "unknown") {
        styleDescription += `the ${styleInfo.texture} texture qualities, `;
    }
    
    enhancedPrompt += `. Transform this image while meticulously preserving ${styleDescription} composition, and overall visual identity of the original image. Maintain exact proportions, perspective, and spatial arrangement while applying the transformation.`;
    
    return enhancedPrompt;
}