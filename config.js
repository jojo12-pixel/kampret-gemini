// Configuration for the Gemini Image Editor app
export const config = {
    // This API key would typically come from environment variables
    // For client-side use, consider using a proxy server to protect your API key
    apiKey: 'AIzaSyAiAXPsyu9g_nM1_r-Ba90fmEHGCDX7MP4', // Replace with your actual API key
    
    // Gemini model configurations
    model: "gemini-2.0-flash-exp-image-generation",
    thinkingModel: "gemini-2.0-flash-thinking-exp-01-21",
    
    // Image generation settings
    imageGeneration: {
        numberOfImages: 6,
        responseModalities: ["Text", "Image"],
    },
    
    // Style analysis settings
    styleAnalysis: {
        enabled: true,
        preserveColors: true,
        preserveComposition: true,
        preserveBackground: true
    },
    
    // Style transformation presets with more options
    stylePresets: [
        "Disney style", "Pixar style", "Studio Ghibli", "Anime style", "Manga style",
        "The Simpsons style", "Family Guy style", "South Park style", "Adventure Time style",
        "Rick and Morty style", "Cartoon Network style", "Claymation style", "Stop motion", 
        "3D rendered", "Photorealistic", "Hyperrealistic", "Oil painting", "Watercolor painting", 
        "Acrylic painting", "Gouache painting", "Pencil drawing", "Charcoal drawing", "Pen and ink",
        "Comic book style", "Marvel comics style", "DC comics style", "Vintage comic style",
        "Pixel art", "Voxel art", "Low poly 3D", "Isometric art", "Flat illustration",
        "Minimalist style", "Art deco style", "Art nouveau style", "Pop art style", "Cubist style",
        "Impressionist style", "Expressionist style", "Surrealist style", "Baroque style",
        "Renaissance style", "Gothic style", "Ukiyo-e style", "Chinese painting style",
        "Graffiti style", "Digital art", "Concept art", "Fantasy art", "Sci-fi art", "Retro style",
        "Neon style", "Cyberpunk style", "Steampunk style", "80s synthwave style", "Van Gogh style"
    ],
    
    // Interface settings
    ui: {
        maxImageWidth: 512,
        maxImagePreviewHeight: 300,
        animationDelay: 300, // milliseconds
    },
    
    // Preset prompts for animation
    presetPrompts: [
        "walk", "run", "jump", "dance", "grow", "shrink", "rotate", "spin", "flip", "transform",
        "dissolve", "explode", "melt", "freeze", "float", "sink", "fly", "swim", "climb", "fall",
        "bounce", "shake", "wave", "nod", "smile", "frown", "laugh", "cry", "wink", "blink",
        "open", "close", "stretch", "bend", "twist", "turn", "roll", "slide", "glide", "speed up",
        "slow down", "accelerate", "decelerate", "appear", "disappear", "fade in", "fade out", "morph", "evolve"
    ],
    
    // Preset characters/objects for transformation
    characterPresets: [
        "rabbit", "frog", "panda", "eagle", "raccoon", "owl", "cat", "dog", "tiger", "lion", 
        "elephant", "giraffe", "monkey", "fox", "wolf", "bear", "deer", "koala", "penguin", "dolphin", 
        "shark", "whale", "octopus", "turtle", "snake", "lizard", "horse", "unicorn", "dragon", "phoenix"
    ],
    
    // Design variation presets
    designPresets: [
        "kitchen", "living room", "bedroom", "bathroom", "office", 
        "restaurant", "cafe", "store", "garden", "patio",
        "modern", "rustic", "minimalist", "industrial", "bohemian",
        "scandinavian", "traditional", "contemporary", "coastal", "farmhouse"
    ]
};