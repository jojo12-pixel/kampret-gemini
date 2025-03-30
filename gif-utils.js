// GIF utility functions for handling GIF creation and previewing
export function setupGifWorkspace(generatedImages) {
    if (generatedImages.length < 2) {
        alert('Please generate at least 2 images first');
        return;
    }

    // Create GIF workspace
    const gifWorkspace = document.createElement('div');
    gifWorkspace.className = 'gif-workspace';
    gifWorkspace.innerHTML = `
        <div class="gif-container">
            <div class="gif-header">
                <h2>Create Animation GIF</h2>
                <button id="closeGifWorkspace" class="close-btn">×</button>
            </div>
            
            <div class="images-container" id="imagesContainer"></div>
            
            <div class="controls">
                <div class="control-group">
                    <label for="delayRange">Frame Delay (ms):</label>
                    <input type="range" id="delayRange" min="100" max="1000" step="50" value="300">
                    <span id="delayValue">300ms</span>
                </div>
                
                <div class="control-group">
                    <label for="loopCount">Loop Count:</label>
                    <input type="number" id="loopCount" min="0" max="100" value="0">
                    <span>(0 = infinite)</span>
                </div>
                
                <button id="previewGifBtn">Preview GIF</button>
                <button id="downloadGifBtn">Download GIF</button>
            </div>
            
            <div class="preview" id="previewContainer">
                <h2>Preview</h2>
                <div id="gifPreview"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(gifWorkspace);
    
    const imagesContainer = document.getElementById('imagesContainer');
    const delayRange = document.getElementById('delayRange');
    const delayValue = document.getElementById('delayValue');
    const loopCount = document.getElementById('loopCount');
    const previewGifBtn = document.getElementById('previewGifBtn');
    const downloadGifBtn = document.getElementById('downloadGifBtn');
    const closeGifWorkspaceBtn = document.getElementById('closeGifWorkspace');
    
    let loadedImages = [];
    
    // Update delay value display
    delayRange.addEventListener('input', () => {
        delayValue.textContent = delayRange.value + 'ms';
    });
    
    // Close GIF workspace
    closeGifWorkspaceBtn.addEventListener('click', () => {
        document.body.removeChild(gifWorkspace);
    });
    
    // Load images
    generatedImages.forEach((imageData, index) => {
        const frame = document.createElement('div');
        frame.className = 'frame';
        
        const img = document.createElement('img');
        img.src = imageData.dataUrl;
        img.onload = () => {
            loadedImages[index] = img;
        };
        
        frame.appendChild(img);
        imagesContainer.appendChild(frame);
    });
    
    // Create and preview GIF
    previewGifBtn.addEventListener('click', () => createGif(loadedImages, delayRange.value, loopCount.value, false));
    downloadGifBtn.addEventListener('click', () => createGif(loadedImages, delayRange.value, loopCount.value, true));
}

// Create and handle GIF with preview or download
function createGif(loadedImages, delay, loops, download) {
    if (loadedImages.length < 2) {
        alert('Please wait for images to load');
        return;
    }
    
    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 512,
        height: 512,
        workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
        repeat: parseInt(loops)
    });
    
    loadedImages.forEach(img => {
        gif.addFrame(img, {delay: parseInt(delay)});
    });
    
    gif.on('finished', blob => {
        const url = URL.createObjectURL(blob);
        
        if (download) {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'animation.gif';
            a.click();
        } else {
            const previewContainer = document.getElementById('gifPreview');
            previewContainer.innerHTML = '<img src="' + url + '" alt="Animated GIF">';
        }
    });
    
    gif.render();
}