import cloudinary from "../config/cloudinary.js";

export const uploadJobImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images uploaded" });
    }

    const uploads = req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "panikkaran/jobs" },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                resolve(result.secure_url);
              }
            }
          );

          stream.end(file.buffer);
        })
    );

    const imageUrls = await Promise.all(uploads);

    res.status(200).json({
      success: true,
      images: imageUrls,
    });
  } catch (err) {
    console.error("UPLOAD CONTROLLER FAILED ❌", err);
    res.status(500).json({ message: "Image upload failed" });
  }
};
