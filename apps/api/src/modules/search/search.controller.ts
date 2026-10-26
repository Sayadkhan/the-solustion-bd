import { Controller, Get, Post, Query, UseGuards, Inject } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SearchService } from "./search.service";
import { ProductSearchQuerySchema } from "@solusation/shared-types";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@ApiTags("Search")
@Controller("search")
export class SearchController {
  constructor(@Inject(SearchService) private readonly searchService: SearchService) {}

  @ApiOperation({ summary: "Instant multi-faceted product search (sub-15ms)" })
  @Get()
  async searchRoot(@Query() query: any) {
    const parsed = ProductSearchQuerySchema.parse(query);
    const result = await this.searchService.search(parsed);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: "Search products alias route" })
  @Get("products")
  async searchProducts(@Query() query: any) {
    const parsed = ProductSearchQuerySchema.parse(query);
    const result = await this.searchService.search(parsed);
    return { success: true, ...result };
  }

  @ApiOperation({ summary: "Reindex all products into Typesense (Admin only)" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN")
  @Post("reindex")
  async reindex() {
    const result = await this.searchService.syncAllProducts();
    return {
      success: true,
      message: `Indexed ${result.count} products into Typesense`,
      count: result.count,
    };
  }
}
