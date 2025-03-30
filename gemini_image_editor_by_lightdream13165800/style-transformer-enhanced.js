// Advanced style transformer with detailed preset definitions and color-focused analysis
import { config } from './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(config.apiKey);

// Define detailed style characteristics for more accurate transformations
const detailedStylePresets = {
    "Disney style": "the classic Disney animation style with smooth, rounded forms, expressive eyes, soft shading, vibrant colors, and fluid movement. Characters have distinctive silhouettes and proportions with slightly exaggerated features.",
    "Pixar style": "the Pixar 3D animation style with realistic texturing, advanced lighting, detailed surfaces, slightly exaggerated proportions, and expressive facial features. Characters have rounded forms with realistic physical properties.",
    "Studio Ghibli": "Hayao Miyazaki's distinctive anime style with painterly backgrounds, soft watercolor effects, detailed environmental elements, naturalistic lighting, and characters with simple facial features but complex emotions.",
    "Anime style": "Japanese animation style with bold outlines, large expressive eyes, simplified facial features, dramatic lighting effects, stylized hair, and vibrant color palettes with flat shading.",
    "Manga style": "Japanese comic style with bold black and white line art, dramatic shading, speed lines for motion, exaggerated expressions, and distinctive character designs with simplified but recognizable features.",
    "The Simpsons style": "Matt Groening's distinctive yellow-skinned characters with overbites, bulging eyes, four fingers per hand, minimal shading, bold outlines, and flat colors with minimal shadows.",
    "Family Guy style": "Seth MacFarlane's cartoon style with thick outlines, simple shapes, minimalistic features, round eyes, distinctive chin shapes, and flat colors with minimal shadows.",
    "South Park style": "paper cut-out appearance with simple geometric shapes, flat colors, minimal detail, jerky movements, and crude aesthetic with boldly outlined characters.",
    "Adventure Time style": "whimsical, simple designs with thin, bendy limbs, minimal facial features, solid colors, rounded shapes, and surreal, playful proportions.",
    "Rick and Morty style": "distinctive wide-eyed characters with thin outlines, uneven pupils, drool details, simple color blocking, and slightly sketchy, imperfect line quality."
};

/**
 * Initialize the style transformer UI elements
 */
export function initializeStyleTransformer() {
    const autoGenerateStyleBtn = document.getElementById('autoGenerateStyleBtn');
    const stylePresetToggle = document.getElementById('stylePresetToggle');
    const stylePresetList = document.getElementById('stylePresetList');
    const styleInput = document.getElementById('styleInput');
    
    // Initialize style preset list with enhanced detailed presets
    if (stylePresetList) {
        config.stylePresets.forEach(style => {
            const styleElement = document.createElement('div');
            styleElement.className = 'style-item';
            styleElement.textContent = style;
            
            // Add tooltip with detailed style description if available
            if (detailedStylePresets[style]) {
                styleElement.title = detailedStylePresets[style];
            }
            
            styleElement.addEventListener('click', () => {
                styleInput.value = style;
                toggleStylePresetList();
            });
            stylePresetList.appendChild(styleElement);
        });
    }
    
    // Event listeners
    if (stylePresetToggle) {
        stylePresetToggle.addEventListener('click', toggleStylePresetList);
    }
    
    if (autoGenerateStyleBtn) {
        autoGenerateStyleBtn.addEventListener('click', async () => {
            generateStyleSuggestions();
        });
    }
}

/**
 * Toggle style preset list dropdown
 */
export function toggleStylePresetList() {
    const stylePresetList = document.getElementById('stylePresetList');
    if (stylePresetList) {
        stylePresetList.classList.toggle('show');
    }
}

/**
 * Analyze image colors and features without full style analysis
 * @param {string} imageDataUrl - The data URL of the image to analyze
 * @returns {Promise<Object>} - Object containing color and feature information
 */
async function analyzeImageColors(imageDataUrl) {
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
            Analyze ONLY the colors and basic features of this image:
            1. Main color palette (list the top 5-7 colors with their approximate hex codes)
            2. Subject description (what is shown in the image)
            3. Basic composition and layout
            
            Return ONLY a JSON object with this structure:
            {
                "palette": ["#HEXCODE1", "#HEXCODE2", ...],
                "dominantColor": "#HEXCODE",
                "subject": "brief subject description",
                "composition": "basic composition description"
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
            console.error("Error parsing color analysis:", parseError);
            // Return a default color object
            return {
                palette: [],
                dominantColor: null,
                subject: "unknown subject",
                composition: "unknown composition"
            };
        }
    } catch (error) {
        console.error("Error analyzing image colors:", error);
        return null;
    }
}

/**
 * Generate style suggestions based on the uploaded image
 */
export async function generateStyleSuggestions() {
    const imageData = window.currentImageData;
    if (!imageData) {
        alert('Please upload an image');
        return;
    }
    
    // Show loading state
    const styleSuggestionGrid = document.getElementById('styleSuggestionGrid');
    styleSuggestionGrid.innerHTML = '<div class="loading-suggestions">Analyzing image and suggesting styles...</div>';
    
    try {
        const thinkingModel = genAI.getGenerativeModel({
            model: config.thinkingModel,
        });
        
        // Extract base64 data from the data URL
        const base64Image = imageData.split(',')[1];
        
        // Create the content with the image
        const parts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            },
            { text: `
            Analyze this image and suggest 6 diverse artistic styles that would look interesting when applied to this image.
            
            Consider the subject matter and what styles would complement it well.
            
            Return ONLY a JSON object with this structure:
            {
                "subject": "brief description of the main subject",
                "suggestions": ["style1", "style2", "style3", "style4", "style5", "style6"]
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
                const data = JSON.parse(jsonMatch[0]);
                displayStyleSuggestions(data.suggestions, data.subject);
                return;
            } else {
                throw new Error("Could not find JSON object in response");
            }
        } catch (parseError) {
            console.error("Error parsing style suggestions:", parseError);
            // Fallback to default suggestions if parsing fails
            displayStyleSuggestions([
                "Disney style", "Pixar style", "Anime style",
                "Watercolor painting", "Oil painting", "Cartoon style"
            ]);
        }
    } catch (error) {
        console.error("Error suggesting styles:", error);
        styleSuggestionGrid.innerHTML = '<div class="error-message">Error generating style suggestions</div>';
    }
}

/**
 * Display the style suggestions in the grid
 */
function displayStyleSuggestions(suggestions, subject = '') {
    const styleSuggestionGrid = document.getElementById('styleSuggestionGrid');
    styleSuggestionGrid.innerHTML = '';
    
    // Show detected subject if available
    if (subject) {
        const subjectEl = document.createElement('div');
        subjectEl.className = 'content-type-display';
        subjectEl.textContent = `Detected subject: ${subject}`;
        styleSuggestionGrid.appendChild(subjectEl);
    }
    
    // Create suggestion grid
    const grid = document.createElement('div');
    grid.className = 'suggestion-grid';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        
        // Add tooltip with detailed style description if available
        if (detailedStylePresets[suggestion]) {
            item.title = detailedStylePresets[suggestion];
        }
        
        item.addEventListener('click', () => {
            document.getElementById('styleInput').value = suggestion;
        });
        
        grid.appendChild(item);
    });
    
    styleSuggestionGrid.appendChild(grid);
}

/**
 * Apply styles to an image focusing on preserving content
 * @param {string} stylePrompt - Style to apply
 * @returns {Promise<Array>} - Array of generated images
 */
export async function applyStyles(stylePrompt) {
    const imageData = window.currentImageData;
    if (!imageData || !stylePrompt) {
        return null;
    }
    
    try {
        // Analyze image colors instead of full style
        const colorInfo = await analyzeImageColors(imageData);
        
        // Create appropriate prompts for different styles
        let stylesArray = stylePrompt.split(',').map(s => s.trim()).filter(s => s);
        if (stylesArray.length === 0) {
            stylesArray = [stylePrompt ];
        }
        
        // Extract base64 data from the data URL
        const base64Image = imageData.split(',')[1];
        
        // Configure the model with image generation capability
        const model = genAI.getGenerativeModel({
            model: config.model,
            generationConfig: {
                responseModalities: config.imageGeneration.responseModalities,
            },
        });
        
        const results = [];
        
        // Generate each style variation
        for (let i = 0; i < stylesArray.length; i++) {
            const style = stylesArray[i];
            
            // Start with basic style transformation
            let enhancedPrompt = `Transform this image into ${style}`;
            
            // Add detailed style description if available in our preset library
            if (detailedStylePresets[style]) {
                enhancedPrompt += ` with ${detailedStylePresets[style]}`;
            }
            
            // Add color and content preservation instructions
            if (colorInfo) {
                enhancedPrompt += `. Carefully maintain the exact subject matter, pose, composition, and spatial arrangement. `;
                
                if (colorInfo.subject && colorInfo.subject !== "unknown subject") {
                    enhancedPrompt += `The subject is: ${colorInfo.subject}. `;
                }
                
                if (colorInfo.composition && colorInfo.composition !== "unknown composition") {
                    enhancedPrompt += `The composition is: ${colorInfo.composition}. `;
                }
                
                // Add detailed color instructions
                if (colorInfo.palette && colorInfo.palette.length > 0) {
                    enhancedPrompt += `Adapt these key colors to match the ${style} aesthetic while respecting the original color relationships: ${colorInfo.palette.slice(0, 5).join(', ')}. `;
                }
                
                if (colorInfo.dominantColor) {
                    enhancedPrompt += `The dominant color is ${colorInfo.dominantColor}. `;
                }
            }
            
            enhancedPrompt += `The result should be immediately recognizable as the same subject/scene but authentically rendered in ${style}. Ensure perfect preservation of the content, pose, expressions, and composition while only changing the visual style.`;
            
            // Create the content with the image and enhanced prompt
            const parts = [
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/jpeg"
                    }
                },
                { text: enhancedPrompt }
            ];

            // Generate content
            const response = await model.generateContent(parts);
            const result = response.response;
            
            if (result.candidates && result.candidates.length > 0) {
                const candidate = result.candidates[0];
                
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        const imageData = part.inlineData.data;
                        const imageUrl = `data:image/jpeg;base64,${imageData}`;
                        results.push({
                            dataUrl: imageUrl,
                            prompt: enhancedPrompt,
                            style: style,
                            index: i + 1
                        });
                        break; // Only use the first image from each response
                    }
                }
            }
        }
        
        return results;
    } catch (error) {
        console.error("Error applying styles:", error);
        return null;
    }
}

// Export other needed functions
export { detailedStylePresets };