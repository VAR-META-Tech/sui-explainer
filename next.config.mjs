/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable telemetry collection
    telemetry: {
        enabled: false,
    },

    // Image optimization settings
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },

    // Enable React strict mode for development
    reactStrictMode: true,

    // Compiler options
    compiler: {
        // Remove console.log in production
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Webpack configuration for @mysten/sui
    webpack: (config) => {
        // Handle @mysten/sui dependencies
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };
        return config;
    },
};

export default nextConfig;
