const CONSENT_KEY = 'lmc_privacy_consent';
export function getPrivacyConsent() {
    try {
        const raw = localStorage.getItem(CONSENT_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function setPrivacyConsent(consent) {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
}
export function hasAcceptedConsent() {
    const consent = getPrivacyConsent();
    return consent?.accepted === true;
}
export function clearPrivacyConsent() {
    localStorage.removeItem(CONSENT_KEY);
}
