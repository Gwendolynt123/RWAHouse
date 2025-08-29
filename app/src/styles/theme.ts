// Luxury Real Estate Platform - Design System
export const theme = {
  // Brand Colors
  colors: {
    // Primary - Gold/Luxury
    gold: '#FFD700',
    goldDark: '#B8860B',
    goldLight: '#FFF8DC',
    
    // Secondary - Premium Blues
    sapphire: '#0F52BA',
    royalBlue: '#4169E1',
    midnightBlue: '#191970',
    
    // Accent Colors
    emerald: '#50C878',
    ruby: '#E0115F',
    pearl: '#F8F8FF',
    
    // Neutral Palette
    obsidian: '#0B0E13',
    charcoal: '#1A1D23',
    slate: '#2D3139',
    steel: '#474D57',
    silver: '#8892B0',
    platinum: '#A8B2D1',
    ivory: '#CCD6F6',
    
    // Gradients
    gradients: {
      luxury: 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)',
      sapphireGold: 'linear-gradient(135deg, #0F52BA 0%, #FFD700 100%)',
      midnight: 'linear-gradient(135deg, #0B0E13 0%, #191970 50%, #0B0E13 100%)',
      emeraldGold: 'linear-gradient(135deg, #50C878 0%, #FFD700 100%)',
      rubyGold: 'linear-gradient(135deg, #E0115F 0%, #FFD700 100%)',
      premium: 'linear-gradient(135deg, #FFD700 0%, #0F52BA 33%, #50C878 66%, #E0115F 100%)',
      dark: 'radial-gradient(ellipse at center, #1A1D23 0%, #0B0E13 100%)',
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'Playfair Display, Georgia, serif',
      mono: 'Monaco, "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
      '7xl': '5rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    letterSpacing: {
      tight: '-0.05em',
      normal: '0',
      wide: '0.05em',
      wider: '0.1em',
      widest: '0.2em',
    },
  },
  
  // Spacing System
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '5rem',
    '5xl': '6rem',
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '3rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.15)',
    lg: '0 10px 20px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.25)',
    '2xl': '0 30px 60px rgba(0, 0, 0, 0.3)',
    gold: '0 20px 40px rgba(255, 215, 0, 0.3)',
    sapphire: '0 20px 40px rgba(15, 82, 186, 0.3)',
    glow: '0 0 30px rgba(255, 215, 0, 0.5)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  
  // Animations
  animations: {
    fadeIn: 'fadeIn 0.5s ease-in-out',
    slideIn: 'slideIn 0.5s ease-out',
    float: 'float 20s ease-in-out infinite',
    pulse: 'pulse 2s ease-in-out infinite',
    shimmer: 'shimmer 3s linear infinite',
    gradient: 'gradient 8s ease infinite',
  },
  
  // Breakpoints
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Z-index layers
  zIndex: {
    behind: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },
};

// Styled Components
export const luxuryStyles = {
  // Glass Morphism Card
  glassCard: `
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  `,
  
  // Premium Button
  premiumButton: `
    background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%);
    color: #0B0E13;
    border: none;
    padding: 16px 40px;
    border-radius: 50px;
    font-weight: 700;
    font-size: 1.1rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 20px 40px rgba(255, 215, 0, 0.3), 0 0 0 1px rgba(255, 215, 0, 0.2);
    
    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 25px 50px rgba(255, 215, 0, 0.4), 0 0 0 2px rgba(255, 215, 0, 0.3);
    }
    
    &:active {
      transform: translateY(0) scale(0.98);
    }
    
    &:disabled {
      background: linear-gradient(135deg, #474D57 0%, #2D3139 100%);
      cursor: not-allowed;
      box-shadow: none;
    }
  `,
  
  // Luxury Input
  luxuryInput: `
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 215, 0, 0.2);
    border-radius: 16px;
    padding: 16px 20px;
    color: #F8F8FF;
    font-size: 1.1rem;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: #FFD700;
      box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.1), 0 0 20px rgba(255, 215, 0, 0.2);
      background: rgba(0, 0, 0, 0.4);
    }
    
    &::placeholder {
      color: #8892B0;
    }
  `,
  
  // Premium Badge
  premiumBadge: `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%);
    color: #0B0E13;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.3);
  `,
  
  // Luxury Title
  luxuryTitle: `
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(3rem, 8vw, 6rem);
    font-weight: 900;
    background: linear-gradient(45deg, #FFD700, #0F52BA, #50C878, #E0115F);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 60px rgba(255, 215, 0, 0.3);
    letter-spacing: 0.02em;
    background-size: 200% 200%;
    animation: gradient 8s ease infinite;
  `,
};

// CSS Animations
export const animations = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-20px) rotate(1deg); }
    66% { transform: translateY(-10px) rotate(-1deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideGradient {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }
`;