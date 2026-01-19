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
 * @param {string} type - "Title", "Content", or "ImageAnalysis"
 * @returns {Promise<string>} - Generated text
 */
async function generateWithImage(prompt, imageBase64, type) {
  try {
    // 1. FIXED: Changed 'gemini-pro-vision' (deprecated) to 'gemini-1.5-flash'
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    } 
    else if (type === "Content") {
      enhancedPrompt = `Based on this image, write a comprehensive blog article about: ${prompt}. 
Describe what you see and create engaging content around it. Use 800-1000 words.`;
    }
    else if (type === "ImageAnalysis") {
      // 🎯 ENHANCED: Ultra-detailed character analysis for maximum consistency
      enhancedPrompt = `You are an expert AI image prompt writer analyzing a reference photo for character consistency across multiple AI-generated images.

Analyze this image and create an EXTREMELY DETAILED character description that an AI image generator can use to recreate this EXACT person in different scenes.

CRITICAL INSTRUCTIONS:
1. Focus on PERMANENT features (not clothing or accessories unless specifically needed)
2. Be VERY specific about facial features
3. Use photographic/artistic terminology
4. Write in a continuous paragraph format (no bullet points)

REQUIRED DETAILS:

FACIAL STRUCTURE & FEATURES:
- Ethnicity and skin tone (be specific: warm beige, fair, tan, etc.)
- Face shape (oval, round, heart-shaped, square)
- Facial proportions and symmetry
- Bone structure (high cheekbones, defined jawline, etc.)

EYES:
- Eye color (dark brown, hazel, etc.)
- Eye shape (almond-shaped, round, hooded, etc.)
- Eyebrow shape, thickness, and color
- Eye spacing and size
- Eyelash appearance

NOSE:
- Nose shape (button nose, straight, curved)
- Bridge width and height
- Nostril shape and size

MOUTH & SMILE:
- Lip shape and fullness
- Smile characteristics (wide, gentle, etc.)
- Teeth visibility
- Lip color

HAIR:
- Exact hair color (e.g., "deep chocolate brown with subtle warm undertones")
- Hair length (e.g., "waist-length, hip-length")
- Hair texture (straight, wavy, curly - be specific)
- Hair thickness and volume
- How hair naturally falls or parts

OVERALL APPEARANCE:
- Age range (early 20s, mid-20s, late 20s)
- Body type and build
- Height impression (petite, average, tall)
- Overall aesthetic and vibe

PHOTOGRAPHY STYLE:
- Type of photography (portrait, lifestyle, editorial)
- Lighting quality (soft natural, studio, golden hour)
- Expression and mood
- Pose and body language

FORMAT YOUR RESPONSE AS:
Write everything as ONE flowing descriptive paragraph that reads like a detailed prompt for an AI image generator. Start with: "A [ethnicity] woman in her [age range]..." and continue with all the detailed features in natural language. Make it read like a professional AI image generation prompt.

EXAMPLE OUTPUT STYLE:
"A Filipino woman in her mid-twenties with warm beige skin tone and an oval face shape, featuring large almond-shaped dark brown eyes with long natural lashes, well-defined eyebrows, a straight refined nose, and full lips with a warm natural smile. Her most distinctive feature is her long straight dark brown hair with subtle natural highlights that falls past her shoulders in a sleek, healthy-looking style. She has high cheekbones and a gentle jawline, creating a harmonious facial structure. Her expression is warm and approachable with a genuine smile. Photography style is professional lifestyle photography with soft natural lighting that enhances her features without harsh shadows."

Now analyze the provided image and create a similar detailed description:`;
    }
    else {
      enhancedPrompt = `Analyze this image and provide details about: ${prompt}`;
    }

    const result = await model.generateContent([enhancedPrompt, imagePart]);
    const response = await result.response;
    return response.text().trim();

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
    // Susubukan natin tawagin si Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptTemplate = `Create a detailed AI image generation prompt for: "${description}".
    Return ONLY the prompt text.`;

    const result = await model.generateContent(promptTemplate);
    const response = await result.response;
    return response.text().trim();

  } catch (error) {
    // ⚠️ DITO ANG FIX: Pag nag-error si Gemini (404), hindi tayo titigil.
    // Gagawa tayo ng manual fallback para tuloy pa rin ang Pollinations.
    console.warn("⚠️ Gemini Image Prompt failed, using fallback:", error.message);
    
    // Ibalik ang original description + magic words
    return `${description}, photorealistic, 8k, travel photography, highly detailed, cinematic lighting, no blur`;
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