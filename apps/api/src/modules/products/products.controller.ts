import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { parsePagination } from "../../common/utils/pagination";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: "Get featured products for homepage" })
  @Public()
  @Get("featured")
  async getFeatured(@Query("limit") limit?: string) {
    const { limit: l } = parsePagination(limit, undefined, { limit: 12, maxLimit: 50 });
    const products = await this.productsService.getFeaturedProducts(l);
    return { success: true, count: products.length, data: products };
  }

  @ApiOperation({ summary: "Get all product categories with Star Tech tree hierarchy" })
  @Public()
  @Get("categories")
  async getCategories() {
    const { flat, mainCategories } = await this.productsService.getCategories();
    return {
      success: true,
      count: flat.length,
      data: flat,
      mainCategories,
    };
  }

  @ApiOperation({ summary: "Create new product category" })
  @Roles("ADMIN")
  @Post("categories")
  async createCategory(@Body() body: any) {
    const cat = await this.productsService.createCategory(body);
    return { success: true, message: "Category created successfully", data: cat };
  }

  @ApiOperation({ summary: "Update category sort order (Serial number)" })
  @Roles("ADMIN")
  @Patch("categories/:id/sort-order")
  async updateCategorySortOrder(
    @Param("id") id: string,
    @Body() body: { sortOrder: number }
  ) {
    const cat = await this.productsService.updateCategorySortOrder(id, body.sortOrder);
    return { success: true, message: "Category sort order updated", data: cat };
  }

  @ApiOperation({ summary: "Reorder multiple categories serials at once" })
  @Roles("ADMIN")
  @Post("categories/reorder")
  async reorderCategories(@Body() body: { orders: Array<{ id: string; sortOrder: number }> }) {
    const updated = await this.productsService.reorderCategories(body.orders || []);
    return { success: true, message: "Categories reordered successfully", data: updated };
  }

  @ApiOperation({ summary: "Delete product category by ID" })
  @Roles("ADMIN")
  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string) {
    const cat = await this.productsService.deleteCategory(id);
    return { success: true, message: "Category deleted successfully", data: cat };
  }

  @ApiOperation({ summary: "Get all authorized brands" })
  @Public()
  @Get("brands")
  async getBrands() {
    const brandList = await this.productsService.getBrands();
    return { success: true, count: brandList.length, data: brandList };
  }

  @ApiOperation({ summary: "Create new brand" })
  @Roles("ADMIN")
  @Post("brands")
  async createBrand(@Body() body: any) {
    const brand = await this.productsService.createBrand(body);
    return { success: true, message: "Brand created successfully", data: brand };
  }

  @ApiOperation({ summary: "Delete brand by ID" })
  @Roles("ADMIN")
  @Delete("brands/:id")
  async deleteBrand(@Param("id") id: string) {
    const brand = await this.productsService.deleteBrand(id);
    return { success: true, message: "Brand deleted successfully", data: brand };
  }

  @ApiOperation({ summary: "List products with optional category and pagination" })
  @Public()
  @Get()
  async getProducts(
    @Query("category") category?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string
  ) {
    const { limit: l, page: p } = parsePagination(limit, page, { limit: 24 });
    const products = await this.productsService.getProducts(category, l, p);
    return { success: true, count: products.length, data: products };
  }

  @ApiOperation({ summary: "Quick stock update for product" })
  @Roles("ADMIN", "BRANCH_MANAGER")
  @Patch(":id/stock")
  async updateStock(
    @Param("id") id: string,
    @Body() body: { stock: number; status?: "IN_STOCK" | "OUT_OF_STOCK" | "UPCOMING" | "PRE_ORDER" }
  ) {
    const updated = await this.productsService.updateProductStock(id, body.stock, body.status);
    return { success: true, message: "Stock updated successfully", data: updated };
  }

  @ApiOperation({ summary: "Delete product" })
  @Roles("ADMIN")
  @Delete(":id")
  async deleteProduct(@Param("id") id: string) {
    const deleted = await this.productsService.deleteProduct(id);
    return { success: true, message: "Product deleted successfully", data: deleted };
  }

  @ApiOperation({ summary: "Get detailed product by slug with dual pricing & specs" })
  @Public()
  @Get(":slug")
  async getProductBySlug(@Param("slug") slug: string) {
    const product = await this.productsService.getProductBySlug(slug);
    return { success: true, data: product };
  }

  @ApiOperation({ summary: "Create new product (Admin only)" })
  @Roles("ADMIN")
  @Post()
  async createProduct(@Body() body: any) {
    const product = await this.productsService.createProduct(body);
    return { success: true, message: "Product created successfully", data: product };
  }
}

