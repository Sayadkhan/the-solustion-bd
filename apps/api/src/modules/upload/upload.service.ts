import { Injectable, BadRequestException } from "@nestjs/common";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/gif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class UploadService {
  private readonly uploadRootDir = path.join(process.cwd(), "uploads");

  constructor() {
    this.ensureDirectoryExists(this.uploadRootDir);
    this.ensureDirectoryExists(path.join(this.uploadRootDir, "products"));
    this.ensureDirectoryExists(path.join(this.uploadRootDir, "brands"));
    this.ensureDirectoryExists(path.join(this.uploadRootDir, "categories"));
    this.ensureDirectoryExists(path.join(this.uploadRootDir, "banners"));
    this.ensureDirectoryExists(path.join(this.uploadRootDir, "general"));
  }

  private ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  validateFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No image file provided.");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed formats: JPG, PNG, WEBP, AVIF, SVG, GIF.`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum limit of 10MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
      );
    }
  }

  async saveFile(file: Express.Multer.File, folder = "products") {
    this.validateFile(file);

    const safeFolder = ["products", "brands", "categories", "banners", "general"].includes(folder)
      ? folder
      : "general";

    const targetDir = path.join(this.uploadRootDir, safeFolder);
    this.ensureDirectoryExists(targetDir);

    const ext = path.extname(file.originalname).toLowerCase() || ".webp";
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const filename = `${baseName}-${uniqueSuffix}${ext}`;
    const targetPath = path.join(targetDir, filename);

    // Save to disk
    await fs.promises.writeFile(targetPath, file.buffer);

    const relativeUrl = `/uploads/${safeFolder}/${filename}`;

    return {
      success: true,
      url: relativeUrl,
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      folder: safeFolder,
    };
  }

  async saveMultipleFiles(files: Express.Multer.File[], folder = "products") {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one image file must be uploaded.");
    }

    const results = await Promise.all(
      files.map((file) => this.saveFile(file, folder))
    );

    return {
      success: true,
      count: results.length,
      files: results,
      urls: results.map((r) => r.url),
    };
  }
}
