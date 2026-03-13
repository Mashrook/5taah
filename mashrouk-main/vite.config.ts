import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "**/*.png"],
      manifest: false, // Using external manifest.json
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg,webp}"],
        navigateFallbackDenylist: [/^\/oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/frkdmxdfalohpmzlnsth\.supabase\.co\/rest\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
  // ✅ تعريف المتغيرات البيئية لـ Vite
  define: {
    // Moyasar Keys
    'import.meta.env.MOYASAR_PUBLISHABLE_KEY': JSON.stringify(
      process.env.MOYASAR_PUBLISHABLE_KEY || ''
    ),
    'import.meta.env.MOYASAR_SECRET_KEY': JSON.stringify(
      process.env.MOYASAR_SECRET_KEY || ''
    ),
    
    // Amadeus Keys
    'import.meta.env.AMADEUS_CLIENT_ID': JSON.stringify(
      process.env.AMADEUS_CLIENT_ID || ''
    ),
    'import.meta.env.AMADEUS_CLIENT_SECRET': JSON.stringify(
      process.env.AMADEUS_CLIENT_SECRET || ''
    ),
    
    // Travelpayouts
    'import.meta.env.API_token_Travelpayouts': JSON.stringify(
      process.env.API_token_Travelpayouts || ''
    ),
    
    // Supabase (يبقى مع VITE_ لأنه موجود بالفعل)
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
      process.env.VITE_SUPABASE_URL || ''
    ),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
    ),
    'import.meta.env.VITE_SUPABASE_PROJECT_ID': JSON.stringify(
      process.env.VITE_SUPABASE_PROJECT_ID || ''
    ),
    
    // API URLs
    'import.meta.env.API_Amadeus_URL': JSON.stringify(
      process.env.API_Amadeus_URL || ''
    ),
    'import.meta.env.API_Moyasar_URL': JSON.stringify(
      process.env.API_Moyasar_URL || ''
    ),
  },
}));
