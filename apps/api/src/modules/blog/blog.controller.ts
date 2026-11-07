import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Inject,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { BlogService } from "./blog.service";
import { CreateBlogInputSchema, UpdateBlogInputSchema } from "@solusation/shared-types";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { parsePagination } from "../../common/utils/pagination";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthUserPayload } from "../../common/types/auth-user";

@ApiTags("Blogs & SEO Articles")
@Controller("blogs")
export class BlogController {
  constructor(@Inject(BlogService) private readonly blogService: BlogService) {}

  @ApiOperation({ summary: "Get published blog articles for frontend (with category/tag filter)" })
  @ApiQuery({ name: "category", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @Public()
  @Get()
  async getPublishedBlogs(
    @Query("category") category?: string,
    @Query("search") search?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    const { limit: l, page: p } = parsePagination(limit, page, { limit: 12, maxLimit: 100 });
    const result = await this.blogService.getPublishedBlogs({
      category,
      search,
      page: p,
      limit: l,
    });
    return { success: true, ...result };
  }

  @ApiOperation({ summary: "Get all blog posts including drafts and view stats (Admin only)" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Get("admin/all")
  async getAllForAdmin(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string
  ) {
    const { limit: l, page: p } = parsePagination(limit, page, { limit: 20 });
    const result = await this.blogService.getAllBlogsForAdmin(p, l, status);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: "Get single blog article by slug with full SEO and backlinks" })
  @Public()
  @Get(":slug")
  async getBySlug(@Param("slug") slug: string) {
    const post = await this.blogService.getBlogBySlug(slug);
    return { success: true, data: post };
  }

  @ApiOperation({ summary: "Create new SEO blog post with backlinks (Admin only)" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Post()
  async createBlog(@Body() body: unknown, @CurrentUser() user: AuthUserPayload) {
    const parsed = CreateBlogInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || "Invalid blog payload");
    }
    const created = await this.blogService.createBlog(parsed.data, user.id);
    return {
      success: true,
      message: "Blog post published successfully",
      data: created,
    };
  }

  @ApiOperation({ summary: "Update blog post, SEO metadata, or backlinks (Admin only)" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Put(":id")
  async updateBlog(@Param("id") id: string, @Body() body: any) {
    const parsed = UpdateBlogInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message || "Invalid blog update payload");
    }
    const updated = await this.blogService.updateBlog(id, parsed.data);
    return {
      success: true,
      message: "Blog post updated successfully",
      data: updated,
    };
  }

  @ApiOperation({ summary: "Delete blog post (Admin only)" })
  @Roles("ADMIN", "SEO_MANAGER")
  @Delete(":id")
  async deleteBlog(@Param("id") id: string) {
    const result = await this.blogService.deleteBlog(id);
    return result;
  }
}
