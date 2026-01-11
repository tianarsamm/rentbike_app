import {
    addUrlListener,
    clearDeferredLink,
    extractAttributionParams,
    getDeferredLink,
    getInitialUrl,
    navigateToDeepLink,
    parseDeepLink,
    type DeepLinkParams,
    type ParsedDeepLink
} from '@/lib/deeplink';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Storage keys
const DEEP_LINK_KEY = '@rentride_deep_link';
const ATTRIBUTION_KEY = '@rentride_attribution';

interface UseDeepLinkOptions {
  autoNavigate?: boolean;
  persistAttribution?: boolean;
  deferredLinkKey?: string;
}

interface UseDeepLinkReturn {
  // State
  isDeepLink: boolean;
  deepLinkData: ParsedDeepLink | null;
  attributionParams: DeepLinkParams;
  isLoading: boolean;
  
  // Actions
  handleUrl: (url: string) => Promise<void>;
  processDeferredLink: () => Promise<boolean>;
  clearAttribution: () => Promise<void>;
  getCurrentUrl: () => Promise<string | null>;
  
  // Utility
  getAttributionString: () => string;
  hasAttribution: () => boolean;
}

export function useDeepLink(options: UseDeepLinkOptions = {}): UseDeepLinkReturn {
  const {
    autoNavigate = true,
    persistAttribution = true,
  } = options;

  const router = useRouter();
  const segments = useSegments();
  
  const [isDeepLink, setIsDeepLink] = useState(false);
  const [deepLinkData, setDeepLinkData] = useState<ParsedDeepLink | null>(null);
  const [attributionParams, setAttributionParams] = useState<DeepLinkParams>({});
  const [isLoading, setIsLoading] = useState(true);

  // Save attribution params
  const saveAttribution = useCallback(async (params: DeepLinkParams) => {
    if (!persistAttribution) return;
    
    try {
      await AsyncStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(params));
      setAttributionParams(params);
      console.log('💾 Attribution params saved:', params);
    } catch (error) {
      console.error('❌ Error saving attribution:', error);
    }
  }, [persistAttribution]);

  // Get attribution params
  const getAttribution = useCallback(async (): Promise<DeepLinkParams> => {
    try {
      const data = await AsyncStorage.getItem(ATTRIBUTION_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('❌ Error getting attribution:', error);
    }
    return {};
  }, []);

  // Clear attribution
  const clearAttributionFn = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ATTRIBUTION_KEY);
      setAttributionParams({});
      console.log('🗑️ Attribution cleared');
    } catch (error) {
      console.error('❌ Error clearing attribution:', error);
    }
  }, []);

  // Get attribution string for analytics
  const getAttributionString = useCallback(() => {
    const parts: string[] = [];
    if (attributionParams.utm_source) parts.push(`utm_source=${attributionParams.utm_source}`);
    if (attributionParams.utm_medium) parts.push(`utm_medium=${attributionParams.utm_medium}`);
    if (attributionParams.utm_campaign) parts.push(`utm_campaign=${attributionParams.utm_campaign}`);
    if (attributionParams.ref) parts.push(`ref=${attributionParams.ref}`);
    if (attributionParams.promo) parts.push(`promo=${attributionParams.promo}`);
    return parts.join(' | ');
  }, [attributionParams]);

  // Check if has attribution
  const hasAttributionFn = useCallback(() => {
    return Object.keys(attributionParams).length > 0;
  }, [attributionParams]);

  // Handle URL
  const handleUrl = useCallback(async (url: string) => {
    if (!url) return;

    console.log('🔗 useDeepLink - Handling URL:', url);

    const parsed = parseDeepLink(url);
    
    if (!parsed) {
      console.log('⚠️ Could not parse URL');
      return;
    }

    setDeepLinkData(parsed);
    setIsDeepLink(true);

    // Extract and save attribution params
    const attribution = extractAttributionParams(url);
    if (Object.keys(attribution).length > 0) {
      await saveAttribution(attribution);
    }

    if (autoNavigate) {
      navigateToDeepLink(parsed);
    }
  }, [autoNavigate, saveAttribution]);

  // Process deferred link
  const processDeferredLink = useCallback(async (): Promise<boolean> => {
    try {
      const deferredData = await getDeferredLink();
      
      if (!deferredData) {
        console.log('ℹ️ No deferred link to process');
        return false;
      }

      console.log('📦 Processing deferred link:', deferredData);

      // Create parsed deep link from deferred data
      const parsed: ParsedDeepLink = {
        route: deferredData.route,
        params: deferredData.params,
        rawUrl: deferredData.originalUrl,
      };

      setDeepLinkData(parsed);
      setIsDeepLink(true);

      if (autoNavigate) {
        navigateToDeepLink(parsed);
      }

      // Clear deferred link after processing
      await clearDeferredLink();

      return true;
    } catch (error) {
      console.error('❌ Error processing deferred link:', error);
      return false;
    }
  }, [autoNavigate]);

  // Get current URL
  const getCurrentUrl = useCallback(async (): Promise<string | null> => {
    try {
      return await getInitialUrl();
    } catch (error) {
      console.error('❌ Error getting current URL:', error);
      return null;
    }
  }, []);

  // Initial setup
  useEffect(() => {
    let mounted = true;

    const setupDeepLink = async () => {
      setIsLoading(true);
      
      try {
        // 1. Load stored attribution
        const storedAttribution = await getAttribution();
        if (mounted && Object.keys(storedAttribution).length > 0) {
          setAttributionParams(storedAttribution);
          console.log('📊 Loaded stored attribution:', storedAttribution);
        }

        // 2. Check for initial URL (app was closed and opened via deep link)
        const initialUrl = await getInitialUrl();
        
        if (mounted && initialUrl) {
          console.log('🚀 Initial URL detected:', initialUrl);
          
          // Try to process as deferred link first
          const processed = await getDeferredLink();
          
          if (!processed) {
            // No deferred link, process as regular deep link
            await handleUrl(initialUrl);
          }
        } else if (mounted) {
          // No initial URL, check for deferred link
          await processDeferredLink();
        }
      } catch (error) {
        console.error('❌ Error in deep link setup:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    setupDeepLink();

    // Add URL listener for when app is already open
    const cleanup = addUrlListener(async (url) => {
      await handleUrl(url);
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, []);

  // Re-process deferred link when app becomes active (optional - for background to foreground)
  useEffect(() => {
    if (Platform.OS === 'android') {
      const subscription = require('react-native').AppState.addEventListener(
        'change',
        async (nextAppState: string) => {
          if (nextAppState === 'active') {
            // Check for deferred link when app comes to foreground
            const deferred = await getDeferredLink();
            if (deferred && !isDeepLink) {
              console.log('📦 App came to foreground, processing deferred link');
              await processDeferredLink();
            }
          }
        }
      );

      return () => {
        subscription.remove();
      };
    }
  }, [isDeepLink, processDeferredLink]);

  return {
    isDeepLink,
    deepLinkData,
    attributionParams,
    isLoading,
    handleUrl,
    processDeferredLink,
    clearAttribution: clearAttributionFn,
    getCurrentUrl,
    getAttributionString,
    hasAttribution: hasAttributionFn,
  };
}

// Hook untuk mendapatkan params dari deep link di halaman tertentu
export function useDeepLinkParams<T = Record<string, string>>(): {
  params: T;
  hasDeepLink: boolean;
  attribution: DeepLinkParams;
} {
  const { deepLinkData, attributionParams, isDeepLink } = useDeepLink();
  const segments = useSegments();

  const params = deepLinkData?.params as T || ({} as T);

  return {
    params,
    hasDeepLink: isDeepLink,
    attribution: attributionParams,
  };
}

// Hook untuk auto-apply promo/discount dari deep link
export function useDeepLinkPromo(): {
  promoCode: string | null;
  discount: string | null;
  promoDetails: { code: string; discount: number } | null;
  clearPromo: () => void;
} {
  const { attributionParams, clearAttribution } = useDeepLink();
  const [promoDetails, setPromoDetails] = useState<{ code: string; discount: number } | null>(null);

  const promoCode = attributionParams.promo || attributionParams.ref || null;
  const discount = attributionParams.discount || null;

  useEffect(() => {
    if (promoCode || discount) {
      console.log('🎁 Promo from deep link:', { promoCode, discount });
      
      // Parse discount percentage if present
      if (discount) {
        const discountValue = parseInt(discount, 10);
        if (!isNaN(discountValue)) {
          setPromoDetails({
            code: promoCode || 'DEEPLINK',
            discount: discountValue,
          });
        }
      }
    }
  }, [promoCode, discount]);

  const clearPromo = useCallback(() => {
    clearAttribution();
    setPromoDetails(null);
  }, [clearAttribution]);

  return {
    promoCode,
    discount,
    promoDetails,
    clearPromo,
  };
}

