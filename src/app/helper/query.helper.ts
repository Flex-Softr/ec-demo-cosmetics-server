import { Aggregate, FilterQuery, Model, Query } from "mongoose";

export class QueryHelper<T> {
  model: Query<T[], T>;
  query: Record<string, unknown>;

  constructor(model: Query<T[], T>, query: Record<string, unknown>) {
    this.model = model;
    this.query = query;
  }
  search(searchFields: string[]): this {
    const search = this.query?.search;
    if (search) {
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: new RegExp(search as string, "i") },
      }));
      this.model = this.model.find({ $or: searchConditions } as FilterQuery<T>);
    }
    return this;
  }
  filterByCategory(): this {
    const category = this.query?.category;
    if (category) {
      this.model = this.model.find({ category: { $in: category } });
    }
    return this;
  }
  filterByStock(): this {
    const stock = this.query?.stock;
    if (stock) {
      this.model = this.model.find({ "inventory.stockStatus": stock });
    }
    return this;
  }
  sort(): this {
    const sort = this.query?.sort;
    if (sort) {
      this.model = this.model.sort((sort as string).split(",").join(" "));
    }
    return this;
  }
  paginate(): this {
    if (this.query?.page) {
      const page = Number(this.query?.page) || 1;
      const limit = Number(this.query?.limit) || 10;
      const skip = (page - 1) * limit;
      this.model = this.model.skip(skip).limit(limit);
    }
    return this;
  }
  select(): this {
    const select = this.query?.select;
    if (select) {
      this.model = this.model.select((select as string).split(",").join(" "));
    }
    return this;
  }
  async metaData(): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  }> {
    const filter = this.model.getFilter();
    const total = await this.model.model.countDocuments(filter);
    if (this.query?.page) {
      const page = Number(this.query?.page) || 1;
      const limit = Number(this.query?.limit) || 10;
      const totalPage = Math.ceil(total / limit);
      return { page, limit, total, totalPage };
    }
    return { page: 1, limit: total, total, totalPage: 1 };
  }
}

export class AggregateQueryHelper<T> {
  model: Aggregate<T[]>;
  query: Record<string, unknown>;

  constructor(model: Aggregate<T[]>, query: Record<string, unknown>) {
    this.model = model;
    this.query = query;
  }
  search(searchFields: string[]): this {
    //ex:["phoneNumber","orderId"]
    const search = this.query?.search;
    if (search) {
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: new RegExp(search as string, "i") },
      }));
      this.model = this.model.match({
        $or: searchConditions,
      } as FilterQuery<T>);
    }
    return this;
  }
  sort(): this {
    const sort = this.query?.sort;
    if (sort) {
      this.model = this.model.sort((sort as string).split(",").join(" "));
    } else {
      this.model = this.model.sort({ createdAt: -1 });
    }
    return this;
  }
  paginate(): this {
    if (this.query?.page) {
      const page = Number(this.query?.page) || 1;
      const limit = Number(this.query?.limit) || 10;
      const skip = (page - 1) * limit;
      this.model = this.model.skip(skip).limit(limit);
    }
    return this;
  }
  metaData(total: number) {
    if (this.query?.page) {
      const page = Number(this.query?.page) || 1;
      const limit = Number(this.query?.limit) || 10;
      const totalPage = Math.ceil(total / limit);
      return { page, limit, total, totalPage };
    }
    return { page: 1, limit: total, total, totalPage: 1 };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtendedPipelineStage = any;

const convertSortStringToObject = (sortStr: string) => {
  const sortOrder = sortStr.startsWith("-") ? -1 : 1;
  const field = sortStr.startsWith("-") ? sortStr.substring(1) : sortStr;
  return { [field]: sortOrder };
};

export class AggregateQueryHelperFacet<T> {
  model: Model<T>;
  pipeline: ExtendedPipelineStage[];
  query: Record<string, unknown>;

  constructor(
    model: Model<T>,
    pipeline: ExtendedPipelineStage[],
    query: Record<string, unknown>
  ) {
    this.model = model;
    this.pipeline = pipeline;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const search = this.query?.search;
    if (search) {
      const searchConditions = searchableFields.map((field) => ({
        [field]: { $regex: new RegExp(search as string, "i") },
      }));
      // Check if the pipeline already includes a $facet stage
      const facetStageIndex = this.pipeline.findIndex(
        (stage) => stage.$facet !== undefined
      );
      if (facetStageIndex !== -1) {
        // Insert the $match stage BEFORE the $facet stage
        this.pipeline.splice(facetStageIndex, 0, {
          $match: { $or: searchConditions },
        });
      }
    }
    return this;
  }
  sort(): this {
    const sort = this.query?.sort;
    const facetStageIndex = this.pipeline.findIndex(
      (stage) => stage.$facet !== undefined
    );
    if (sort) {
      if (facetStageIndex !== -1) {
        // Push the $match stage into the existing $facet stage
        this.pipeline[facetStageIndex].$facet!.data.push({
          $sort: convertSortStringToObject(sort as string),
        });
      }
    } else {
      if (facetStageIndex !== -1) {
        this.pipeline[facetStageIndex].$facet!.data.push({
          $sort: { createdAt: -1 },
        });
      } else {
        this.pipeline.push({ $sort: { createdAt: -1 } });
      }
    }
    return this;
  }
  paginate(): this {
    if (this.query?.page) {
      const page = Number(this.query?.page) || 1;
      const limit = Number(this.query?.limit) || 10;
      const skip = (page - 1) * limit;
      const facetStageIndex = this.pipeline.findIndex(
        (stage) => stage.$facet !== undefined
      );
      if (facetStageIndex !== -1) {
        // Push the $match stage into the existing $facet stage
        this.pipeline[facetStageIndex].$facet!.data.push(
          {
            $skip: skip,
          },
          {
            $limit: limit,
          }
        );
      }
    }
    return this;
  }
  async metaData() {
    const result = await this.model.aggregate(this.pipeline);
    const { data = [], total = 0 } = result[0] || {};
    let meta;
    if (this.query?.page) {
      const page = Number(this.query?.page) || 1;
      const limit = Number(this.query?.limit) || 10;
      const totalPage = Math.ceil(total / limit);
      meta = { page, limit, total, totalPage };
    } else {
      meta = { page: 1, limit: total, total, totalPage: 1 };
    }
    return { meta, data };
  }
}
