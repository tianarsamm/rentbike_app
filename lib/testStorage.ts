import { supabase, supabaseAdmin } from '../lib/supabase';

export const testSupabaseStorage = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    console.log('📡 Supabase URL:', supabase.supabaseUrl);
    console.log('🔑 Has anon key:', !!supabase.supabaseKey);

    // Test basic connection
    console.log('🔍 Testing basic Supabase connection...');
    const { data: healthData, error: healthError } = await supabase
      .from('bikes')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Basic connection failed:', healthError);
      console.log('💡 Check your Supabase URL and anon key in lib/supabase.ts');
      return false;
    }

    console.log('✅ Basic connection OK');

    // Test auth
    console.log('🔍 Testing auth...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('❌ Auth error:', authError);
      return false;
    }

    if (!session) {
      console.error('❌ No active session - please login first');
      console.log('💡 Make sure you are logged in as admin before testing storage');
      return false;
    }

    console.log('✅ Auth OK - user:', session.user.email);

    // Test storage bucket
    console.log('🔍 Testing storage bucket listing...');
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();

    if (bucketError) {
      console.error('❌ Bucket list error:', bucketError);
      console.log('💡 This might be a permission issue. Check your service role key.');
      return false;
    }

    console.log('📋 Available buckets:', buckets?.map(b => b.name) || []);
    console.log('📊 Total buckets found:', buckets?.length || 0);

    if (!buckets || buckets.length === 0) {
      console.error('❌ No buckets found at all');
      console.log('💡 Make sure you have created buckets in Supabase Storage');
      return false;
    }

    const motorImagesBucket = buckets.find(b => b.name === 'motor-images');
    if (!motorImagesBucket) {
      console.error('❌ Bucket "motor-images" not found. Available buckets:', buckets.map(b => b.name));
      console.log('💡 Create a bucket named "motor-images" in Supabase Storage');
      return false;
    }

    console.log('✅ Bucket found:', motorImagesBucket);
    console.log('📊 Bucket details:', {
      name: motorImagesBucket.name,
      id: motorImagesBucket.id,
      public: motorImagesBucket.public,
      created_at: motorImagesBucket.created_at
    });

    // Test file operations
    console.log('🔍 Testing file operations...');
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('motor-images')
      .list();

    if (listError) {
      console.error('❌ List files error:', listError);
      console.log('💡 Check if bucket "motor-images" exists and is public');
      return false;
    }

    console.log('✅ Can list files:', files?.length || 0, 'files');

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('💡 Check your internet connection and Supabase configuration');
    return false;
  }
};