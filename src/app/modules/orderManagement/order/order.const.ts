import {
  TOrderDeliveryStatus,
  TOrderSourceName,
  TOrderStatus,
  TOrderStatusWithDesc,
} from "./order.interface";

export const orderStatus: TOrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "warranty processing",
  "follow up",
  "processing done",
  "warranty added",
  "on courier",
  "canceled",
  "returned",
  "partial completed",
  "completed",
  "deleted",
];

export const orderSources: TOrderSourceName[] = [
  "Website",
  "Landing Page",
  "App",
  "Phone Call",
  "WhatsApp",
  "Social Media",
  "From Office",
  "Warranty Claimed",
  "Old Server",
];

export const orderStatusWithDesc: TOrderStatusWithDesc[] = [
  {
    status: "pending",
    description: {
      bn: "খুব শীঘ্রই আমাদের বিক্রয় প্রতিনিধি আপনার সাথে যোগাযোগ করে অর্ডারটি নিশ্চিত করবে।",
      en: "Our sales representative will contact you shortly to confirm the order.",
    },
  },
  {
    status: "confirmed",
    description: {
      bn: "আপনার অর্ডারটি নিশ্চিত করা হয়েছে এবং খুব শীঘ্রই প্রক্রিয়াকরণ করা হবে।",
      en: "Your order has been confirmed and will be processed shortly.",
    },
  },
  {
    status: "processing",
    description: {
      bn: "আপনার অর্ডার প্রক্রিয়াধীন আছে।",
      en: "Your order is being processed.",
    },
  },
  {
    status: "warranty processing",
    description: {
      bn: "আপনার পণ্যের ওয়ারেন্টি দাবির কোড গুলো অনলাইনে সংযোজন করা হচ্ছে।",
      en: "Adding your product warranty claim codes online.",
    },
  },
  {
    status: "follow up",
    description: {
      bn: "আপনার নির্ধারিত সময়ে আপনার সাথে যোগাযোগের মাধ্যমে অর্ডারটি নিশ্চিত করা হবে।",
      en: "The order will be confirmed by contacting you at your scheduled time.",
    },
  },
  {
    status: "processing done",
    description: {
      bn: "আপনার অর্ডারের প্রক্রিয়া সম্পন্ন হয়েছে এবং এটি শীঘ্রই শিপিংয়ের জন্য প্রস্তুত করা হবে।",
      en: "The processing of your order is complete, and it will be prepared for shipping soon.",
    },
  },
  {
    status: "warranty added",
    description: {
      bn: "আপনার অর্ডারে ওয়ারেন্টি সংযুক্ত করা হয়েছে।",
      en: "Warranty has been added to your order.",
    },
  },
  {
    status: "on courier",
    description: {
      bn: "আপনার অর্ডারটি কুরিয়ারের মাধ্যমে প্রেরণ করা হয়েছে এবং শীঘ্রই পৌঁছে যাবে।",
      en: "Your order has been dispatched via courier and will arrive soon.",
    },
  },
  {
    status: "canceled",
    description: {
      bn: "আপনার অর্ডারটি বাতিল করা হয়েছে।",
      en: "Your order has been canceled.",
    },
  },
  {
    status: "returned",
    description: {
      bn: "অর্ডারটি গ্রহণ না করায় ফেরত নেওয়া হয়েছে।",
      en: "The order was returned because it was not accepted.",
    },
  },
  {
    status: "partial completed",
    description: {
      bn: "আপনার অর্ডারের একটি অংশ সফলভাবে সম্পন্ন হয়েছে।",
      en: "A part of your order has been successfully completed.",
    },
  },
  {
    status: "completed",
    description: {
      bn: "আপনার অর্ডারটি সম্পূর্ণ করা হয়েছে।",
      en: "Your order has been completed.",
    },
  },
  {
    status: "deleted",
    description: {
      bn: "আপনার অর্ডারটি মুছে ফেলা হয়েছে।",
      en: "Your order has been deleted.",
    },
  },
];

export const orderDeliveryStatus: TOrderDeliveryStatus[] = [
  "pending",
  "delivered_approval_pending",
  "partial_delivered_approval_pending",
  "cancelled_approval_pending",
  "unknown_approval_pending",
  "delivered",
  "partial_delivered",
  "cancelled",
  "hold",
  "in_review",
  "unknown",
];
