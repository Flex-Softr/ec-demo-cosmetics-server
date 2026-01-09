import { z } from "zod";

const Cart = z.object({
  body: z.object({
    product: z.string({ required_error: "Product id is required" }),
    quantity: z.number({ required_error: "Quantity is required" }),
    variation: z.string().optional(),
  }),
});

const updateQuantity = z.object({
  body: z.object({
    cartItemId: z.string({ required_error: "Cart item id is required" }),
    quantity: z.number({ required_error: "Quantity is required" }).min(1),
  }),
});

const deleteCart = z.object({
  body: z.object({
    itemId: z.string({ required_error: "Item id is required" }),
  }),
});

export const CartValidation = { Cart, updateQuantity, deleteCart };
