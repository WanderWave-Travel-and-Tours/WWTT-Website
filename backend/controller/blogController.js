const Blog = require('../models/blog');
const ActivityLog = require('../models/ActivityLog');
const { cloudinary } = require('../config/cloudinary');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');

const {
  generateBlogTitle,
  generateBlogContent,
  generateWithImage,
  generateImagePrompt
} = require("../config/googleGemini");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateAiImage = async (prompt) => {
    try {
        const enhancedPrompt = `${prompt}, 
professional high-quality photography, 
photorealistic, 
natural skin texture, 
sharp facial features, 
detailed eyes and face, 
proper human anatomy, 
no distortion, 
no deformities,
4k ultra HD, 
perfect lighting, 
trending on instagram,
professional travel photography style`;
        
        const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
        const negativePrompt = encodeURIComponent(
            "blurry, distorted face, deformed, ugly, bad anatomy, wrong proportions, " +
            "extra limbs, mutation, cartoon, anime, artificial, fake, low quality, " +
            "pixelated, grainy, oversaturated, bad lighting"
        );
        
        const randomSeed = Math.floor(Math.random() * 1000000);
        
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&seed=${randomSeed}&nologo=true&model=flux&negative=${negativePrompt}`;
        
        return imageUrl;

    } catch (error) {
        console.error("❌ Pollinations AI Error:", error);
        throw new Error(`AI Image generation failed: ${error.message}`);
    }
};

const downloadAndUploadToCloudinary = async (imageUrl) => {
    try {
        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: { 'User-Agent': 'WanderWave Blog System/1.0' }
        });

        const base64Image = Buffer.from(response.data).toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64Image}`;
        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'wanderwave/blog-ai-images',
            resource_type: 'image',
            transformation: [
                { width: 1920, height: 1080, crop: 'fill', quality: 'auto:good' }
            ]
        });

        console.log("✅ Uploaded to Cloudinary:", uploadResult.secure_url);

        return {
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id
        };

    } catch (error) {
        console.error("❌ Cloudinary Upload Error:", error);
        throw new Error(`Failed to upload AI image: ${error.message}`);
    }
};

const searchUnsplashImages = async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const cleanQuery = query
            .replace(/maganda|best|tourist|spot|place|puntahan|ng|sa|ang|picture|image|photo|view/gi, "")
            .trim();

        console.log(`🔍 Smart Search: "${cleanQuery}" (Page ${page})`);

        let photos = [];
        let totalResults = 0;
        let totalPages = 0;

        let searchTerms = [];
        if (page === '1') {
            searchTerms.push(`${cleanQuery} travel landscape`);
            searchTerms.push(`${cleanQuery} tourist spot`);
            searchTerms.push(`${cleanQuery} nature`);
        } else {
            searchTerms.push(`${cleanQuery}`);
        }

        for (const term of searchTerms) {
            if (photos.length >= 30) break; 

            try {
                const response = await axios.get(`https://api.unsplash.com/search/photos`, {
                    params: {
                        query: term,
                        page: page,
                        per_page: 30,
                        orientation: 'landscape',
                        client_id: process.env.UNSPLASH_ACCESS_KEY
                    }
                });

                const newPhotos = response.data.results;
                
                const existingIds = new Set(photos.map(p => p.id));
                const uniquePhotos = newPhotos.filter(p => !existingIds.has(p.id));

                photos = [...photos, ...uniquePhotos];
                totalResults = response.data.total;
                totalPages = response.data.total_pages;

                if (photos.length > 5 && page === '1') break; 
            } catch (err) {
                console.warn(`⚠️ Term failed: "${term}"`);
            }
        }

        if (photos.length === 0 && page === '1') {
             console.log("⚠️ Zero results. Fetching General Philippines Travel photos...");
             const fallbackResponse = await axios.get(`https://api.unsplash.com/search/photos`, {
                params: {
                    query: "Philippines Travel Nature",
                    page: 1,
                    per_page: 30,
                    orientation: 'landscape',
                    client_id: process.env.UNSPLASH_ACCESS_KEY
                }
            });
            photos = fallbackResponse.data.results;
        }

        const formattedPhotos = photos.map(photo => ({
            id: photo.id,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            src: {
                original: photo.urls.full,
                large2x: photo.urls.regular,   
                large: photo.urls.regular,
                medium: photo.urls.small,
                small: photo.urls.thumb,
                portrait: photo.urls.small,    
                landscape: photo.urls.regular, 
                tiny: photo.urls.thumb
            },
            width: photo.width,
            height: photo.height,
            alt: photo.alt_description || cleanQuery,
            downloadLocation: photo.links.download_location
        }));

        res.status(200).json({
            success: true,
            total: totalResults > 0 ? totalResults : 1000, 
            page: parseInt(page),
            perPage: 30,
            totalPages: totalPages > 0 ? totalPages : 100,
            photos: formattedPhotos
        });

    } catch (error) {
        console.error('❌ Unsplash Search Error:', error.message);
        res.status(500).json({ success: false, message: 'Unsplash search failed' });
    }
};

const getCuratedImages = async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const response = await axios.get(`https://api.unsplash.com/search/photos`, {
            params: {
                query: "Travel Destinations",
                page: page,
                per_page: 30,
                orientation: 'landscape', 
                client_id: process.env.UNSPLASH_ACCESS_KEY
            }
        });

        const formattedPhotos = response.data.results.map(photo => ({
            id: photo.id,
            photographer: photo.user.name,
            photographerUrl: photo.user.links.html,
            src: {
                original: photo.urls.full,
                large2x: photo.urls.regular,
                large: photo.urls.regular,
                medium: photo.urls.small,
                small: photo.urls.thumb,
                portrait: photo.urls.small,
                landscape: photo.urls.regular,
                tiny: photo.urls.thumb
            },
            width: photo.width,
            height: photo.height,
            alt: photo.alt_description || 'Travel Destination',
            downloadLocation: photo.links.download_location
        }));

        res.status(200).json({
            success: true,
            total: response.data.total,
            page: parseInt(page),
            perPage: 30,
            photos: formattedPhotos
        });

    } catch (error) {
        console.error('❌ Curated Images Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch curated images' });
    }
};

const downloadUnsplashImage = async (req, res) => {
    try {
        const { imageUrl, photographer, alt, photoId, downloadLocation } = req.body;

        if (!imageUrl) return res.status(400).json({ success: false, message: "Image URL is required" });

        if (downloadLocation) {
            try {
                await axios.get(downloadLocation, { params: { client_id: process.env.UNSPLASH_ACCESS_KEY } });
            } catch (err) { console.warn("⚠️ Tracking failed"); }
        }

        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: { 'User-Agent': 'WanderWave Blog System/1.0' }
        });

        const base64Image = Buffer.from(response.data).toString('base64');
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const dataUri = `data:${contentType};base64,${base64Image}`;

        const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: 'wanderwave/blog-covers',
            resource_type: 'image',
            transformation: [{ width: 1200, height: 630, crop: 'fill', quality: 'auto:good' }]
        });

        res.status(200).json({
            success: true,
            imageUrl: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id,
            photographer: photographer,
            alt: alt || 'Travel Image'
        });

    } catch (error) {
        console.error('❌ Download Error:', error);
        res.status(500).json({ success: false, message: 'Download failed' });
    }
};

const generateGeminiContent = async (req, res) => {
    try {
        const { prompt, type, images } = req.body;
        
        console.log(`🤖 Gemini Request: Type=${type}`);
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const imageParts = [];
        if (images && images.length > 0) {
            for (const imgBase64 of images) {
                const cleanBase64 = imgBase64.replace(/^data:image\/\w+;base64,/, '');
                imageParts.push({ inlineData: { data: cleanBase64, mimeType: "image/jpeg" } });
            }
        }
        
        const downloadAndUploadImage = async (imageUrl) => {
            try {
                const response = await axios({
                    method: 'GET',
                    url: imageUrl,
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: { 'User-Agent': 'WanderWave Blog System/1.0' }
                });

                const base64Image = Buffer.from(response.data).toString('base64');
                const dataUri = `data:image/jpeg;base64,${base64Image}`;

                const uploadResult = await cloudinary.uploader.upload(dataUri, {
                    folder: 'wanderwave/blog-ai-images',
                    resource_type: 'image',
                    transformation: [{ width: 1200, height: 630, crop: 'fill', quality: 'auto:good' }]
                });

                return { url: uploadResult.secure_url, publicId: uploadResult.public_id };
            } catch (err) {
                console.error("Upload Error:", err);
                return null;
            }
        };

        const generateAiImage = async (prompt) => {
            const enhancedPrompt = `${prompt}, professional travel photography, high quality, vibrant colors`;
            const encodedPrompt = encodeURIComponent(enhancedPrompt);
            const randomSeed = Math.floor(Math.random() * 1000000);
            return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1920&height=1080&seed=${randomSeed}&nologo=true&model=flux`;
        };

        if (type === 'FullBlog') {
            let titlePrompt = `Generate ONE catchy travel blog title for "${prompt}". No quotes.`;
            if (imageParts.length > 0) {
                titlePrompt = [`Look at these ${imageParts.length} images. Generate ONE catchy travel blog title that matches these visuals and the topic: "${prompt}". No quotes.`, ...imageParts];
            }
            const titleResult = await model.generateContent(titlePrompt);
            const blogTitle = titleResult.response.text().replace(/['"]/g, '').trim();
            await new Promise(resolve => setTimeout(resolve, 2000));
            const contentResult = await model.generateContent(`Write a 600-word HTML travel blog about "${blogTitle}". Use <h2>, <p>, <ul>.`);
            const blogContent = contentResult.response.text();
            await new Promise(resolve => setTimeout(resolve, 2000));
            const imagePrompt = await model.generateContent(`Create a detailed AI image prompt for this blog: "${blogTitle}". Describe the visual style, composition, and mood.`);
            const refinedImagePrompt = imagePrompt.response.text();
            const imageUrl = await generateAiImage(refinedImagePrompt);
            const finalImage = await downloadAndUploadImage(imageUrl);
            if (!finalImage) { return res.status(500).json({ message: "Image generation failed." }); }
            const blogData = { title: blogTitle, category: "Travel Guide", content: blogContent };
            
            return res.status(200).json({ success: true, data: { title: blogData.title, category: blogData.category, content: blogData.content, generatedImage: finalImage.url, imagePublicId: finalImage.publicId }});
        }

        if (type === 'Image') {
            let finalPrompt = prompt;
            if (imageParts.length > 0) {
                const visionPrompt = `Analyze these ${imageParts.length} images in extreme detail. Describe the common theme, style, subject, composition, lighting, and colors. The goal is to write a text prompt that an AI image generator can use to recreate a new image that fits this style. User's specific instruction: "${prompt}" Combine the visual description of the images with the user's instruction. Output ONLY the detailed prompt description.`;
                const visionResult = await model.generateContent([visionPrompt, ...imageParts]);
                finalPrompt = visionResult.response.text();
            }
            const imageUrl = await generateAiImage(finalPrompt);
            const upload = await downloadAndUploadImage(imageUrl);
            if (!upload) { return res.status(500).json({ message: "Failed to generate image." }); }
            return res.status(200).json({ generatedImage: upload.url, imagePublicId: upload.publicId });
        }

        if (type === 'Title') {
            let parts = [`Generate ONE catchy travel blog title for "${prompt}". No quotes.`];
            if (imageParts.length > 0) {
                parts = [`Look at these ${imageParts.length} images. Generate ONE catchy travel blog title that matches these visuals and the topic: "${prompt}". No quotes.`, ...imageParts];
            }
            const result = await model.generateContent(parts);
            return res.status(200).json({ generatedText: result.response.text().replace(/['"]/g, '').trim() });
        } 

        if (type === 'Content') {
            let parts = [`Write a 600-word HTML travel blog about "${prompt}". Use <h2>, <p>, <ul>.`];
            if (imageParts.length > 0) {
                parts = [`Look at these ${imageParts.length} images. Write a 600-word HTML travel blog regarding "${prompt}". Vividly describe the scenery, mood, and details seen in these images as part of the narrative. Use <h2>, <p>, <ul>.`, ...imageParts];
            }
            const result = await model.generateContent(parts);
            return res.status(200).json({ generatedText: result.response.text() });
        }

    } catch (error) {
        console.error("❌ AI Error:", error);
        res.status(500).json({ message: "AI Generation Failed", error: error.message });
    }
};

const addBlog = async (req, res) => {
    try {
        const { title, author, category, content, status, isArchive, userEmail, adminId, scheduledAt, existingImageUrl, existingImagePublicId } = req.body;
        let finalImageUrl = req.file ? req.file.path : existingImageUrl;
        let finalPublicId = req.file ? req.file.filename : existingImagePublicId;
        const newBlog = new Blog({ title, author: author || 'Admin', category, content, imageUrl: finalImageUrl, imagePublicId: finalPublicId, status: status || 'Published', scheduledAt: scheduledAt ? new Date(scheduledAt) : null, isArchive: isArchive || 'No' });
        await newBlog.save();
        res.status(201).json({ message: 'Blog created!', blog: newBlog });
    } catch (error) { res.status(500).json({ message: 'Server Error', error: error.message }); }
};

const getAllBlogs = async (req, res) => {
    try {
        await Blog.updateMany({ status: 'Scheduled', scheduledAt: { $lte: new Date() }, isArchive: 'No' }, { $set: { status: 'Published', scheduledAt: null } });
        const blogs = await Blog.find({ isArchive: 'No' }).sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: 'Not Found' });
        res.status(200).json(blog);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const deleteBlog = async (req, res) => {
    try {
        await Blog.findByIdAndUpdate(req.params.id, { isArchive: 'Yes' });
        res.status(200).json({ message: 'Archived' });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const updateBlog = async (req, res) => {
    try {
        const { title, author, category, content, status, isArchive, scheduledAt, existingImageUrl, existingImagePublicId } = req.body;
        let updateData = { title, author, category, content, status, isArchive };
        if (status === 'Scheduled') updateData.scheduledAt = new Date(scheduledAt);
        if (req.file) { updateData.imageUrl = req.file.path; updateData.imagePublicId = req.file.filename; } 
        else if (existingImageUrl) { updateData.imageUrl = existingImageUrl; updateData.imagePublicId = existingImagePublicId; }
        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json({ message: 'Updated', blog: updatedBlog });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const getArchivedBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ isArchive: 'Yes' }).sort({ updatedAt: -1 });
        res.status(200).json(blogs);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

const generateAIContent = async (req, res) => {
  try {
    const { prompt, type, image } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ success: false, message: "Please provide a prompt or image" });
    }

    if (!type || !["Title", "Content", "Image", "FullBlog"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid type." });
    }

    let generatedText;
    let generatedTitle = "";
    let generatedContent = "";

    try {
      switch (type) {
        case "Title":
           generatedText = image ? await generateWithImage(prompt, image, "Title") : await generateBlogTitle(prompt);
           break;

        case "Content":
           generatedText = image ? await generateWithImage(prompt, image, "Content") : await generateBlogContent(prompt);
           break;

        case "Image":
           console.log("🎨 Starting AI Image Generation Process...");
           
           let refinedPrompt;
           
           if (image) {
               try {
                   const visionAnalysis = await generateWithImage(
                       prompt || "Describe this person in extreme detail for AI image generation",
                       image,
                       "ImageAnalysis"
                   );
                   
                   refinedPrompt = `IMPORTANT - MAINTAIN EXACT CHARACTER CONSISTENCY:

                    ${visionAnalysis}

                    NEW SCENE/SETTING REQUEST:
                    ${prompt}

                    CRITICAL REQUIREMENTS:
                    - Keep the EXACT same person from the description above
                    - Maintain all facial features, hair, and physical characteristics PRECISELY
                    - Only change the setting/scene/environment/clothing as requested
                    - Ensure photorealistic quality with no distortions
                    - Professional photography style
                    - Natural lighting and realistic proportions
                    - Sharp focus on face and features`;
               } catch (visionError) {
                   console.warn("⚠️ Gemini Vision failed, trying fallback approach");
                   refinedPrompt = `${prompt}, professional portrait photography, photorealistic, natural features, sharp facial details, proper human anatomy, 4k quality, no distortions`;
               }
           } else {
               try {
                   refinedPrompt = await generateImagePrompt(prompt);
                   console.log("✅ Gemini Enhanced Prompt:", refinedPrompt);
               } catch (geminiError) {
                   console.warn("⚠️ Gemini prompt enhancement failed, using original prompt");
                   refinedPrompt = `${prompt}, professional travel photography, high quality, vibrant colors, 4k, sharp focus`;
               }
           }
           
           const imageUrl = await generateAiImage(refinedPrompt);
           const cloudinaryResult = await downloadAndUploadToCloudinary(imageUrl);
           
           return res.status(200).json({
             success: true,
             generatedText: refinedPrompt,
             imageUrl: cloudinaryResult.url,
             imagePublicId: cloudinaryResult.publicId,
             type: type
           });

        case "FullBlog":
           if (image) {
             generatedTitle = await generateWithImage(prompt, image, "Title");
           } else {
             generatedTitle = await generateBlogTitle(prompt);
           }
           
           generatedTitle = generatedTitle.replace(/^"|"$/g, '').trim();
           await new Promise(resolve => setTimeout(resolve, 2000));
           generatedContent = await generateBlogContent(generatedTitle);
           
           break;
      }

      if (type === "FullBlog") {
        return res.status(200).json({
          success: true,
          type: "FullBlog",
          title: generatedTitle,
          content: generatedContent,
          usage: { note: "Dual generation complete" }
        });
      } else {
        return res.status(200).json({
          success: true,
          generatedText: generatedText,
          type: type
        });
      }

    } catch (generationError) {
       console.error(generationError);
       return res.status(500).json({ success: false, message: "AI Failed", error: generationError.message });
    }
  } catch (error) {
     console.error(error);
     return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const createFromSEOAutopilot = async (req, res) => {
    try {
        const authHeader = req.headers['authorization']; 
        const secretKey = process.env.SEO_AUTOPILOT_SECRET;

        if (!authHeader || !authHeader.includes(secretKey)) {
            console.error("❌ Unauthorized access attempt to Webhook!");
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { 
            title, 
            content, 
            featured_image,
            category,
            author
        } = req.body;

        let finalImageUrl = "";
        let finalPublicId = "";

        if (featured_image) {
            const uploadResult = await downloadAndUploadToCloudinary(featured_image);
            finalImageUrl = uploadResult.url;
            finalPublicId = uploadResult.publicId;
        }

        const newBlog = new Blog({
            title: title || "New AI Blog Post",
            author: author || "WanderWave AI",
            category: category || "Travel Guide",
            content: content,
            imageUrl: finalImageUrl || "https://res.cloudinary.com/demo/image/upload/sample.jpg",
            imagePublicId: finalPublicId || "sample",
            status: "Published",
            isArchive: "No"
        });

        await newBlog.save();
        return res.status(200).json({ success: true, message: "Blog posted!" });

    } catch (error) {
        console.error("❌ Webhook Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    addBlog, getAllBlogs, getBlogById, deleteBlog, updateBlog, getArchivedBlogs,
    generateGeminiContent,
    searchUnsplashImages,
    downloadUnsplashImage,
    getCuratedImages,
    generateAIContent,
    generateAiImage, 
    createFromSEOAutopilot,
    downloadAndUploadToCloudinary  
};