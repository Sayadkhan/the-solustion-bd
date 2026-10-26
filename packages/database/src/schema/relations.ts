import { relations } from "drizzle-orm";
import {
  categories,
  brands,
  products,
  branchInventory,
  orders,
  orderItems,
  productSerials,
  savedPcBuilds,
  users,
  sessions,
} from "./tables";

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_tree",
  }),
  children: many(categories, { relationName: "category_tree" }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  branchInventory: many(branchInventory),
  serials: many(productSerials),
  orderItems: many(orderItems),
}));

export const branchInventoryRelations = relations(branchInventory, ({ one }) => ({
  product: one(products, {
    fields: [branchInventory.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
  serials: many(productSerials),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productSerialsRelations = relations(productSerials, ({ one }) => ({
  product: one(products, {
    fields: [productSerials.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [productSerials.orderId],
    references: [orders.id],
  }),
}));

export const savedPcBuildsRelations = relations(savedPcBuilds, ({ one }) => ({
  user: one(users, {
    fields: [savedPcBuilds.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  savedPcBuilds: many(savedPcBuilds),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
