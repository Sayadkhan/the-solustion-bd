import { Injectable, NotFoundException } from "@nestjs/common";
import { db, banners, desc, asc, eq, and } from "@solusation/database";

@Injectable()
export class BannersService {
  async getActiveBanners(type?: string) {
    if (type) {
      return await db.query.banners.findMany({
        where: and(eq(banners.isActive, true), eq(banners.type, type)),
        orderBy: [asc(banners.sortOrder), desc(banners.createdAt)],
      });
    }

    return await db.query.banners.findMany({
      where: eq(banners.isActive, true),
      orderBy: [asc(banners.sortOrder), desc(banners.createdAt)],
    });
  }

  async getAllBannersAdmin(type?: string) {
    if (type) {
      return await db.query.banners.findMany({
        where: eq(banners.type, type),
        orderBy: [asc(banners.sortOrder), desc(banners.createdAt)],
      });
    }

    return await db.query.banners.findMany({
      orderBy: [asc(banners.sortOrder), desc(banners.createdAt)],
    });
  }

  async getBannerById(id: string) {
    const banner = await db.query.banners.findFirst({
      where: eq(banners.id, id),
    });
    if (!banner) {
      throw new NotFoundException(`Banner with id ${id} not found.`);
    }
    return banner;
  }

  async createBanner(data: {
    type?: string;
    tag?: string;
    title: string;
    subtitle?: string;
    image: string;
    buttonText?: string;
    buttonLink?: string;
    bgGradient?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const [created] = await db
      .insert(banners)
      .values({
        type: data.type || "HERO",
        tag: data.tag || null,
        title: data.title,
        subtitle: data.subtitle || null,
        image: data.image,
        buttonText: data.buttonText || "Shop Now",
        buttonLink: data.buttonLink || "/products",
        bgGradient: data.bgGradient || "from-blue-700 via-indigo-900 to-slate-950",
        sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
      })
      .returning();

    return created;
  }

  async updateBanner(id: string, data: Partial<{
    type: string;
    tag: string;
    title: string;
    subtitle: string;
    image: string;
    buttonText: string;
    buttonLink: string;
    bgGradient: string;
    sortOrder: number;
    isActive: boolean;
  }>) {
    const existing = await this.getBannerById(id);

    const { id: _, ...updateData } = data as any;

    const [updated] = await db
      .update(banners)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(banners.id, existing.id))
      .returning();

    return updated;
  }

  async deleteBanner(id: string) {
    await this.getBannerById(id);
    await db.delete(banners).where(eq(banners.id, id));
    return { success: true, message: "Banner deleted successfully." };
  }

  async reorderBanners(orders: Array<{ id: string; sortOrder: number }>) {
    await db.transaction(async (tx) => {
      for (const item of orders) {
        await tx
          .update(banners)
          .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
          .where(eq(banners.id, item.id));
      }
    });
    return { success: true, message: "Banners reordered successfully." };
  }
}
