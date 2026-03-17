import { TShippingMethodCredential } from "../modules/courier/courier.interface";

const steedFastApi = async (config: {
  credentials: TShippingMethodCredential[];
  endpoints: string;
  payload?: Record<string, string>[];
  method: "GET" | "POST";
}) => {
  const { credentials, endpoints, payload, method } = config;
  const url = `https://portal.packzy.com/api/v1${endpoints}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(credentials.map((c) => [c.key, c.value])),
  };
  const reqConfig: Record<string, unknown> = { method, headers };
  if (payload) {
    reqConfig.body = JSON.stringify(payload);
  }
  try {
    const res = await fetch(url, reqConfig);
    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(
        `Request failed: ${res.status} ${res.statusText} - ${responseData?.message || "Unknown error"}`
      );
    }
    return responseData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`SteedFast API error: ${error.message}`);
    }
    throw new Error("Unknown error occurred in SteedFast API");
  }
};

export default steedFastApi;
