import { TCourierCredentials } from "../modules/courier/courier.interface";

const steedFastApi = async (config: {
  credentials: TCourierCredentials[];
  endpoints: string;
  payload?: Record<string, string>[];
  method: "GET" | "POST";
}) => {
  const { credentials, endpoints, payload, method } = config;
  const url = `https://portal.packzy.com/api/v1${endpoints}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(credentials || []),
  };
  const reqConfig: Record<string, unknown> = { method, headers };
  if (payload) {
    reqConfig.body = JSON.stringify(payload);
  }
  try {
    const res = await fetch(url, reqConfig);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(
        `Request failed: ${res.status} ${res.statusText} - ${errorText}`
      );
    }
    return await res.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`SteedFast API error: ${error.message}`);
    }
    throw new Error("Unknown error occurred in SteedFast API");
  }
};

export default steedFastApi;
