import { baseUrl } from '@/constains';
import axios from 'axios';

function handelError(error) {
    return {
        status: error?.response?.status,
        data: error?.response?.data,
    };
}
function handleSuccess(response) {
    const data = response.data || {};
    const responseData = isJson(data)
        ? JSON.parse(data)
        : data;
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

export async function registerUser({ firstName, lastName, email, password, turnstileToken }) {
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/register`,
        data: { firstName, lastName, email, password, turnstileToken },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function resendVerificationEmail(email) {
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/resend/register`,
        data: { email },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function verifyUser(token, email) {
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/verify/email`,
        data: { token, email },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function loginUser({ email, password }) {
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/login`,
        data: { email, password },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function whoAmI() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/user/whoami`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getAllPlans() {
    const options = {
        method: 'GET',
        url: `${baseUrl}/subscription/plans`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function getUserSubscriptionUsage() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/user/subscription`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function createComponent(component) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/create`,
        data: component,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getComponent(componentId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/${componentId}`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function searchComponents(pageNum = 0, query, selectedOption, selectedTags) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/search`,
        data: { query, page: pageNum, selectedOption, selectedTags },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getMyComponents(pageNum = 0, term = '', filter = '') {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/my?page=${pageNum}&term=${term}&filter=${filter}`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function deleteUser() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/user/delete/account`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function deleteTheme(themeId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/theme/${themeId}`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function deleteComponent(componentId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/${componentId}`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function uploadComponentImage(data) {
    const token = localStorage.getItem('token');

    try {
        // Convert base64 to image
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = data.file;
        });

        // Create canvas and convert to WebP
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw with high quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Convert to WebP blob with compression
        const webpBlob = await new Promise(resolve => {
            canvas.toBlob(blob => {
                resolve(blob);
            }, 'image/webp', 0.7);
        });

        // Create a File object from the WebP blob
        const file = new File([webpBlob], `${data.id}.webp`, {
            type: 'image/webp',
            lastModified: Date.now()
        });


        const formData = new FormData();
        formData.append('file', file);
        formData.append('id', data.id);

        const options = {
            method: 'POST',
            url: `${baseUrl}/component/image/upload`,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            data: formData,
        };

        return axios(options)
            .then((response) => handleSuccess(response))
            .catch((error) => handelError(error));

    } catch (error) {
        console.error('Error processing image:', error);
        return handelError(error);
    }
}


export async function uploadComponentGif(captures, id) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/component/gif/create`,
        data: { captures, id },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getComponentImage(componentId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/image/${componentId}`,
        responseType: 'blob',
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function getPublicComponentInfo(componentId) {
    const options = {
        method: 'GET',
        url: `${baseUrl}/c/info/${componentId}`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function shareComponent(componentId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/share/${componentId}`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function loginWithGoogle() {
    const options = {
        method: 'GET',
        url: `${baseUrl}/auth/google`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function subcribeToNewsletter(email) {
    const options = {
        method: 'POST',
        url: `${baseUrl}/newsletter/subscribe`,
        data: { email },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function updateUserInfo({ firstName, lastName }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/change-name`,
        data: { firstName, lastName },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
}

export async function fetchAllComponentsForSitemap({ token }) {
    const options = {
        method: 'GET',
        url: `${baseUrl}/c/fetch/sitemap/all`,
        headers: {
            'X-API-KEY': token,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getRecentlyCreatedComponents() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/my/recent`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function changePassword(currentPassword, newPassword) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/user/change-password`,
        data: { currentPassword, newPassword },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function resetPassword(email) {
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/resend/password`,
        data: { email },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function resetPasswordWithToken(token, email, password) {
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/reset/password`,
        data: { token, email, password },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function getTheme(themeId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/theme/${themeId}`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function insertTheme(data) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/theme/insert`,
        data
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function generateTokens({ prompt, currentTokens, usedUiFrameworks }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/ai/generate-tokens`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
        data: { prompt, currentTokens, usedUiFrameworks },
    };

    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));

}
export async function getExampleComponents() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/component/external`,

    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function reportComponent(componentId, reason) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/component/report/${componentId}`,
        data: { reason },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function getUserSubscriptionPlans(show = null) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        url: `${baseUrl}/subscription/user/plans?show=${show}`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getCheckoutSession(planId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/subscription/create-checkout-session`,
        data: { planId },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function previewUpgradeSubscription(planId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/subscription/preview-upgrade`,
        data: { planId },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function performUpgradeSubscription(planId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/subscription/upgrade`,
        data: { planId },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function cancelSubscription() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/subscription/cancel`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function checkIfCanCreate() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/component/can/create`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function forkComponent(componentId) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/component/fork`,
        data: { componentId },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}


export async function upvote({ id, status }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/component/upvote`,
        data: { id, status },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function setLanguagePreference(languages) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/language/preference`,
        data: { languages },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getCompletion({ prompt, language, usedUiFrameworks, id }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/ai/completion`,
        data: { prompt, language, usedUiFrameworks, id },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function getCompletionInput({ prompt, fa }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/ai/completion/input`,
        data: { prompt, fa },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function remapFiles({ files, uiFrameworks, themeKeys }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/ai/remap-files`,
        data: { files, uiFrameworks, themeKeys },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function generatePreview({ files }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/ai/generate-preview`,
        data: { files },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}
export async function refreshToken() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/user/refresh`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function generateAiComponentName({ name, description, image }) {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        url: `${baseUrl}/ai/component-name`,
        data: { name, description, image },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function generateCliToken() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/user/cli/token`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getCliToken() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/user/cli/token`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function revokeCliToken() {
    const token = localStorage.getItem('token');
    const options = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        url: `${baseUrl}/user/cli/token/revoke`,
    };
    return axios(options)
        .then((response) => handleSuccess(response))
        .catch((error) => handelError(error));
}

export async function getTopComponents() {
    const options = {
        method: 'GET',
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
            method: 'GET',
            url: `${baseUrl}/c/top-components`,
        };
        const response = await axios(options);
        return handleSuccess(response);
    } catch (error) {
        console.error("Error fetching top components:", error);
        return { status: 500, data: [] };
    }
}