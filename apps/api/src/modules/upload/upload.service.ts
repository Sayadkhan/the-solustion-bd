import { Injectable, BadRequestException } from "@nestjs/common";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// The extension comes from the verified type, never from the uploaded file name.
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** Checks the file's real signature, as the browser-supplied type can be anything. */
export function matchesImageSignature(mimeType: string, buffer: Buffer): boolean {
  const ascii = (start: number, end: number) => buffer.subarray(start, end).toString("latin1");
  switch (mimeType) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return ascii(0, 8) === "\x89PNG\r\n\x1a\n";
    case "image/gif":
      return ascii(0, 4) === "GIF8";
    case "image/webp":
      return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "image/avif":
      return ascii(4, 8) === "ftyp";
    case "image/svg+xml":
      return /<svg[\s>]/i.test(buffer.subarray(0, 4096).toString("utf8"));
    default:
      return false;
  }
}

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

    if (!EXTENSION_BY_MIME_TYPE[file.mimetype]) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed formats: JPG, PNG, WEBP, AVIF, SVG, GIF.`
      );
    }

    if (!matchesImageSignature(file.mimetype, file.buffer)) {
      throw new BadRequestException("This file is not a valid image of the type it claims to be.");
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

    const ext = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const baseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80);
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
