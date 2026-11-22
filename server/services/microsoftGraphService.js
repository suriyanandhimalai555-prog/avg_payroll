import dotenv from 'dotenv';
dotenv.config();

const GRAPH_SEND_MAIL_URL = 'https://graph.microsoft.com/v1.0/me/sendMail';

let cachedAccessToken = null;
let accessTokenExpiresAt = 0;

export const isMicrosoftGraphConfigured = () => {
    return Boolean(
        process.env.AZURE_TENANT_ID &&
        process.env.AZURE_CLIENT_ID &&
        process.env.AZURE_CLIENT_SECRET &&
        process.env.AZURE_REFRESH_TOKEN
    );
};

const getMicrosoftAccessToken = async () => {
    if (!isMicrosoftGraphConfigured()) {
        throw new Error('Microsoft Graph OAuth configuration is incomplete.');
    }

    // Reuse the access token until shortly before it expires.
    if (cachedAccessToken && Date.now() < accessTokenExpiresAt - 60000) {
        return cachedAccessToken;
    }

    const tokenUrl =
        `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}` +
        '/oauth2/v2.0/token';

    const body = new URLSearchParams({
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: process.env.AZURE_REFRESH_TOKEN,
        scope: 'https://graph.microsoft.com/Mail.Send'
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
    });

    const result = await response.json();

    if (!response.ok) {
        console.error('Microsoft OAuth token error:', {
            status: response.status,
            error: result.error,
            description: result.error_description
        });

        throw new Error('Unable to obtain Microsoft Graph access token.');
    }

    cachedAccessToken = result.access_token;
    accessTokenExpiresAt = Date.now() + (result.expires_in * 1000);

    if (result.refresh_token) {
        console.warn(
            'Microsoft returned a replacement refresh token. ' +
            'Update the securely stored token before the next refresh.'
        );
    }

    return cachedAccessToken;
};

// Updated to accept an array of attachments
export const sendMicrosoftEmail = async ({ to, subject, html, attachments = [] }) => {
    if (!to || !subject || !html) {
        throw new Error('Recipient, subject and HTML content are required.');
    }

    const accessToken = await getMicrosoftAccessToken();

    const messagePayload = {
        message: {
            subject,
            body: {
                contentType: 'HTML',
                content: html
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: to
                    }
                }
            ]
        },
        saveToSentItems: true
    };

    // Append attachments if provided
    if (attachments && attachments.length > 0) {
        messagePayload.message.attachments = attachments.map(att => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: att.name,
            contentType: att.contentType,
            contentBytes: att.contentBytes
        }));
    }

    const response = await fetch(GRAPH_SEND_MAIL_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Microsoft Graph sendMail error:', {
            status: response.status,
            response: errorText
        });

        throw new Error(
            `Microsoft Graph email sending failed (HTTP ${response.status}).`
        );
    }

    return { success: true };
};