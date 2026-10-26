import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Products")
@Controller("products")
export class ProductsController {
  constructor(@Inject(ProductsService) private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: "Get featured products for homepage" })
  @Get("featured")
  async getFeatured(@Query("limit") limit?: string) {
    const l = limit ? parseInt(limit, 10) : 12;
    const products = await this.productsService.getFeaturedProducts(l);
    return { success: true, count: products.length, data: products };
  }

  @ApiOperation({ summary: "Get all product categories with Star Tech tree hierarchy" })
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
  @Post("categories")
  async createCategory(@Body() body: any) {
    const cat = await this.productsService.createCategory(body);
    return { success: true, message: "Category created successfully", data: cat };
  }

  @ApiOperation({ summary: "Update category sort order (Serial number)" })
  @Patch("categories/:id/sort-order")
  async updateCategorySortOrder(
    @Param("id") id: string,
    @Body() body: { sortOrder: number }
  ) {
    const cat = await this.productsService.updateCategorySortOrder(id, body.sortOrder);
    return { success: true, message: "Category sort order updated", data: cat };
  }

  @ApiOperation({ summary: "Reorder multiple categories serials at once" })
  @Post("categories/reorder")
  async reorderCategories(@Body() body: { orders: Array<{ id: string; sortOrder: number }> }) {
    const updated = await this.productsService.reorderCategories(body.orders || []);
    return { success: true, message: "Categories reordered successfully", data: updated };
  }

  @ApiOperation({ summary: "Delete product category by ID" })
  @Delete("categories/:id")
  async deleteCategory(@Param("id") id: string) {
    const cat = await this.productsService.deleteCategory(id);
    return { success: true, message: "Category deleted successfully", data: cat };
  }

  @ApiOperation({ summary: "Get all authorized brands" })
  @Get("brands")
  async getBrands() {
    const brandList = await this.productsService.getBrands();
    return { success: true, count: brandList.length, data: brandList };
  }

  @ApiOperation({ summary: "Create new brand" })
  @Post("brands")
  async createBrand(@Body() body: any) {
    const brand = await this.productsService.createBrand(body);
    return { success: true, message: "Brand created successfully", data: brand };
  }

  @ApiOperation({ summary: "Delete brand by ID" })
  @Delete("brands/:id")
  async deleteBrand(@Param("id") id: string) {
    const brand = await this.productsService.deleteBrand(id);
    return { success: true, message: "Brand deleted successfully", data: brand };
  }

  @ApiOperation({ summary: "List products with optional category and pagination" })
  @Get()
  async getProducts(
    @Query("category") category?: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string
  ) {
    const l = limit ? parseInt(limit, 10) : 24;
    const p = page ? parseInt(page, 10) : 1;
    const products = await this.productsService.getProducts(category, l, p);
    return { success: true, count: products.length, data: products };
  }

  @ApiOperation({ summary: "Quick stock update for product" })
  @Patch(":id/stock")
  async updateStock(
    @Param("id") id: string,
    @Body() body: { stock: number; status?: "IN_STOCK" | "OUT_OF_STOCK" | "UPCOMING" | "PRE_ORDER" }
  ) {
    const updated = await this.productsService.updateProductStock(id, body.stock, body.status);
    return { success: true, message: "Stock updated successfully", data: updated };
  }

  @ApiOperation({ summary: "Delete product" })
  @Delete(":id")
  async deleteProduct(@Param("id") id: string) {
    const deleted = await this.productsService.deleteProduct(id);
    return { success: true, message: "Product deleted successfully", data: deleted };
  }

  @ApiOperation({ summary: "Get detailed product by slug with dual pricing & specs" })
  @Get(":slug")
  async getProductBySlug(@Param("slug") slug: string) {
    const product = await this.productsService.getProductBySlug(slug);
    return { success: true, data: product };
  }

  @ApiOperation({ summary: "Create new product (Admin only)" })
  @Post()
  async createProduct(@Body() body: any) {
    const product = await this.productsService.createProduct(body);
    return { success: true, message: "Product created successfully", data: product };
  }
}

