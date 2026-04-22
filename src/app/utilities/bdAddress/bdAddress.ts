import divisions from "./divisions";
import districts from "./districts";
import upazilas from "./upazilas";

type LocalizedItem = {
  id: string;
  name: string;
};

type Language = "en" | "bn";

type Localizable = {
  id: string;
  name: string;
  bn_name: string;
  [key: string]: string | number;
};

function localize<T extends Localizable>(
  items: T[],
  lang: Language
): LocalizedItem[] {
  return items.map(({ id, name, bn_name }) => ({
    id,
    name: lang === "bn" ? bn_name : name,
  }));
}

class BdAddress {
  /**
   * Get all divisions.
   */
  static divisions(lang: Language = "bn"): LocalizedItem[] {
    return localize(divisions, lang);
  }

  static divisionNameById(
    divisionId: string | undefined,
    lang: Language = "bn"
  ): LocalizedItem {
    if (!divisionId) {
      return { id: "", name: "" };
    }
    const division = divisions.find((d) => d.id === divisionId.toString());
    return division ? localize([division], lang)[0] : { id: "", name: "" };
  }

  /**
   * Get all districts.
   */
  static allDistricts(lang: Language = "bn"): LocalizedItem[] {
    return localize(districts, lang);
  }

  /**
   * Get districts by division id.
   */
  static districts(
    divisionId: string | undefined,
    lang: Language = "bn"
  ): LocalizedItem[] {
    if (!divisionId) {
      return [];
    }
    const filtered = districts.filter(
      (district) => district.division_id === divisionId.toString()
    );
    return localize(filtered, lang);
  }

  static districtNameById(
    districtId: string | undefined,
    lang: Language = "bn"
  ): LocalizedItem {
    if (!districtId) {
      return { id: "", name: "" };
    }
    const district = districts.find((d) => d.id === districtId.toString());
    return district ? localize([district], lang)[0] : { id: "", name: "" };
  }

  /**
   * Get all upazilas.
   */
  static allUpazilas(lang: Language = "bn"): LocalizedItem[] {
    return localize(upazilas, lang);
  }

  /**
   * Get upazilas by district id.
   */
  static upazilas(districtId: string, lang: Language = "bn"): LocalizedItem[] {
    if (!districtId) {
      return [];
    }
    const filtered = upazilas.filter(
      (upazila) => upazila.district_id === districtId.toString()
    );
    return localize(filtered, lang);
  }

  static upazilaNameById(
    upazilaId: string | undefined,
    lang: Language = "bn"
  ): LocalizedItem {
    if (!upazilaId) {
      return { id: "", name: "" };
    }
    const upazila = upazilas.find((d) => d.id === upazilaId.toString());
    return upazila ? localize([upazila], lang)[0] : { id: "", name: "" };
  }

  /**
   * Get zip code by upazila id.
   */
  static zipCodeByUpazilaId(upazilaId: string | undefined): string {
    if (!upazilaId) {
      return "";
    }
    const upazila = upazilas.find((d) => d.id === upazilaId.toString());
    return upazila?.zip_code || "";
  }
}

export default BdAddress;
