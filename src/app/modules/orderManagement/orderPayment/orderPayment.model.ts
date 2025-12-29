import { Schema, model } from "mongoose";
import { TPayment } from "./orderPayment.interface";

const PaymentSchema = new Schema<TPayment>({
  orderId: {
    type: String,
  },
  paymentMethod: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "PaymentMethod",
  },
  paymentDetails: {
    type: Map,
    of: String,
  },
});

export const OrderPayment = model<TPayment>("OrderPayment", PaymentSchema);
