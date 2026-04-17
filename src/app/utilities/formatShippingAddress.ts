import { TShippingData } from "../modules/orderManagement/shipping/shipping.interface";
import BdAddress from "./bdAddress/bdAddress";

type Lang = "bn" | "en";

const detectLanguage = (text?: string): Lang => {
  if (!text) return "en";
  const banglaRegex = /[\u0980-\u09FF]/;
  return banglaRegex.test(text) ? "bn" : "en";
};

const cleanJoin = (values: (string | undefined | null)[]) => {
  return values
    .filter((v): v is string => typeof v === "string" && v.trim() !== "")
    .map((v) => v.trim())
    .join(", ");
};

const formatShippingAddress = (
  shippingData: TShippingData,
  langOverride?: Lang,
  includeDivision: boolean = false
) => {
  const lang: Lang = langOverride || detectLanguage(shippingData.fullAddress);

  const fullAddress = shippingData.fullAddress;

  const upazila = BdAddress.upazilaNameById(shippingData.upazila, lang)?.name;

  const district = BdAddress.districtNameById(
    shippingData.district,
    lang
  )?.name;

  const division = includeDivision
    ? BdAddress.divisionNameById(shippingData.division, lang)?.name
    : undefined;

  return cleanJoin([fullAddress, upazila, district, division]);
};

export default formatShippingAddress;
