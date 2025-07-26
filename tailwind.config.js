/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Sistema de Cores Orbital
      colors: {
        // Primárias Orbitais
        'cobalt': {
          50: '#EBF2FF',
          100: '#D6E4FF',
          200: '#B3CCFF',
          300: '#8FB0FF',
          400: '#6B94FF',
          500: '#2162FF', // Cobalto Elétrico
          600: '#1A4FE6',
          700: '#123BBF',
          800: '#0B2999',
          900: '#0E1A59', // Índigo Real
        },
        'orbit': {
          50: '#F3F1FF',
          100: '#E7E3FF',
          200: '#D2CBFF',
          300: '#BDB3FF',
          400: '#A89BFF',
          500: '#6E5BFF', // Violeta Órbita
          600: '#5841E6',
          700: '#4230BF',
          800: '#2E2199',
          900: '#1D1473',
        },
        'lime-signal': {
          50: '#F9FFED',
          100: '#F2FFDB',
          200: '#E5FFB8',
          300: '#D9FF94',
          400: '#CCFF70',
          500: '#B7FF3A', // Verde Lima Sinal
          600: '#9EE621',
          700: '#7BB315',
          800: '#588009',
          900: '#354D03',
        },
        'amber-alert': {
          50: '#FFF9ED',
          100: '#FFF2DB',
          200: '#FFE5B8',
          300: '#FFD794',
          400: '#FFCA70',
          500: '#FFB443', // Âmbar de Alerta
          600: '#E69A21',
          700: '#B37715',
          800: '#805409',
          900: '#4D3103',
        },
        // Neutras
        'graphite': {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#141414', // Grafite
        },
        'mist': {
          50: '#F5F7FA', // Cinza Névoa
          100: '#EDF2F7',
          200: '#E2E8F0',
          300: '#CBD5E0',
          400: '#A0AEC0',
          500: '#718096',
          600: '#4A5568',
          700: '#2D3748',
          800: '#1A202C',
          900: '#171923',
        }
      },
      
      // Tipografia Orbital
      fontFamily: {
        'orbital': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      
      // Spacing Orbital (baseado em 8px grid)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Border Radius Orbital
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      
      // Sombras Orbitais
      boxShadow: {
        'orbital': '0 8px 32px rgba(33, 98, 255, 0.12)',
        'orbital-hover': '0 12px 48px rgba(33, 98, 255, 0.18)',
        'orbital-deep': '0 20px 60px rgba(14, 26, 89, 0.25)',
        'glow': '0 0 20px rgba(33, 98, 255, 0.3)',
      },
      
      // Gradientes Orbitais
      backgroundImage: {
        'orbital-gradient': 'linear-gradient(135deg, #2162FF 0%, #0E1A59 100%)',
        'orbital-hover': 'linear-gradient(135deg, #3B75FF 0%, #1A2B6B 100%)',
        'orbital-light': 'linear-gradient(135deg, rgba(33, 98, 255, 0.1) 0%, rgba(14, 26, 89, 0.05) 100%)',
        'card-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        'motion-blur': 'linear-gradient(90deg, transparent, rgba(33, 98, 255, 0.1), transparent)',
      },
      
      // Animações Orbitais
      animation: {
        'orbital-pulse': 'orbital-pulse 2s ease-in-out infinite',
        'orbital-spin': 'orbital-spin 1s linear infinite',
        'motion-slide': 'motion-slide 2s infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      
      // Keyframes
      keyframes: {
        'orbital-pulse': {
          '0%, 100%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
          '50%': { 
            transform: 'scale(1.05)', 
            opacity: '0.8' 
          },
        },
        'orbital-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'motion-slide': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        'fade-in': {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(20px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        'slide-up': {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(10px)' 
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
        },
        'glow-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(33, 98, 255, 0.3)' 
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(33, 98, 255, 0.5)' 
          },
        },
      },
      
      // Backdrop Blur
      backdropBlur: {
        'orbital': '12px',
      },
      
      // Aspect Ratios
      aspectRatio: {
        'map': '16 / 10',
        'card': '4 / 3',
      },
      
      // Z-Index
      zIndex: {
        'overlay': '100',
        'modal': '200',
        'tooltip': '300',
      },
    },
  },
  plugins: [
    // Plugin customizado para componentes orbitais
    function({ addComponents, theme }) {
      addComponents({
        // Botões Orbitais
        '.btn-orbital-primary': {
          background: 'linear-gradient(135deg, #2162FF 0%, #0E1A59 100%)',
          color: '#FFFFFF',
          padding: '0.75rem 1.5rem',
          borderRadius: '0.75rem',
          fontWeight: '500',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: 'none',
          cursor: 'pointer',
          '&:hover': {
            background: 'linear-gradient(135deg, #3B75FF 0%, #1A2B6B 100%)',
            boxShadow: '0 12px 48px rgba(33, 98, 255, 0.18)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        
        // Cards Orbitais
        '.card-orbital': {
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(33, 98, 255, 0.12)',
            borderColor: '#DBEAFE',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            right: '0',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #2162FF 0%, #0E1A59 100%)',
            opacity: '0',
            clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
            transition: 'opacity 0.3s ease',
          },
          '&:hover::before': {
            opacity: '0.1',
          },
        },
        
        // Status Indicators
        '.status-orbital-online': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: 'rgba(183, 255, 58, 0.1)',
          color: '#4A7C59',
          border: '1px solid rgba(183, 255, 58, 0.3)',
        },
        
        '.status-orbital-offline': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: '500',
          background: 'rgba(107, 114, 128, 0.1)',
          color: '#6B7280',
          border: '1px solid rgba(107, 114, 128, 0.3)',
        },
      })
    }
  ],
} 