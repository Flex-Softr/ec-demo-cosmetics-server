/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import config from "../../../config/config";

const API_BASE_URL = "https://merchant.pathao.com";

const cookieJar = new CookieJar();
const session = wrapper(
  axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    jar: cookieJar,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  })
);

// ✅ Check if logged in (based on cookies)
async function isLoggedIn(): Promise<boolean> {
  try {
    const auth = session.defaults.headers.common["Authorization"];
    return !!auth;
  } catch (error) {
    return false;
  }
}

// ✅ Login with password and store token
async function login() {
  try {
    const response = await session.post("/api/v1/login", {
      username: config.pathao.username,
      password: config.pathao.password,
    });
    const accessToken = response.data.access_token;
    session.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    console.log("2. Pathao login successful.");
  } catch (error: any) {
    throw new Error(
      `Pathao login failed! ${error.response?.data?.message || error.message}`
    );
  }
}

const pathaoFraudCheck = async (phone: string) => {
  try {
    if (!(await isLoggedIn())) {
      await login();
    }

    const response = await session.post(
      "/api/v1/user/success",
      { phone },
      {
        headers: {
          Referer: "https://merchant.pathao.com/fraud-check",
          Origin: "https://merchant.pathao.com",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status || 500; // Default to 500 if no response
      const errorMessage =
        axiosError.response?.data ||
        axiosError.message ||
        "Unknown error occurred while checking Pathao fraud status.";
      // Handle rate limit errors (429 Too Many Requests)
      if (statusCode === 429 && typeof errorMessage === "string") {
        throw new Error(
          "Too many requests in the Pathao! Please try again after sometime for Pathao data."
        );
      }
      // Handle other Axios errors with status
      throw new Error(`Failed to check Pathao fraud status. ${errorMessage}`);
    }

    // Handle non-Axios errors
    throw new Error(`${error.message} Failed to check Pathao fraud status.`);
  }
};

export { pathaoFraudCheck };
