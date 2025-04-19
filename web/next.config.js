/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  
  // Configuração de imagens
  images: {
    domains: ['localhost', 'api.seu-dominio-producao.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Otimizações para produção
  experimental: {
    // Remova a otimização de CSS que requer critters
    optimizePackageImports: ['lucide-react'],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  
  // Redirecionamentos
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Configurações de ambiente
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001',
  },
  
  // Configuração de compilação
  webpack: (config, { dev, isServer }) => {
    // Otimizações apenas para produção
    if (!dev) {
      config.optimization.minimize = true;
    }
    
    // Resolução para pacotes ESM, incluindo date-fns usado pelo @tremor/react
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      os: false,
      tls: false,
      fs: false,
      path: false,
    };

    // Tratamento para date-fns (ESM)
    config.module.rules.push({
      test: /node_modules\/date-fns/,
      type: 'javascript/auto',
    });
    
    return config;
  },

  // Configuração para módulos ESM transpilados
  transpilePackages: ['@tremor/react', 'date-fns'],
};

module.exports = nextConfig; 