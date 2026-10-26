import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Query,
  Inject,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from "@nestjs/swagger";
import { UploadService } from "./upload.service";

@ApiTags("Image Uploads")
@Controller("upload")
export class UploadController {
  constructor(@Inject(UploadService) private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: "Upload single image (Product thumbnail, Brand logo, Category icon)" })
  @ApiConsumes("multipart/form-data")
  @ApiQuery({
    name: "folder",
    required: false,
    enum: ["products", "brands", "categories", "banners", "general"],
    description: "Target subfolder for file categorization",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Image file (JPG, PNG, WEBP, AVIF, SVG, GIF up to 10MB)",
        },
      },
      required: ["file"],
    },
  })
  @Post("single")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @Query("folder") folder?: string
  ) {
    const result = await this.uploadService.saveFile(file, folder || "products");
    return {
      message: "Image uploaded successfully",
      ...result,
    };
  }

  @ApiOperation({ summary: "Upload multiple images (Product gallery - up to 10 images)" })
  @ApiConsumes("multipart/form-data")
  @ApiQuery({
    name: "folder",
    required: false,
    enum: ["products", "brands", "categories", "banners", "general"],
    description: "Target subfolder for gallery",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "List of image files (up to 10 images)",
        },
      },
      required: ["files"],
    },
  })
  @Post("multiple")
  @UseInterceptors(FilesInterceptor("files", 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Query("folder") folder?: string
  ) {
    const result = await this.uploadService.saveMultipleFiles(files, folder || "products");
    return {
      message: `Uploaded ${result.count} images successfully`,
      ...result,
    };
  }
}
