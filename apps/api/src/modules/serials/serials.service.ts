import { Injectable } from "@nestjs/common";
import { db, productSerials, eq } from "@solusation/database";
import { SerialStatus } from "@solusation/shared-types";

@Injectable()
export class SerialsService {
  async lookupWarranty(serialNumber: string) {
    const cleanSerial = serialNumber.trim().toUpperCase();
    const record = await db.query.productSerials.findFirst({
      where: eq(productSerials.serialNumber, cleanSerial),
      with: {
        product: true,
        order: true,
      },
    });

    if (!record) {
      return {
        found: false,
        message: `No warranty record found for serial number: ${cleanSerial}. Please verify the sticker on the product box.`,
      };
    }

    const now = new Date();
    const isWarrantyValid =
      record.warrantyExpiresAt ? new Date(record.warrantyExpiresAt) > now : false;

    return {
      found: true,
      serialNumber: record.serialNumber,
      productId: record.productId,
      productName: record.product?.name,
      sku: record.product?.sku,
      supplierName: record.supplierName,
      status: record.status,
      warrantyDurationMonths: record.product?.warrantyDurationMonths,
      warrantyExpiresAt: record.warrantyExpiresAt,
      isWarrantyValid,
      orderId: record.orderId,
      invoiceNo: record.order?.invoiceNo,
    };
  }

  async registerSerial(data: {
    serialNumber: string;
    productId: string;
    supplierName: string;
    status?: SerialStatus;
    warrantyExpiresAt?: Date;
  }) {
    const [record] = await db
      .insert(productSerials)
      .values({
        serialNumber: data.serialNumber.trim().toUpperCase(),
        productId: data.productId,
        supplierName: data.supplierName,
        status: data.status || "IN_STOCK",
        warrantyExpiresAt: data.warrantyExpiresAt,
      })
      .returning();

    return record;
  }

  async getAllSerials(limit = 50) {
    const records = await db.query.productSerials.findMany({
      limit,
      orderBy: (productSerials, { desc }) => [desc(productSerials.createdAt)],
      with: {
        product: true,
        order: true,
      },
    });

    return records.map((r) => ({
      id: r.id,
      serialNumber: r.serialNumber,
      productName: r.product?.name,
      sku: r.product?.sku,
      supplierName: r.supplierName,
      status: r.status,
      warrantyDurationMonths: r.product?.warrantyDurationMonths || 36,
      invoiceNo: r.order?.invoiceNo,
      createdAt: r.createdAt,
    }));
  }
}

