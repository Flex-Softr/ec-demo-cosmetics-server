/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import axios, { AxiosError } from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import config from "../../../config/config";

const API_BASE_URL = "https://steadfast.com.bd";

// Create a cookie jar instance for session management
const cookieJar = new CookieJar();
const session = wrapper(
  axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
    },
    jar: cookieJar,
  })
);

// Function to check if logged in
async function isLoggedIn() {
  try {
    const cookies = await cookieJar.getCookies("https://steadfast.com.bd");
    return cookies.some((cookie) => cookie.key === "XSRF-TOKEN"); // Adjust as per site's session handling
  } catch (error) {
    console.error("Error when checking Steadfast login status.", error);
    return false;
  }
}

// Function to login to the site
async function login() {
  try {
    // Step 1: Get login page and CSRF token
    const response = await session.get("/login");
    const html = response.data;
    const $ = cheerio.load(html);
    const csrfToken = $('input[name="_token"]').val();

    if (!csrfToken) {
      console.error("Steadfast CSRF token not found");
      throw new Error(
        "Steadfast CSRF token not found, Error after getting login page"
      );
    }

    // Step 2: Submit login form
    const loginData = {
      _token: csrfToken,
      email: config.stead_fast.email,
      password: config.stead_fast.password,
    };

    await session.post("/login", loginData);

    console.log("1. Steadfast login successful");
  } catch (error: any) {
    throw new Error(
      `Steadfast login failed! ${error.response?.data?.message || error.message}`
    );
  }
}

// Function to check fraud status
async function steadfastFraudCheck(phoneNumber: string) {
  try {
    // Ensure logged in before making API call
    if (!(await isLoggedIn())) {
      await login();
    }

    const response = await session.get(`/user/frauds/check/${phoneNumber}`);

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const statusCode = axiosError.response?.status || 500;
      const responseData = axiosError.response?.data as any;

      let errorMessage =
        responseData?.error ||
        responseData?.message ||
        axiosError.message ||
        "Unknown error occurred when checking steadfast fraud status";

      if (typeof errorMessage === "object") {
        errorMessage = JSON.stringify(errorMessage);
      }

      if (statusCode === 429) {
        throw new Error(
          `Failed to check steadfast fraud status. ${errorMessage}`
        );
      }

      throw new Error(
        `Failed to check steadfast fraud status. ${errorMessage}`
      );
    }
    // Handle non-Axios errors
    throw new Error(`${error.message} Failed to check steadfast fraud status.`);
  }
}

export { steadfastFraudCheck };
