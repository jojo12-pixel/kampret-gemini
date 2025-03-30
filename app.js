import { config } from './config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setupGifWorkspace } from './gif-utils.js';
import { analyzeImageStyle, createStylePreservingPrompt } from './image-analyzer.js';
import { initializeTransformer, generateSuggestions } from './character-transformer.js';
import { initializeStyleTransformer, applyStyles, detailedStylePresets } from './style-transformer-enhanced.js';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(config.apiKey);

// DOM Elements
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('preview-container');
const promptInputs = document.querySelectorAll('.prompt-input');
const singlePromptInput = document.getElementById('singlePromptInput');
const generateBtn = document.getElementById('generateBtn');
const imageGrid = document.getElementById('imageGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const togglePromptModeBtn = document.getElementById('togglePromptMode');
const multiplePromptsContainer = document.getElementById('multiplePromptsContainer');
const singlePromptContainer = document.getElementById('singlePromptContainer');
const createGifBtn = document.getElementById('createGifBtn');
const presetToggle = document.getElementById('presetToggle');
const presetList = document.getElementById('presetList');
const characterPresetToggle = document.getElementById('characterPresetToggle');
const characterPresetList = document.getElementById('characterPresetList');
const designPresetToggle = document.getElementById('designPresetToggle');
const designPresetList = document.getElementById('designPresetList');
const modeTabAnimation = document.getElementById('modeTabAnimation');
const modeTabCharacter = document.getElementById('modeTabCharacter');
const modeTabStyle = document.getElementById('modeTabStyle');
const animationModeContent = document.getElementById('animationModeContent');
const characterModeContent = document.getElementById('characterModeContent');
const styleModeContent = document.getElementById('styleModeContent');
const autoGenerateBtn = document.getElementById('autoGenerateBtn');
const styleInput = document.getElementById('styleInput');

// Current uploaded image data
let currentImageData = null;
let isAutoPromptMode = true;
let generatedImages = [];
let currentMode = 'animation'; // 'animation', 'character', or 'style'
let currentImageStyle = null; // Store analyzed style information

// Make currentImageData accessible to other modules
window.currentImageData = null;

// Event Listeners
dropArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('dragleave', handleDragLeave);
dropArea.addEventListener('drop', handleDrop);
generateBtn.addEventListener('click', generateImages);
togglePromptModeBtn.addEventListener('click', togglePromptMode);
createGifBtn.addEventListener('click', createGif);
presetToggle.addEventListener('click', togglePresetList);
document.addEventListener('paste', handlePaste);
modeTabAnimation.addEventListener('click', () => switchMode('animation'));
modeTabCharacter.addEventListener('click', () => switchMode('character'));
modeTabStyle.addEventListener('click', () => switchMode('style'));
characterPresetToggle.addEventListener('click', toggleCharacterPresetList);
designPresetToggle.addEventListener('click', toggleDesignPresetList);

// Switch between animation, character transformation, and style modes
function switchMode(mode) {
    currentMode = mode;
    
    // Reset all tabs and content
    modeTabAnimation.classList.remove('active');
    modeTabCharacter.classList.remove('active');
    modeTabStyle.classList.remove('active');
    animationModeContent.style.display = 'none';
    characterModeContent.style.display = 'none';
    styleModeContent.style.display = 'none';
    
    // Activate selected tab and content
    if (mode === 'animation') {
        modeTabAnimation.classList.add('active');
        animationModeContent.style.display = 'block';
    } else if (mode === 'character') {
        modeTabCharacter.classList.add('active');
        characterModeContent.style.display = 'block';
    } else if (mode === 'style') {
        modeTabStyle.classList.add('active');
        styleModeContent.style.display = 'block';
    }
}

// Initialize character preset list
function initializeCharacterPresets() {
    config.characterPresets.forEach(character => {
        const characterElement = document.createElement('div');
        characterElement.className = 'character-item';
        characterElement.textContent = character;
        characterElement.addEventListener('click', () => {
            document.getElementById('characterInput').value = character;
            toggleCharacterPresetList();
        });
        characterPresetList.appendChild(characterElement);
    });
}

// Toggle character preset list dropdown
function toggleCharacterPresetList() {
    characterPresetList.classList.toggle('show');
}

// Toggle preset prompts dropdown
function togglePresetList() {
    presetList.classList.toggle('show');
}

// Initialize preset prompts list
function initializePresetPrompts() {
    config.presetPrompts.forEach(prompt => {
        const promptElement = document.createElement('div');
        promptElement.className = 'preset-item';
        promptElement.textContent = prompt;
        promptElement.addEventListener('click', () => {
            singlePromptInput.value = prompt;
            togglePresetList();
        });
        presetList.appendChild(promptElement);
    });
    
    // Initialize character presets
    initializeCharacterPresets();
}

// Toggle design preset list dropdown
function toggleDesignPresetList() {
    designPresetList.classList.toggle('show');
}

// Handle clipboard paste for images
function handlePaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    
    for (const item of items) {
        if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            processImageFile(blob);
            break;
        }
    }
}

// Create GIF from the generated frames
function createGif() {
    setupGifWorkspace(generatedImages);
}

// Toggle between single prompt and multiple prompts mode
function togglePromptMode() {
    isAutoPromptMode = !isAutoPromptMode;
    
    if (isAutoPromptMode) {
        singlePromptContainer.classList.add('active');
        multiplePromptsContainer.classList.remove('active');
        togglePromptModeBtn.textContent = 'Switch to Manual Prompts';
    } else {
        singlePromptContainer.classList.remove('active');
        multiplePromptsContainer.classList.add('active');
        togglePromptModeBtn.textContent = 'Switch to Auto Prompts';
    }
}

// Process uploaded image file
function processImageFile(file) {
    if (!file.type.match('image.*')) {
        alert('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        currentImageData = e.target.result;
        window.currentImageData = currentImageData; // Make it accessible globally
        previewContainer.innerHTML = `<img src="${currentImageData}" alt="Uploaded image preview">`;
        
        // Add suggestion based on image
        promptInputs.forEach(input => {
            input.placeholder = "Describe how you want to transform this image...";
        });
        
        // Analyze image style
        const loadingMessage = document.createElement('div');
        loadingMessage.textContent = "Analyzing image style...";
        loadingMessage.style.color = "var(--secondary-color)";
        loadingMessage.style.marginTop = "10px";
        loadingMessage.style.textAlign = "center";
        previewContainer.appendChild(loadingMessage);
        
        currentImageStyle = await analyzeImageStyle(currentImageData);
        
        // Remove loading message
        previewContainer.removeChild(loadingMessage);
        
        // Show style info if available
        if (currentImageStyle) {
            const styleInfo = document.createElement('div');
            styleInfo.className = 'style-info';
            styleInfo.innerHTML = `<div class="style-badge">Style: ${currentImageStyle.style || 'Unknown'}</div>`;
            
            if (currentImageStyle.palette && currentImageStyle.palette.length > 0) {
                const paletteDiv = document.createElement('div');
                paletteDiv.className = 'color-palette';
                currentImageStyle.palette.forEach(color => {
                    const colorSwatch = document.createElement('div');
                    colorSwatch.className = 'color-swatch';
                    colorSwatch.style.backgroundColor = color;
                    colorSwatch.title = color;
                    paletteDiv.appendChild(colorSwatch);
                });
                styleInfo.appendChild(paletteDiv);
            }
            
            previewContainer.appendChild(styleInfo);
        }
        
        // Auto-generate suggestions for character mode if we're in that mode
        if (currentMode === 'character') {
            generateSuggestions();
        }
    };
    
    reader.readAsDataURL(file);
}

// File handling functions
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('highlight');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('highlight');
    
    if (e.dataTransfer.files.length) {
        processImageFile(e.dataTransfer.files[0]);
    }
}

// Generate frame prompts from a single input
async function generateFramePrompts(basePrompt) {
    try {
        const thinkingModel = genAI.getGenerativeModel({
            model: config.thinkingModel,
        });
        
        // Extract just the base64 data from the data URL for more compact request
        const base64Image = currentImageData.split(',')[1];
        
        // Add style information to the request
        let styleContext = "";
        if (currentImageStyle) {
            styleContext = `
            The image has the following style characteristics:
            - Style: ${currentImageStyle.style || 'Unknown'}
            - Dominant colors: ${currentImageStyle.palette ? currentImageStyle.palette.join(', ') : 'Unknown'}
            - Background: ${currentImageStyle.background || 'Unknown'}
            - Lighting: ${currentImageStyle.lighting || 'Unknown'}
            - Texture: ${currentImageStyle.texture || 'Unknown'}
            
            CRITICAL: Each prompt MUST meticulously maintain all these style characteristics with precise detail!
            Each prompt must be at least 20 words long and specifically describe how to maintain the exact style, colors, lighting, texture, and composition.
            `;
        }
        
        // Create the content with the image and prompt
        const parts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                }
            },
            { text: `
            I'm seeing this image and I want to create a sequence of 6 frames showing a continuous motion or transformation based on this prompt: "${basePrompt}".
            
            ${styleContext}
            
            Looking at the specific content of the image, generate 6 detailed prompts, one for each frame, that show a clear progression or animation sequence based on both the image content and the action prompt.
            
            REQUIREMENTS:
            1. Each prompt MUST be at least 20 words long with specific style preservation details
            2. Each prompt must explicitly instruct to preserve the original image's exact style, colors, lighting, texture, and background
            3. Each prompt must maintain perfect visual consistency across all frames
            4. Prompts must be specific to the actual content visible in the image
            5. Each prompt should read as a complete instruction for transforming the original image
            
            For example, if there's a person in the image and the base prompt is "walk", you might generate:
            Frame 1: "Transform this image to show the person beginning to take a step with right foot forward while meticulously preserving the exact lighting, color palette, texture details, background elements, and compositional balance of the original image."
            
            Return ONLY the 6 prompts in a JSON array format like this:
            ["Frame 1 prompt", "Frame 2 prompt", "Frame 3 prompt", "Frame 4 prompt", "Frame 5 prompt", "Frame 6 prompt"]
            
            Your prompts should be specific to the actual objects, people, or scenes shown in the image while strictly preserving style.
            `}
        ];
        
        const result = await thinkingModel.generateContent(parts);
        const text = result.response.text();
        
        // Extract JSON array from response
        try {
            // Find anything that looks like a JSON array in the response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const prompts = JSON.parse(jsonMatch[0]);
                return prompts.slice(0, 6); // Ensure we have exactly 6 prompts
            } else {
                throw new Error("Could not find JSON array in response");
            }
        } catch (parseError) {
            console.error("Error parsing prompts:", parseError);
            
            // Fallback: split text into 6 parts if JSON parsing fails
            const lines = text.split('\n').filter(line => line.trim().length > 0);
            const prompts = [];
            
            for (let i = 0; i < 6; i++) {
                if (lines[i]) {
                    prompts.push(lines[i].replace(/^(Frame \d+:|\d+\.|\*)\s*/, '').trim());
                } else {
                    prompts.push(`${basePrompt} - variation ${i+1}`);
                }
            }
            
            return prompts;
        }
    } catch (error) {
        console.error("Error generating frame prompts:", error);
        // Fallback to basic prompts
        return [
            `${basePrompt} - first step`,
            `${basePrompt} - second step`,
            `${basePrompt} - third step`,
            `${basePrompt} - fourth step`,
            `${basePrompt} - fifth step`,
            `${basePrompt} - final step`
        ];
    }
}

// Generate images based on user prompts for each frame
async function generateImages() {
    if (!currentImageData) {
        alert('Please upload an image first');
        return;
    }
    
    // Reset generated images array
    generatedImages = [];
    
    // Show loading indicator
    loadingSpinner.style.display = 'flex';
    imageGrid.innerHTML = '';
    
    let framePrompts = [];
    
    if (currentMode === 'animation') {
        if (isAutoPromptMode) {
            const basePrompt = singlePromptInput.value.trim();
            if (!basePrompt) {
                alert('Please enter a prompt');
                return;
            }
            
            // Show "Generating prompts..." message
            loadingSpinner.querySelector('p').textContent = 'Generating prompts...';
            
            // Generate frame prompts from the single input
            framePrompts = await generateFramePrompts(basePrompt);
            
            // Update the multiple prompts textareas with the generated prompts
            promptInputs.forEach((input, index) => {
                if (framePrompts[index]) {
                    input.value = framePrompts[index];
                }
            });
            
            // Update loading message
            loadingSpinner.querySelector('p').textContent = 'Generating images...';
        } else {
            // Get prompts from the multiple textareas
            framePrompts = Array.from(promptInputs).map(input => input.value.trim());
            if (framePrompts.every(prompt => prompt === '')) {
                alert('Please enter at least one prompt to describe the image transformation');
                return;
            }
        }
    } else if (currentMode === 'character') {
        // Character transformation mode
        const characterInput = document.getElementById('characterInput').value.trim();
        if (!characterInput) {
            alert('Please enter a character or select from presets');
            return;
        }
        
        // Generate prompts for character transformation
        // Keep same background and style, change subject to different characters
        const baseDescript = characterInput.split(',').map(char => char.trim()).filter(char => char);
        
        if (baseDescript.length === 0) {
            alert('Please enter at least one character');
            return;
        }
        
        // Fill up to 6 characters if needed by repeating
        while (baseDescript.length < 6) {
            baseDescript.push(baseDescript[baseDescript.length % baseDescript.length]);
        }
        
        // Create detailed transformation prompts with style preservation (minimum 20 words)
        if (currentImageStyle) {
            framePrompts = baseDescript.map((char, i) => 
                `Transform this image into a ${char} while meticulously preserving the ${currentImageStyle.style || 'current'} style, the ${currentImageStyle.background || 'existing'} background, the ${currentImageStyle.lighting || 'original'} lighting conditions, color relationships, textural details, compositional balance, and spatial arrangement of elements. Maintain the exact mood and aesthetic quality.`
            );
        } else {
            framePrompts = baseDescript.map((char, i) => 
                `Transform this image into a ${char} while precisely maintaining the original style, color palette, lighting characteristics, textural details, background elements, compositional structure, and overall visual identity. Ensure perfect preservation of the aesthetic qualities and mood while changing only the subject.`
            );
        }
    } else if (currentMode === 'style') {
        // Style transformation mode
        const styleInput = document.getElementById('styleInput').value.trim();
        if (!styleInput) {
            alert('Please enter a style or select from presets');
            loadingSpinner.style.display = 'none';
            return;
        }
        
        // Show more detailed loading message
        loadingSpinner.querySelector('p').textContent = 'Analyzing colors and applying style...';
        
        // Generate the style transformations using our enhanced module
        const results = await applyStyles(styleInput);
        
        if (!results || results.length === 0) {
            imageGrid.innerHTML = `
                <div class="error-message">
                    Error generating styled images. Please try again.
                </div>
            `;
            loadingSpinner.style.display = 'none';
            return;
        }
        
        // Create image cards for the results
        results.forEach((imageData, index) => {
            generatedImages.push(imageData);
            const caption = `Style: ${imageData.style}`;
            
            // Extract base64 data from the dataUrl
            const base64Image = imageData.dataUrl.split(',')[1];
            createImageCard(base64Image, caption, index + 1);
        });
        
        // Add the original image as first image
        const originalImageData = currentImageData.split(',')[1];
        generatedImages.unshift({
            dataUrl: currentImageData,
            prompt: "Original Image",
            index: 0
        });
        createImageCard(originalImageData, "Original Image", 0);
        
        // Enable the Create GIF button
        createGifBtn.disabled = false;
        
        loadingSpinner.style.display = 'none';
        return;
    }
    
    try {
        // Extract just the base64 data from the data URL
        const base64Image = currentImageData.split(',')[1];
        
        // Generate each frame separately based on its prompt
        for (let i = 0; i < framePrompts.length; i++) {
            let framePrompt = framePrompts[i];
            if (!framePrompt) continue; // Skip empty prompts
            
            // Enhance prompt with style preservation if available
            if (currentImageStyle) {
                framePrompt = createStylePreservingPrompt(framePrompt, currentImageStyle);
            }
            
            // Configure the model with image generation capability
            const model = genAI.getGenerativeModel({
                model: config.model,
                generationConfig: {
                    responseModalities: config.imageGeneration.responseModalities,
                },
            });
            
            // Create the content with the image and enhanced prompt
            const parts = [
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/jpeg"
                    }
                },
                { text: `Transform this image according to the following description: ${framePrompt}` }
            ];

            // Generate content
            const response = await model.generateContent(parts);
            
            // Process the response
            const result = response.response;
            
            if (result.candidates && result.candidates.length > 0) {
                const candidate = result.candidates[0];
                
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        const imageData = part.inlineData.data;
                        const imageUrl = `data:image/jpeg;base64,${imageData}`;
                        generatedImages.push({
                            dataUrl: imageUrl,
                            prompt: framePrompt,
                            index: i + 1
                        });
                        createImageCard(imageData, `Frame ${i+1}: ${framePrompt.substring(0, 30)}...`, i+1);
                        break; // Only use the first image from each response
                    }
                }
            }
        }
        
        // Add the original image as "Frame 0"
        const originalImageData = currentImageData.split(',')[1];
        const originalImageUrl = `data:image/jpeg;base64,${originalImageData}`;
        generatedImages.unshift({
            dataUrl: currentImageData,
            prompt: "Original Image",
            index: 0
        });
        createImageCard(originalImageData, "Original Image", 0);
        
        // Enable the Create GIF button
        createGifBtn.disabled = false;
        
    } catch (error) {
        console.error("Error generating content:", error);
        imageGrid.innerHTML = `
            <div class="error-message">
                Error generating images: ${error.message || 'Unknown error'}
            </div>
        `;
    } finally {
        loadingSpinner.style.display = 'none';
    }
}

// Create and display an image card in the grid
function createImageCard(imageData, caption, index) {
    const delay = index * config.ui.animationDelay;
    const imageUrl = `data:image/jpeg;base64,${imageData}`;
    
    const card = document.createElement('div');
    card.className = 'image-card';
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s, transform 0.5s';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${caption}">
        <div class="caption">${caption}</div>
        <a href="${imageUrl}" download="generated-image-${index}.jpg" class="download-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </a>
    `;
    
    imageGrid.appendChild(card);
    
    // Animate card appearance
    setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, delay);
}

// Initialize presets when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializePresetPrompts();
    initializeTransformer(); // Initialize the transformer UI
    initializeStyleTransformer(); // Initialize the style transformer UI
    switchMode('animation'); // Start with animation mode
});