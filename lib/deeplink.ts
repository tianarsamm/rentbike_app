import type { DeepLinkParams, DeferredLinkData, ParsedDeepLink } from '@/types/deepLink';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Linking } from 'react-native';

/* ================================
   CONFIG
================================ */
const DEFERRED_LINK_KEY = '@rentride_deferred_link';
const DEFERRED_LINK_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 hari

let hasHandledInitialLink = false;

/* ================================
   UTILS
================================ */
function isDevExpoUrl(url: string) {
  return (
    url.startsWith('exp://') ||
    url.includes('192.168.') ||
    url.includes('localhost')
  );
}

/* ================================
   PARSE DEEP LINK
================================ */
export function parseDeepLink(url: string): ParsedDeepLink | null {
  if (!url || isDevExpoUrl(url)) {
    console.log('⛔ Ignored non-deeplink URL:', url);
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return null; // ⛔ path kosong bukan deep link
    }

    const action = segments[0];
    const id = segments[1];

    const params: DeepLinkParams = {};
    parsedUrl.searchParams.forEach((value, key) => {
      params[key as keyof DeepLinkParams] = value;
    });

    let route: string | null = null;

    switch (action) {
      case 'bike':
        if (id) route = `/home?bikeId=${id}`;
        break;

      case 'booking':
        if (id) route = `/booking/date?bikeId=${id}`;
        break;

      case 'transaction':
        if (id) route = `/booking/transaction?id=${id}`;
        break;

      case 'auth':
        if (id === 'login') route = '/user/login';
        if (id === 'register') route = '/user/register';
        break;

      default:
        return null;
    }

    if (!route) return null;

    console.log('🎯 Deep link parsed:', route);

    return {
      route,
      params,
      rawUrl: url,
    };
  } catch (err) {
    console.error('❌ parseDeepLink error:', err);
    return null;
  }
}

/* ================================
   NAVIGATION
================================ */
export function navigateToDeepLink(parsed: ParsedDeepLink) {
  console.log('🚀 Navigating to deep link:', parsed.route);

  router.replace({
    pathname: parsed.route.split('?')[0] as any,
    params: {
      ...parsed.params,
      _fromDeepLink: 'true',
    },
  });
}

/* ================================
   HANDLE INCOMING URL
================================ */
export async function handleIncomingUrl(url: string | null) {
  if (!url || hasHandledInitialLink) return null;

  hasHandledInitialLink = true;

  const parsed = parseDeepLink(url);
  if (parsed) {
    navigateToDeepLink(parsed);
    return parsed;
  }

  return null;
}

/* ================================
   INITIAL URL (APP LAUNCH)
================================ */
export async function getInitialUrl() {
  try {
    const url = await Linking.getInitialURL();
    console.log('🚀 Initial URL:', url);
    return url;
  } catch {
    return null;
  }
}

/* ================================
   URL LISTENER (RUNTIME)
================================ */
export function addUrlListener(callback: (url: string) => void) {
  const sub = Linking.addEventListener('url', ({ url }) => {
    if (isDevExpoUrl(url)) return;
    callback(url);
  });

  return () => sub.remove();
}

/* ================================
   DEFERRED LINK (OPTIONAL)
================================ */
export async function saveDeferredLink(data: DeferredLinkData) {
  await AsyncStorage.setItem(DEFERRED_LINK_KEY, JSON.stringify(data));
}

export async function getDeferredLink(): Promise<DeferredLinkData | null> {
  const raw = await AsyncStorage.getItem(DEFERRED_LINK_KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as DeferredLinkData;
  if (Date.now() - parsed.timestamp > DEFERRED_LINK_EXPIRY) {
    await AsyncStorage.removeItem(DEFERRED_LINK_KEY);
    return null;
  }

  return parsed;
}

export async function clearDeferredLink() {
  await AsyncStorage.removeItem(DEFERRED_LINK_KEY);
  console.log('🗑️ Deferred link cleared');
}

/* ================================
   ATTRIBUTION UTILS
================================ */
export function extractAttributionParams(url: string): DeepLinkParams {
  const params: DeepLinkParams = {};
  
  try {
    const parsedUrl = new URL(url);
    
    // Extract UTM parameters
    const utmSource = parsedUrl.searchParams.get('utm_source');
    const utmMedium = parsedUrl.searchParams.get('utm_medium');
    const utmCampaign = parsedUrl.searchParams.get('utm_campaign');
    const utmContent = parsedUrl.searchParams.get('utm_content');
    const utmTerm = parsedUrl.searchParams.get('utm_term');
    
    // Extract referral parameters
    const ref = parsedUrl.searchParams.get('ref') || parsedUrl.searchParams.get('referral_code');
    
    // Extract custom parameters
    const promo = parsedUrl.searchParams.get('promo');
    const discount = parsedUrl.searchParams.get('discount');
    const source = parsedUrl.searchParams.get('source');
    const medium = parsedUrl.searchParams.get('medium');
    const campaign = parsedUrl.searchParams.get('campaign');
    
    if (utmSource) params.utm_source = utmSource;
    if (utmMedium) params.utm_medium = utmMedium;
    if (utmCampaign) params.utm_campaign = utmCampaign;
    if (utmContent) params.utm_content = utmContent;
    if (utmTerm) params.utm_term = utmTerm;
    if (ref) params.ref = ref;
    if (promo) params.promo = promo;
    if (discount) params.discount = discount;
    if (source) params.source = source;
    if (medium) params.medium = medium;
    if (campaign) params.campaign = campaign;
    
  } catch (error) {
    console.error('❌ Error extracting attribution params:', error);
  }
  
  return params;
}
