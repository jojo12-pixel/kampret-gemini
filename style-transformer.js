// Style transformer module for applying different art styles to images
import { config } from './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { analyzeImageStyle, createStylePreservingPrompt } from './image-analyzer.js';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(config.apiKey);

/**
 * Initialize the style transformer UI elements
 */
export function initializeStyleTransformer() {
    const autoGenerateStyleBtn = document.getElementById('autoGenerateStyleBtn');
    const stylePresetToggle = document.getElementById('stylePresetToggle');
    const stylePresetList = document.getElementById('stylePresetList');
    const styleInput = document.getElementById('styleInput');
    
    // Initialize style preset list
    if (stylePresetList) {
        config.stylePresets.forEach(style => {
            const styleElement = document.createElement('div');
            styleElement.className = 'style-item';
            styleElement.textContent = style;
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
 * Generate style suggestions based on the uploaded image
 */
export async function generateStyleSuggestions() {
    const imageData = window.currentImageData;
    if (!imageData) {
        alert('Please upload an image first');
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
            }
        } catch (parseError) {
            console.error("Error parsing style suggestions:", parseError);
        }
        
        // Fallback to default suggestions if parsing fails
        displayStyleSuggestions([
            "Disney style", "Pixar style", "Anime style", 
            "Watercolor painting", "Oil painting", "Cartoon style"
        ]);
        
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
        
        item.addEventListener('click', () => {
            document.getElementById('styleInput').value = suggestion;
        });
        
        grid.appendChild(item);
    });
    
    styleSuggestionGrid.appendChild(grid);
}

/**
 * Apply styles to an image while preserving content
 * @param {string} stylePrompt - Style to apply
 * @param {string} imageData - Image data URL
 * @returns {Promise<Array>} - Array of generated images
 */
export async function applyStyles(stylePrompt) {
    const imageData = window.currentImageData;
    if (!imageData || !stylePrompt) {
        return null;
    }
    
    try {
        // Analyze image style first to preserve content
        const styleInfo = await analyzeImageStyle(imageData);
        
        // Create appropriate prompts for different styles
        let stylesArray = stylePrompt.split(',').map(s => s.trim()).filter(s => s);
        if (stylesArray.length === 0) {
            stylesArray = [stylePrompt];
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
            
            // Craft a detailed prompt with at least 20 words that preserves content but changes style
            let enhancedPrompt = `Precisely transform this image into ${style} style, `;
            
            // Add extensive style preservation instructions
            if (styleInfo) {
                enhancedPrompt += `while meticulously maintaining the exact subject matter, pose, composition, and spatial arrangement. `;
                
                if (styleInfo.background && styleInfo.background !== "unknown") {
                    enhancedPrompt += `Carefully preserve the fundamental elements of the background (${styleInfo.background}) while adapting them to the new style. `;
                }
                
                // Add detailed color instructions
                if (styleInfo.palette && styleInfo.palette.length > 0) {
                    enhancedPrompt += `Adapt the color palette to match the ${style} aesthetic while respecting the original color relationships and these key colors: ${styleInfo.palette.slice(0, 3).join(', ')}. `;
                }
                
                if (styleInfo.lighting && styleInfo.lighting !== "unknown") {
                    enhancedPrompt += `Maintain the ${styleInfo.lighting} lighting characteristics adapted to ${style} conventions. `;
                }
                
                if (styleInfo.texture && styleInfo.texture !== "unknown") {
                    enhancedPrompt += `Translate the ${styleInfo.texture} texture qualities into the ${style} visual language. `;
                }
            }
            
            enhancedPrompt += `The result should be immediately recognizable as the same subject/scene but rendered authentically in ${style}, as if originally created in that style while preserving all compositional elements.`;
            
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