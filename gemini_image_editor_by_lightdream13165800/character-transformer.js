import { config } from './config.js';
import { suggestTransformationTargets } from './image-analyzer.js';

// Functions for the Character/Design Transformation mode

/**
 * Initialize the transformation UI elements
 */
export function initializeTransformer() {
    const autoGenerateBtn = document.getElementById('autoGenerateBtn');
    const characterModeRadio = document.getElementById('characterModeRadio');
    const designModeRadio = document.getElementById('designModeRadio');
    const suggestionGrid = document.getElementById('suggestionGrid');
    const contentTypeDisplay = document.getElementById('contentTypeDisplay');
    
    // Event listeners
    autoGenerateBtn.addEventListener('click', async () => {
        generateSuggestions();
    });
    
    // Initialize design preset list
    const designPresetList = document.getElementById('designPresetList');
    if (designPresetList) {
        config.designPresets.forEach(design => {
            const designElement = document.createElement('div');
            designElement.className = 'character-item';
            designElement.textContent = design;
            designElement.addEventListener('click', () => {
                document.getElementById('characterInput').value = design;
                toggleDesignPresetList();
            });
            designPresetList.appendChild(designElement);
        });
    }
}

/**
 * Toggle design preset list dropdown
 */
export function toggleDesignPresetList() {
    const designPresetList = document.getElementById('designPresetList');
    if (designPresetList) {
        designPresetList.classList.toggle('show');
    }
}

/**
 * Generate transformation suggestions based on the uploaded image
 */
export async function generateSuggestions() {
    const imageData = getCurrentImageData();
    if (!imageData) {
        alert('Please upload an image first');
        return;
    }
    
    // Show loading state
    const suggestionGrid = document.getElementById('suggestionGrid');
    const contentTypeDisplay = document.getElementById('contentTypeDisplay');
    
    suggestionGrid.innerHTML = '<div class="loading-suggestions">Analyzing image and generating suggestions...</div>';
    contentTypeDisplay.textContent = '';
    
    // Determine mode based on radio selection
    const mode = document.getElementById('characterModeRadio').checked ? 'character' : 'design';
    
    // Get suggestions
    const result = await suggestTransformationTargets(imageData, mode);
    
    // Display content type
    if (result.contentType) {
        contentTypeDisplay.textContent = `Detected content: ${result.contentType}`;
    }
    
    // Display suggestions
    displaySuggestions(result.suggestions);
}

/**
 * Display the suggestions in the grid
 */
function displaySuggestions(suggestions) {
    const suggestionGrid = document.getElementById('suggestionGrid');
    suggestionGrid.innerHTML = '';
    
    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = suggestion;
        
        item.addEventListener('click', () => {
            document.getElementById('characterInput').value = suggestion;
        });
        
        suggestionGrid.appendChild(item);
    });
}

/**
 * Get current image data from the shared state
 */
function getCurrentImageData() {
    // This assumes the currentImageData is accessible from the global scope
    // If not, you'll need to implement a shared state mechanism
    return window.currentImageData || null;
}