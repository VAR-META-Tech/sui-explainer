import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                sui: {
                    primary: '#4D6AFF',
                    secondary: '#6D28D9',
                    success: '#10B981',
                    warning: '#F59E0B',
                    error: '#EF4444',
                    dark: '#0F172A',
                    darker: '#020617',
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-in-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'flow-arrow': 'flowArrow 1.5s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                flowArrow: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '50%': { transform: 'translateX(5px)' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'grid-pattern': 'linear-gradient(to right, rgba(77, 106, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(77, 106, 255, 0.1) 1px, transparent 1px)',
            },
        },
    },
    plugins: [],
};

export default config;
