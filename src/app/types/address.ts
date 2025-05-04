import mongoose, { Document } from "mongoose";
import { TDistrict } from "../modules/district/district.types";
import { TDivision } from "../modules/division/division.types";
import { TUpazila } from "../modules/upazila/upazila.types";

export type TAddressData = {
  uid?: string;
  orderId?: string;
  sessionId?: string;
  fullAddress: string;
  city?: mongoose.Types.ObjectId;
  state?: mongoose.Types.ObjectId;
  country?: mongoose.Types.ObjectId;
  zip_code?: mongoose.Types.ObjectId;
  division?: string | TDivision;
  district?: string | TDistrict;
  upazila?: string | TUpazila;
};

export type TAddress = TAddressData & Document;
