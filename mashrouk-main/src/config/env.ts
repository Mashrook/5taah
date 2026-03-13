/**
 * Environment Configuration
 * ✅ يتم تحميل المتغيرات من Railway Variables تلقائياً
 */

export const ENV = {
  // ✅ Supabase Configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID || '',
  
  // ✅ Moyasar Payment Configuration
  MOYASAR_PUBLISHABLE_KEY: import.meta.env.MOYASAR_PUBLISHABLE_KEY || '',
  MOYASAR_SECRET_KEY: import.meta.env.MOYASAR_SECRET_KEY || '',
  
  // ✅ API URLs
  API_AMADEUS_URL: import.meta.env.API_Amadeus_URL || '',
  API_MOYASAR_URL: import.meta.env.API_Moyasar_URL || '',
  
  // ✅ Amadeus Configuration
  AMADEUS_CLIENT_ID: import.meta.env.AMADEUS_CLIENT_ID || '',
  AMADEUS_CLIENT_SECRET: import.meta.env.AMADEUS_CLIENT_SECRET || '',
  
  // ✅ Travelpayouts Configuration
  TRAVELPAYOUTS_TOKEN: import.meta.env.API_token_Travelpayouts || '',
} as const;

/**
 * ✅ دالة التحقق من وجود المتغيرات المطلوبة
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const required = {
    SUPABASE_URL: ENV.SUPABASE_URL,
    SUPABASE_KEY: ENV.SUPABASE_KEY,
    MOYASAR_PUBLISHABLE_KEY: ENV.MOYASAR_PUBLISHABLE_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * ✅ دالة للطباعة الآمنة للمتغيرات (للتطوير فقط)
 */
export function logEnvStatus() {
  if (import.meta.env.MODE === 'development') {
    console.log('🔧 Environment Configuration:');
    console.log('- SUPABASE_URL:', ENV.SUPABASE_URL ? '✅' : '❌');
    console.log('- SUPABASE_KEY:', ENV.SUPABASE_KEY ? '✅' : '❌');
    console.log('- MOYASAR_PUBLISHABLE_KEY:', ENV.MOYASAR_PUBLISHABLE_KEY ? '✅' : '❌');
    console.log('- AMADEUS_CLIENT_ID:', ENV.AMADEUS_CLIENT_ID ? '✅' : '❌');
    console.log('- TRAVELPAYOUTS_TOKEN:', ENV.TRAVELPAYOUTS_TOKEN ? '✅' : '❌');
    
    const validation = validateEnv();
    if (!validation.valid) {
      console.error('❌ Missing variables:', validation.missing);
    } else {
      console.log('✅ All required variables are configured');
    }
  }
}

// تشغيل التحقق تلقائياً
logEnvStatus();
