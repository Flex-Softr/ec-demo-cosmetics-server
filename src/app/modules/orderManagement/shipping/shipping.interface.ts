import { Document } from "mongoose";
import { TAddressData } from "../../../types/address";

export type TShippingData = {
  fullName: string;
  phoneNumber: string;
  upazila?: string;
  district?: string;
  division?: string;
} & TAddressData;

export type TShipping = TShippingData & Document;
