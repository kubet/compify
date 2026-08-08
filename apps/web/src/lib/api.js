import { baseUrl } from "@/constains";
import axios from "axios";

// Required for cross-origin, host-only HttpOnly session cookies.
axios.defaults.withCredentials = true;

function handelError(error) {
  const responseData = error?.response?.data;
  return {
    status: error?.response?.status ?? null,
    data:
      responseData && typeof responseData === "object"
        ? responseData
        : {
            message:
              typeof responseData === "string" && responseData.trim()
                ? responseData
                : "Unable to reach the service. Please try again.",
          },
  };
}
function handleSuccess(response) {
  const data = response.data || {};
  const responseData = isJson(data) ? JSON.parse(data) : data;
  return { status: response.status, data: responseData };
}
const isJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export async function registerUser({
  firstName,
  lastName,
  email,
  password,
  turnstileToken,
}) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/register`,
    data: { firstName, lastName, email, password, turnstileToken },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function resendVerificationEmail(email) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/resend/register`,
    data: { email },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function verifyUser(token, email) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/verify/email`,
    data: { token, email },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function loginUser({ email, password }) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/login`,
    data: { email, password },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function whoAmI() {
  const options = {
    method: "GET",
    url: `${baseUrl}/user/whoami`,
    // Session discovery is expected to return 401 for anonymous visitors.
    // Protected pages perform their own redirect via withAuth.
    skipAuthRedirect: true,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getAllPlans() {
  const options = {
    method: "GET",
    url: `${baseUrl}/subscription/plans`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function getUserSubscriptionUsage() {
  const options = {
    method: "GET",
    url: `${baseUrl}/user/subscription`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function createComponent(component) {
  const options = {
    method: "POST",
    url: `${baseUrl}/component/create`,
    data: component,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getComponent(componentId) {
  const options = {
    method: "GET",
    url: `${baseUrl}/component/${componentId}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function checkDomain(domain, componentId) {
  const options = {
    method: "GET",
    url: `${baseUrl}/component/check/domain?domain=${domain}&id=${componentId}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function getViewComponent(componentId) {
  const slug = Array.isArray(componentId) ? componentId.join("/") : componentId;
  const options = {
    method: "GET",
    url: `${baseUrl}/c/view?slug=${slug}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function searchComponents(
  pageNum = 0,
  query,
  selectedOption,
  selectedTags
) {
  // HttpOnly cookies are deliberately unreadable. Try the personalized route
  // and fall back to public search when there is no active session.
  const data = { query, page: pageNum, selectedOption, selectedTags };
  return axios({
    method: "POST",
    url: `${baseUrl}/component/search`,
    data,
    skipAuthRedirect: true,
  })
    .catch((error) => {
      if (error.response?.status === 401) {
        return axios({ method: "POST", url: `${baseUrl}/c/search`, data });
      }
      throw error;
    })
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getMyComponents(pageNum = 0, term = "", filter = "") {
  const options = {
    method: "GET",
    url: `${baseUrl}/component/my?page=${pageNum}&term=${term}&filter=${filter}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function deleteUser() {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/delete/account`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function deleteTheme(themeId) {
  const options = {
    method: "DELETE",
    url: `${baseUrl}/theme/${themeId}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function deleteComponent(componentId) {
  const options = {
    method: "DELETE",
    url: `${baseUrl}/component/${componentId}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function uploadComponentImage(data) {
  try {
    // Convert base64 to image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = data.file;
    });

    // Create canvas and convert to WebP
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match image
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw with high quality settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Convert to WebP blob with compression
    const webpBlob = await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/webp",
        0.7
      );
    });

    // Create a File object from the WebP blob
    const file = new File([webpBlob], `${data.id}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", data.id);

    const options = {
      method: "POST",
      url: `${baseUrl}/component/image/upload`,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      data: formData,
    };

    return axios(options)
      .then((response) => handleSuccess(response))
      .catch((error) => handelError(error));
  } catch (error) {
    console.error("Error processing image:", error);
    return handelError(error);
  }
}

export async function uploadComponentGif(captures, id) {
  const options = {
    method: "POST",
    url: `${baseUrl}/component/gif/create`,
    data: { captures, id },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getComponentImage(componentId) {
  const options = {
    method: "GET",
    url: `${baseUrl}/component/image/${componentId}`,
    responseType: "blob",
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function getPublicComponentInfo(componentId) {
  const options = {
    method: "GET",
    url: `${baseUrl}/c/info/${componentId}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function shareComponent(componentId) {
  const options = {
    method: "POST",
    url: `${baseUrl}/component/share/${componentId}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function loginWithGoogle() {
  const options = {
    method: "GET",
    url: `${baseUrl}/auth/google`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function subcribeToNewsletter(email) {
  const options = {
    method: "POST",
    url: `${baseUrl}/newsletter/subscribe`,
    data: { email },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function updateUserInfo({ firstName, lastName, username }) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/change-name`,
    data: { firstName, lastName, username },
  };
  return axios(options).then((response) => handleSuccess(response));
}

export async function fetchAllComponentsForSitemap({ token }) {
  const options = {
    method: "GET",
    url: `${baseUrl}/c/fetch/sitemap/all`,
    headers: {
      "X-API-KEY": token,
    },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getRecentlyCreatedComponents() {
  const options = {
    method: "GET",
    url: `${baseUrl}/component/my/recent`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function changePassword(currentPassword, newPassword) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/change-password`,
    data: { currentPassword, newPassword },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function resetPassword(email) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/resend/password`,
    data: { email },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function resetPasswordWithToken(token, email, password) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/reset/password`,
    data: { token, email, password },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function getTheme(themeId) {
  const options = {
    method: "GET",
    url: `${baseUrl}/theme/${themeId}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function insertTheme(data) {
  const options = {
    method: "POST",
    url: `${baseUrl}/theme/insert`,
    data,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function generateTokens({
  prompt,
  currentTokens,
  usedUiFrameworks,
}) {
  const options = {
    method: "POST",
    url: `${baseUrl}/ai/generate-tokens`,
    data: { prompt, currentTokens, usedUiFrameworks },
  };

  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function getExampleComponents() {
  const options = {
    method: "GET",
    url: `${baseUrl}/component/external`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function reportComponent(componentId, reason) {
  const options = {
    method: "POST",
    url: `${baseUrl}/component/report/${componentId}`,
    data: { reason },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function getUserSubscriptionPlans(show = null) {
  const options = {
    method: "GET",
    url: `${baseUrl}/subscription/user/plans?show=${show}`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getCheckoutSession(planId) {
  const options = {
    method: "POST",
    url: `${baseUrl}/subscription/create-checkout-session`,
    data: { planId },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function previewUpgradeSubscription(planId) {
  const options = {
    method: "POST",
    url: `${baseUrl}/subscription/preview-upgrade`,
    data: { planId },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function performUpgradeSubscription(planId) {
  const options = {
    method: "POST",
    url: `${baseUrl}/subscription/upgrade`,
    data: { planId },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function cancelSubscription() {
  const options = {
    method: "POST",
    url: `${baseUrl}/subscription/cancel`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function checkIfCanCreate() {
  const options = {
    method: "POST",
    url: `${baseUrl}/component/can/create`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function forkComponent(componentId) {
  const options = {
    method: "POST",
    url: `${baseUrl}/component/fork`,
    data: { componentId },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function upvote({ id, status }) {
  const options = {
    method: "POST",
    url: `${baseUrl}/component/upvote`,
    data: { id, status },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function setLanguagePreference(languages) {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/language/preference`,
    data: { languages },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getCompletion({
  prompt,
  language,
  usedUiFrameworks,
  id,
}) {
  const options = {
    method: "POST",
    url: `${baseUrl}/ai/completion`,
    data: { prompt, language, usedUiFrameworks, id },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function getCompletionInput({ prompt, fa }) {
  const options = {
    method: "POST",
    url: `${baseUrl}/ai/completion/input`,
    data: { prompt, fa },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function remapFiles({ files, uiFrameworks, themeKeys }) {
  const options = {
    method: "POST",
    url: `${baseUrl}/ai/remap-files`,
    data: { files, uiFrameworks, themeKeys },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function generatePreview({ files }) {
  const options = {
    method: "POST",
    url: `${baseUrl}/ai/generate-preview`,
    data: { files },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
export async function refreshToken() {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/refresh`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function generateAiComponentName({ name, description, image }) {
  const options = {
    method: "POST",
    url: `${baseUrl}/ai/component-name`,
    data: { name, description, image },
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function generateCliToken() {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/cli/token`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getCliToken() {
  const options = {
    method: "GET",
    url: `${baseUrl}/user/cli/token`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function revokeCliToken() {
  const options = {
    method: "POST",
    url: `${baseUrl}/user/cli/token/revoke`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

export async function getTopComponents() {
  const options = {
    method: "GET",
    url: `${baseUrl}/c/top-components`,
  };
  return axios(options)
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}

// Serverless API version that can be used at build time
export async function getTopComponentsServerless() {
  try {
    const options = {
      method: "GET",
      url: `${baseUrl}/c/top-components`,
    };
    const response = await axios(options);
    return handleSuccess(response);
  } catch {
    // The API may be unavailable during an image build. ISR will retry.
    return { status: 503, data: [] };
  }
}

export async function logoutUser() {
  return axios({ method: "POST", url: `${baseUrl}/user/logout` })
    .then((response) => handleSuccess(response))
    .catch((error) => handelError(error));
}
