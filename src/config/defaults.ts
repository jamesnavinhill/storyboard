
export const DEFAULT_WORKFLOWS = [
    {
        name: "Music Video",
        category: "music-video" as const,
        systemInstruction:
            "You are a creative director for artistic, abstract music videos. Based on the user's prompt, generate a list of distinct, evocative scenes. The scenes should be concise, visually descriptive, and align with an artsy, abstract, futuristic, and techy vibe.",
        artStyle:
            "Style: artsy, washed out aesthetic, warm muted colors, abstract, dreamy, ethereal, futuristic, technological, emotive, cinematic lighting, high detail, 4k.",
        description: "Create artistic and abstract music videos with a futuristic vibe.",
        thumbnail: "/thumbnails/music-video.jpg", // Placeholder
    },
    {
        name: "Product Commercial",
        category: "commercial" as const,
        systemInstruction:
            "You are a director for high-end product commercials. Based on the user's prompt, generate scenes that are clean, modern, and visually appealing. Focus on highlighting the product's features and benefits in a sophisticated way.",
        artStyle:
            "Style: clean, modern, minimalist, bright studio lighting, sharp focus, high-end commercial photography, professional, polished, vibrant but controlled color palette, 4k.",
        description: "Generate high-end, clean product commercial storyboards.",
        thumbnail: "/thumbnails/commercial.jpg", // Placeholder
    },
    {
        name: "Viral Social Video",
        category: "social" as const,
        systemInstruction:
            "You are a content creator specializing in viral social media videos. Based on the user's prompt, generate scenes for a fast-paced, engaging, and trendy video (like for TikTok or Reels). Think quick cuts, bold visuals, and eye-catching moments.",
        artStyle:
            "Style: vibrant, high-energy, trendy, bold colors, dynamic angles, authentic, shot on a high-end smartphone aesthetic, engaging, direct-to-camera feel, 4k.",
        description: "Fast-paced, high-energy content for TikTok/Reels/Shorts.",
        thumbnail: "/thumbnails/social.jpg", // Placeholder
    },
    {
        name: "Explainer Video",
        category: "explainer" as const,
        systemInstruction:
            "You are a creative lead for animated explainer videos. Based on the user's prompt, generate scenes that are clear, simple, and informative. Use concepts that can be easily translated to 2D animation with iconography and simplified characters.",
        artStyle:
            "Style: 2D flat animation, simple iconography, friendly characters, bright and approachable color palette, clean lines, minimalist, corporate-friendly, informative graphic style, 4k.",
        description: "Clear and informative 2D animated explainer concepts.",
        thumbnail: "/thumbnails/explainer.jpg", // Placeholder
    },
];

export const DEFAULT_TEMPLATES = [
    {
        name: "Cinematic Realistic",
        description: "High-end movie production look with dramatic lighting.",
        stylePrompt: "Style: cinematic, photorealistic, 8k, dramatic lighting, depth of field, high budget production value, anamorphic lens flares, color graded.",
        category: ["Cinematic", "Realistic"],
        tested: true,
    },
    {
        name: "Cyberpunk Anime",
        description: "Futuristic anime style with neon lights and tech elements.",
        stylePrompt: "Style: anime, cyberpunk, neon lights, high contrast, cel shaded, detailed backgrounds, futuristic cityscapes, vibrant colors, Studio Trigger style.",
        category: ["Anime", "Sci-Fi"],
        tested: true,
    },
    {
        name: "Vintage Film",
        description: "Retro analog film look with grain and light leaks.",
        stylePrompt: "Style: vintage 35mm film, grainy, light leaks, muted colors, nostalgia, analog photography, kodak portra 400, soft focus, retro aesthetic.",
        category: ["Photography", "Vintage"],
        tested: true,
    },
    {
        name: "3D Render",
        description: "Clean and modern 3D illustration style.",
        stylePrompt: "Style: 3D render, blender cycles, octane render, clay material, soft lighting, pastel colors, clean, minimal, cute, isometric.",
        category: ["3D", "Clean"],
        tested: true,
    },
];
