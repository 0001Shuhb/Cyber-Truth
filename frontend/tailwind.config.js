// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // content tells Tailwind which files to scan for class names
  // If a class isn't found here, it gets purged from the final CSS bundle
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  // darkMode: 'class' means dark mode is toggled by adding 'dark' class to <html>
  // This gives you manual control rather than following the OS preference
  darkMode: 'class',
  
  theme: {
    extend: {
      // Custom color palette for the cybersecurity theme
      // These become Tailwind classes: bg-cyber-dark, text-threat-red, etc.
      colors: {
        cyber: {
          dark:    '#050d1a',    // Near-black background
          darker:  '#030912',    // Even darker for cards
          surface: '#0a1628',    // Card backgrounds
          border:  '#1a2d4a',    // Subtle borders
          glow:    '#00d4ff',    // Cyan accent / glow color
        },
        threat: {
          safe:       '#00ff88',  // Green for safe
          suspicious: '#ffaa00',  // Amber for suspicious
          phishing:   '#ff3366',  // Red for phishing
          unknown:    '#8899aa',  // Gray for unscanned
        },
        neon: {
          blue:   '#00d4ff',
          green:  '#00ff88',
          red:    '#ff3366',
          amber:  '#ffaa00',
          purple: '#aa00ff',
        }
      },
      
      // Custom font families
      fontFamily: {
        // Mono font for data/code displays — gives the "terminal" feel
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        // Display font for headings — sharp and technical
        display: ['Rajdhani', 'Barlow Condensed', 'sans-serif'],
        // Body font for readable text
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Box shadows with glow effects
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-red':    '0 0 20px rgba(255, 51, 102, 0.3)',
        'glow-green':  '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-amber':  '0 0 20px rgba(255, 170, 0, 0.3)',
        'card':        '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover':  '0 8px 40px rgba(0, 212, 255, 0.15)',
      },
      
      // Custom animations
      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line':     'scanLine 2s linear infinite',
        'float':         'float 6s ease-in-out infinite',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
        'fade-in-up':    'fadeInUp 0.5s ease-out forwards',
        'spin-slow':     'spin 8s linear infinite',
      },
      
      keyframes: {
        scanLine: {
          '0%':   { top: '0%' },
          '100%': { top: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(0, 212, 255, 0.8)' },
        },
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      
      // Background gradients as utilities
      backgroundImage: {
        'cyber-grid': 
          'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        'hero-gradient':
          'radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(170,0,255,0.1) 0%, transparent 50%)',
        'card-gradient':
          'linear-gradient(135deg, rgba(10,22,40,0.9) 0%, rgba(3,9,18,0.95) 100%)',
      },
      
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  
  plugins: [],
}