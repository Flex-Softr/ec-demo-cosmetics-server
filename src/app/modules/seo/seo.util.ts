/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession } from "mongoose";
import SeoModel from "./seo.model";

type Opts = { session?: ClientSession } | undefined;

export const createOrAttachSeo = async (payload: any, opts?: Opts) => {
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, "seo")) return;
  const val = payload.seo;
  if (val && typeof val === "object" && Object.keys(val).length > 0) {
    const [seoDoc] = await SeoModel.create([val], opts);
    payload.seo = seoDoc._id;
  } else {
    delete payload.seo;
  }
};

export const updateOrAttachSeo = async (
  existing: any,
  payload: any,
  opts?: Opts
) => {
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, "seo")) return;
  const val = payload.seo;
  if (val && typeof val === "object" && Object.keys(val).length > 0) {
    if (existing && existing.seo) {
      await SeoModel.findByIdAndUpdate(existing.seo, { $set: val }, opts);
      // remove seo from payload because we updated existing doc
      delete payload.seo;
    } else {
      const [seoDoc] = await SeoModel.create([val], opts);
      payload.seo = seoDoc._id;
    }
  } else {
    delete payload.seo;
  }
};
