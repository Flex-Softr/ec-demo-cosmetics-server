import { createOrderId } from "../../modules/orderManagement/order/order.utils";

const createBLClientSid = () => {
  return `BL${createOrderId()}oneself`;
};

export default createBLClientSid;
