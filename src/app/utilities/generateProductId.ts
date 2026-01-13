import ProductModel from "../modules/productManagement/product/product.model";

export const findLastProductId = async () => {
  const lastProduct = await ProductModel.findOne()
    .sort({
      createdAt: -1,
    })
    .lean();
  return lastProduct?.id ? lastProduct.id.substring(2) : undefined;
};

export const generateProductId = async () => {
  const lastProductId = await findLastProductId();
  let currentId = (0).toString();
  if (lastProductId) {
    currentId = lastProductId;
  }
  let incrementId = (Number(currentId) + 1).toString().padStart(4, "0");
  incrementId = `P-${incrementId}`;
  return incrementId;
};

export default generateProductId;
