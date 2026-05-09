import cloudinary from "../lib/cloudinary.js";
import { ApiError } from "./ApiError.js";
import { Jimp } from "jimp";

/**
 * Upload single base64 image to Cloudinary with automatic compression
 */
export const uploadToCloudinary = async (base64Image, folder = "products") => {
  try {
    let finalImage = base64Image;

    // Apply compression if it's a base64 string
    try {
      let buffer;
      if (base64Image.includes("base64,")) {
        buffer = Buffer.from(base64Image.split("base64,")[1], "base64");
      } else {
        buffer = Buffer.from(base64Image, "base64");
      }

      const image = await Jimp.read(buffer);
      
      // Resize if width > 1600px to save space
      if (image.width > 1600) {
        image.resize({ w: 1600 });
      }

      const compressedBuffer = await image.getBuffer("image/jpeg", { quality: 80 });
      finalImage = `data:image/jpeg;base64,${compressedBuffer.toString("base64")}`;
      
      console.log(`[Cloudinary] Compressed image from ${Math.round(buffer.length / 1024)}KB to ${Math.round(compressedBuffer.length / 1024)}KB`);
    } catch (compressError) {
      console.warn("[Cloudinary] Compression failed, trying original image:", compressError.message);
      // Fallback to original image if compression fails
    }

    const result = await cloudinary.uploader.upload(finalImage, {
      folder: folder,
      resource_type: "auto",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error Details:", {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    });
    throw new ApiError(500, `Cloudinary Upload Failed: ${error.message}`);
  }
};

/**
 * Upload multiple base64 images to Cloudinary
 */
export const uploadMultipleToCloudinary = async (
  base64Images,
  folder = "products"
) => {
  try {
    const uploadPromises = base64Images.map((image) =>
      uploadToCloudinary(image, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
};

/**
 * Check if URL is a valid Cloudinary URL
 */
const isValidCloudinaryUrl = (url) => {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Check if it's a Cloudinary URL
  return url.includes("cloudinary.com") && url.includes("/upload/");
};

/**
 * Delete image from Cloudinary
 */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Validate URL before attempting deletion
    if (!isValidCloudinaryUrl(imageUrl)) {
      console.warn(`Skipping invalid Cloudinary URL: ${imageUrl}`);
      return { result: "skipped", reason: "invalid_url" };
    }

    const urlParts = imageUrl.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) {
      console.warn(`No 'upload' segment found in URL: ${imageUrl}`);
      return { result: "skipped", reason: "invalid_format" };
    }

    // Get everything after 'upload/v123456789/'
    const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/");
    const publicId = publicIdWithExtension.substring(
      0,
      publicIdWithExtension.lastIndexOf(".")
    );

    if (!publicId) {
      console.warn(`Could not extract public_id from URL: ${imageUrl}`);
      return { result: "skipped", reason: "no_public_id" };
    }

    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image with public_id: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error(
      `Error deleting image from Cloudinary (${imageUrl}):`,
      error.message
    );
    // Don't throw - just log and continue
    return { result: "error", error: error.message };
  }
};

/**
 * Delete multiple images from Cloudinary
 */
export const deleteMultipleFromCloudinary = async (imageUrls) => {
  try {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.log("No images to delete");
      return [];
    }

    // Filter out invalid URLs before attempting deletion
    const validUrls = imageUrls.filter((url) => isValidCloudinaryUrl(url));

    if (validUrls.length === 0) {
      console.warn("No valid Cloudinary URLs found to delete");
      return [];
    }

    console.log(
      `Deleting ${validUrls.length} valid images out of ${imageUrls.length} total`
    );

    // Use Promise.allSettled to handle individual failures gracefully
    const deletePromises = validUrls.map((url) => deleteFromCloudinary(url));
    const results = await Promise.allSettled(deletePromises);

    // Log results
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `Image deletion complete: ${successful} succeeded, ${failed} failed`
    );

    return results;
  } catch (error) {
    console.error("Error in deleteMultipleFromCloudinary:", error);
    // Don't throw - we still want product deletion to succeed
    return [];
  }
};
