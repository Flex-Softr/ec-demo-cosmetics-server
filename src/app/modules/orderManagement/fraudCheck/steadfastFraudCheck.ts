/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import axios, { AxiosError } from "axios";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import https from "https";
import config from "../../../config/config";

const API_BASE_URL = "https://steadfast.com.bd";

// Create a custom HTTPS agent to mimic browser TLS fingerprint
const httpsAgent = new https.Agent({
  ciphers: [
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1300_SHA256",
    "TLS_AES_128_GCM_SHA256",
    "ECDHE-ECDSA-AES128-GCM-SHA256",
    "ECDHE-RSA-AES128-GCM-SHA256",
    "ECDHE-ECDSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES256-GCM-SHA384",
    "ECDHE-ECDSA-CHACHA20-POLY1300",
    "ECDHE-RSA-CHACHA20-POLY1300",
    "ECDHE-RSA-AES128-SHA",
    "ECDHE-RSA-AES256-SHA",
    "AES128-GCM-SHA256",
    "AES256-GCM-SHA384",
    "AES128-SHA",
    "AES256-SHA",
  ].join(":"),
  honorCipherOrder: true,
  minVersion: "TLSv1.2",
});

// Create a cookie jar instance for session management
const cookieJar = new CookieJar();
const session = wrapper(
  axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    httpsAgent,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Sec-Ch-Ua":
        '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      "Cache-Control": "max-age=0",
    },
    jar: cookieJar,
    maxRedirects: 5,
    timeout: 30000,
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

    // Add a small delay to mimic human behavior
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000)
    );

    await session.post("/login", loginData, {
      headers: {
        Origin: "https://steadfast.com.bd",
        Referer: "https://steadfast.com.bd/login",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
      },
    });
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

    const response = await session.get(`/user/frauds/check/${phoneNumber}`, {
      headers: {
        Referer: "https://steadfast.com.bd/user/frauds",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
    });
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
