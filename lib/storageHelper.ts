import { supabase, supabaseAdmin } from './supabase';

// Constants
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second
const TIMEOUT_MS = 30000; // 30 seconds

/**
 * Exponential backoff delay
 */
const getDelay = (attempt: number): number => {
  return Math.min(INITIAL_DELAY * Math.pow(2, attempt), 10000);
};

/**
 * Promise wrapper with timeout
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
};

/**
 * Fetch blob from URI with retry mechanism
 */
const fetchBlobWithRetry = async (uri: string, attempt: number = 0): Promise<Blob> => {
  try {
    const response = await withTimeout(fetch(uri), TIMEOUT_MS);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    return blob;
  } catch (error: any) {
    if (attempt < MAX_RETRIES - 1) {
      const delay = getDelay(attempt);
      console.log(`⚠️ Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchBlobWithRetry(uri, attempt + 1);
    }
    throw error;
  }
};

/**
 * Upload image to Supabase Storage with retry mechanism
 */
export const uploadImageWithRetry = async (
  uri: string,
  bucketName: string = 'motor-images',
  folder: string = 'motors'
): Promise<string> => {
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  
  console.log(`📤 Starting upload: ${fileName}`);
  
  // Try to fetch and upload with retries
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`🔄 Upload attempt ${attempt + 1}/${MAX_RETRIES}`);
      
      // Fetch blob with timeout
      const blob = await withTimeout(fetchBlobWithRetry(uri), TIMEOUT_MS);
      
      // Try regular supabase first (for public bucket access)
      let uploadResult;
      
      // Attempt upload with regular supabase client (RLS bypasses if bucket is public)
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });
      
      if (error) {
        // If regular client fails, try admin client
        console.log('⚠️ Regular client failed, trying admin client...');
        
        const { data: adminData, error: adminError } = await supabaseAdmin.storage
          .from(bucketName)
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });
        
        if (adminError) {
          throw new Error(adminError.message);
        }
        
        uploadResult = adminData;
      } else {
        uploadResult = data;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      console.log(`✅ Upload successful: ${urlData.publicUrl}`);
      return urlData.publicUrl;
      
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Upload attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < MAX_RETRIES - 1) {
        const delay = getDelay(attempt);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Upload failed after ${MAX_RETRIES} attempts: ${lastError?.message}`);
};

/**
 * Delete image from Supabase Storage
 */
export const deleteImage = async (
  imageUrl: string,
  bucketName: string = 'motor-images'
): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts.slice(-3).join('/'); // Get folder/filename.jpg
    
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove([fileName]);
    
    if (error) {
      console.error('❌ Delete error:', error);
      return false;
    }
    
    console.log('✅ Image deleted successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Delete failed:', error);
    return false;
  }
};

/**
 * List images from Supabase Storage
 */
export const listImages = async (
  folder: string = 'motors',
  bucketName: string = 'motor-images'
): Promise<string[]> => {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
    
    if (error) {
      throw error;
    }
    
    const urls = data.map(file => {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${folder}/${file.name}`);
      return urlData?.publicUrl || null;
    }).filter(Boolean) as string[];
    
    return urls;
  } catch (error: any) {
    console.error('❌ List images error:', error);
    return [];
  }
};

/**
 * Test storage connectivity
 */
export const testStorageConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🔍 Testing storage connection...');
    
    // Test 1: List buckets
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      return {
        success: false,
        message: `Gagal daftar bucket: ${bucketError.message}`,
      };
    }
    
    const motorImagesBucket = buckets?.find(b => b.name === 'motor-images');
    
    if (!motorImagesBucket) {
      return {
        success: false,
        message: 'Bucket "motor-images" tidak ditemukan. Buat dulu di Supabase Storage.',
        details: {
          availableBuckets: buckets?.map(b => b.name) || [],
        },
      };
    }
    
    // Test 2: Create test file
    const testFileName = `test_${Date.now()}.txt`;
    const testContent = new Blob(['Connection test successful'], { type: 'text/plain' });
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('motor-images')
      .upload(testFileName, testContent, { upsert: false });
    
    if (uploadError) {
      return {
        success: false,
        message: `Gagal upload test: ${uploadError.message}`,
        details: {
          bucket: motorImagesBucket,
          possibleCause: 'CORS tidak dikonfigurasi atau bucket tidak publik',
        },
      };
    }
    
    // Clean up test file
    await supabaseAdmin.storage.from('motor-images').remove([testFileName]);
    
    return {
      success: true,
      message: 'Koneksi storage berhasil!',
      details: {
        bucket: motorImagesBucket,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error: ${error.message}`,
    };
  }
};

