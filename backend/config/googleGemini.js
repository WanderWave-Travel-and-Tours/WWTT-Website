const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate blog title using Gemini Pro
 * @param {string} prompt - User's topic or keywords
 * @returns {Promise<string>} - Generated title
 */
async function generateBlogTitle(prompt) {
  try {
    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    // Craft a specific prompt for title generation
    const titlePrompt = `You are a professional blog title writer specializing in travel and tourism content. 
    
Generate ONE catchy, SEO-friendly blog title based on this topic: "${prompt}"

Requirements:
- Make it engaging and click-worthy
- 50-70 characters long
- Include relevant keywords naturally
- Use power words that attract readers
- No quotation marks in the output
- Return ONLY the title, nothing else

Examples of good titles:
- "10 Hidden Beaches in Palawan You've Never Heard Of"
- "Siargao Island: The Ultimate Surfing Paradise in 2024"
- "Filipino Food Guide: 15 Must-Try Dishes for Food Lovers"

Now generate a title for: ${prompt}`;

    const result = await model.generateContent(titlePrompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the generated text
    const cleanTitle = text
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes at start/end
      .replace(/^Title:\s*/i, '')   // Remove "Title:" prefix if present
      .replace(/\n/g, '');          // Remove newlines

    return cleanTitle;

  } catch (error) {
    console.error("❌ Gemini Title Generation Error:", error);
    throw new Error(`Failed to generate title: ${error.message}`);
  }
}

/**
 * Generate blog content using Gemini Pro
 * @param {string} prompt - User's topic or content requirements
 * @returns {Promise<string>} - Generated blog content
 */
async function generateBlogContent(title, category = "Travel Guide") {
  try {
    // Gamitin ang Flash model para mabilis pero taasan ang Output Tokens
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Make sure to use Flash
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192, // 👈 TINAASAN: Para kaya niya mag-generate ng very long article
      }
    });

    // 🎯 SMART PROMPTS BASE SA CATEGORY
    let specificInstructions = "";

    switch (category) {
      case "Travel Guide":
        specificInstructions = `
          - Structure: Introduction -> Getting There -> Where to Stay -> Top Things to Do -> 3D2N Itinerary -> Budget Estimates -> Travel Tips -> Conclusion.
          - Tone: Informative, adventurous, and helpful.
          - Must Include: Estimated prices (in PHP), transportation details, and specific hotel recommendations.
        `;
        break;
      case "Trending Stories":
        specificInstructions = `
          - Structure: Catchy Hook -> The Viral Story -> Why It's Trending -> User Reactions/Vibe -> How to Experience It -> Conclusion.
          - Tone: Exciting, storytelling-driven, emotional, and engaging (viral style).
          - Focus: Focus on the "wow" factor and human experience.
        `;
        break;
      case "Tips": // Travel Tips
        specificInstructions = `
          - Structure: Introduction -> The Problem/Context -> List of 10-15 Actionable Tips (use <h3> for each tip) -> Do's and Don'ts -> Conclusion.
          - Tone: Expert advice, cautionary, and practical.
          - Focus: Safety, saving money, packing hacks, and local etiquette.
        `;
        break;
      case "Promos": // Latest Promos
        specificInstructions = `
          - Structure: Urgency Hook (Limited Time!) -> Promo Details -> Inclusions/Exclusions -> How to Book -> Terms & Conditions Summary -> Call to Action.
          - Tone: Urgent, sales-driven, exciting.
          - Focus: Dates, prices, and savings.
        `;
        break;
      case "News & Updates":
        specificInstructions = `
          - Structure: Headline Summary -> The Update (Who, What, Where, When, Why) -> Impact on Travelers -> Official Statements -> What to Do Next.
          - Tone: Professional, journalistic, factual, and clear.
          - Focus: Accuracy and latest protocols.
        `;
        break;
      default: // Fallback
        specificInstructions = `
          - Structure: Engaging Intro -> Deep Dive Sections -> Practical Info -> Conclusion.
          - Tone: Inspiring and informative.
        `;
    }

    // 📝 THE MASTER PROMPT
    const contentPrompt = `
      You are a senior travel journalist writing a FEATURE STORY for a major magazine.
      
      **TOPIC:** "${title}"
      
      **GOAL:** Write a comprehensive, highly detailed article. 
      **TARGET LENGTH:** 1,500 to 2,000 words (Do not be brief).

      **WRITING RULES FOR MAXIMUM LENGTH:**
      1. **NO SUMMARIES:** Do not just list things. Describe them vividly.
      2. **EXPAND EVERYTHING:** If you mention a place, describe the smell, the view, the feeling, and the history.
      3. **USE STORYTELLING:** Start with an immersive narrative hook.
      4. **ADD CONTEXT:** Include historical background, local culture, and "why this matters".
      
      **REQUIRED STRUCTURE (HTML Format):**
      
      <h2>The Allure of ${title}</h2>
      <p>(Write 3 long paragraphs introducing the topic with vivid imagery)</p>

      <h2>A Deep Dive into the History & Culture</h2>
      <p>(Write 3-4 paragraphs about the backstory, history, or cultural significance)</p>

      <h2>Main Highlights & Attractions</h2>
      <p>(Discuss 5-7 specific spots/points. Use <h3> for each sub-point. Write 2 paragraphs per sub-point.)</p>

      <h2>The Full Experience: What to Expect</h2>
      <p>(Describe the atmosphere, the people, the food. Be very descriptive.)</p>

      <h2>Practical Travel Guide (Detailed)</h2>
      <ul>
        <li><strong>Getting There:</strong> (Detailed instructions for planes, ferries, buses)</li>
        <li><strong>Accommodation:</strong> (Budget, Mid-range, Luxury options with estimated prices)</li>
        <li><strong>Food & Dining:</strong> (Must-try dishes and restaurant recommendations)</li>
        <li><strong>Budget Breakdown:</strong> (Detailed cost estimates in PHP)</li>
      </ul>

      <h2>Insider Tips & Hidden Gems</h2>
      <p>(Provide 5 paragraphs of expert advice that normal tourists don't know)</p>

      <h2>Conclusion</h2>
      <p>(A meaningful wrap-up summarizing the journey)</p>

      **IMPORTANT:** - Return raw HTML only (<h2>, <h3>, <p>, <ul>, <li>).
      - Do not use markdown blocks (\`\`\`html). 
      - START WRITING NOW.
    `;

    const result = await model.generateContent(contentPrompt);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("❌ Gemini Content Generation Error:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

/**
 * Generate content with image context (multimodal)
 * @param {string} prompt - User's text prompt
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} type - "Title" or "Content"
 * @returns {Promise<string>} - Generated text
 */
async function generateWithImage(prompt, imageBase64, type) {
  try {
    // Use Gemini Pro Vision for image understanding
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Convert base64 to proper format
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const imagePart = {
      inlineData: {
        data: imageData,
        mimeType: "image/jpeg"
      }
    };

    let enhancedPrompt;
    if (type === "Title") {
      enhancedPrompt = `Based on this image, generate a catchy blog title related to: ${prompt}. 
Make it engaging and descriptive. Return ONLY the title.`;
    } else {
      enhancedPrompt = `Based on this image, write a comprehensive blog article about: ${prompt}. 
Describe what you see and create engaging content around it. Use 800-1000 words.`;
    }

    const result = await model.generateContent([enhancedPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return text.trim();

  } catch (error) {
    console.error("❌ Gemini Image Analysis Error:", error);
    throw new Error(`Failed to generate with image: ${error.message}`);
  }
}

/**
 * Generate image prompt for AI image generators
 * (Gemini doesn't generate images directly, but can create detailed prompts)
 * @param {string} description - What kind of image user wants
 * @returns {Promise<string>} - Detailed image prompt
 */
async function generateImagePrompt(description) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const promptTemplate = `You are an expert at creating detailed prompts for AI image generators like DALL-E or Stable Diffusion.

Based on this description: "${description}"

Create a detailed, specific image generation prompt that includes:
- Main subject/scene
- Art style (photorealistic, illustration, etc.)
- Lighting and atmosphere
- Color palette
- Composition details
- Quality indicators (high resolution, detailed, etc.)

Return ONLY the prompt text, no explanations.

Example:
Input: "Tropical beach sunset in Philippines"
Output: "A stunning tropical beach at sunset in the Philippines, crystal clear turquoise water gently lapping at white powdery sand, vibrant orange and pink sky reflecting on calm waters, coconut palm trees silhouetted against the colorful horizon, small traditional Filipino bangka boats in the distance, photorealistic style, warm golden hour lighting, ultra detailed, 8k quality, cinematic composition"

Now create a prompt for: ${description}`;

    const result = await model.generateContent(promptTemplate);
    const response = await result.response;
    const text = response.text();

    return text.trim();

  } catch (error) {
    console.error("❌ Gemini Image Prompt Error:", error);
    throw new Error(`Failed to generate image prompt: ${error.message}`);
  }
}

/**
 * Check if Gemini API is properly configured
 * @returns {Promise<boolean>}
 */
async function testGeminiConnection() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not found in environment variables");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    const response = await result.response;
    
    return response.text().length > 0;

  } catch (error) {
    console.error("❌ Gemini Connection Test Failed:", error);
    return false;
  }
}

module.exports = {
  generateBlogTitle,
  generateBlogContent,
  generateWithImage,
  generateImagePrompt,
  testGeminiConnection
};