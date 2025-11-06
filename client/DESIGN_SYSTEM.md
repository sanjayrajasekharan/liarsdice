# Design System Documentation

This is a comprehensive design system for the Liar's Dice game that eliminates hardcoded pixel values and provides a scalable, maintainable CSS architecture.

## 🎨 Core Principles

1. **No hardcoded pixels** - Everything scales from base units
2. **Semantic naming** - Colors and sizes have meaningful names
3. **Consistent spacing** - Mathematical scale for harmony
4. **Responsive by default** - Mobile-first approach
5. **Dark mode ready** - Automatic theme switching

## 📏 Spacing System

All spacing uses a modular scale based on `1rem` (16px by default):

```css
/* Micro spacing */
--space-xs: 0.25rem;  /* 4px */
--space-sm: 0.5rem;   /* 8px */
--space-md: 0.75rem;  /* 12px */

/* Standard spacing */
--space-base: 1rem;     /* 16px */
--space-lg: 1.5rem;     /* 24px */
--space-xl: 2rem;       /* 32px */
--space-2xl: 2.5rem;    /* 40px */
--space-3xl: 3rem;      /* 48px */
--space-4xl: 4rem;      /* 64px */
--space-5xl: 6rem;      /* 96px */
```

### Usage Examples

```css
/* Instead of hardcoded pixels */
.old-way {
    padding: 16px 24px;
    margin: 8px;
}

/* Use design system tokens */
.new-way {
    padding: var(--space-base) var(--space-lg);
    margin: var(--space-sm);
}

/* Or use utility classes */
.utility-way {
    @apply p-base m-sm;
}
```

## 🎨 Color System

Semantic color palette that automatically adapts to light/dark mode:

### Brand Colors
```css
--color-primary-500: #ef4444;  /* Main brand red */
--color-primary-600: #dc2626;  /* Darker red */
--color-primary-700: #b91c1c;  /* Even darker */
```

### Surface Colors (Theme-aware)
```css
--surface-primary: /* White in light, dark gray in dark mode */
--surface-secondary: /* Light gray in light, darker in dark */
--surface-elevated: /* Pure white in light, elevated dark in dark */
```

### Text Colors (Theme-aware)
```css
--text-primary: /* Dark text in light, light text in dark */
--text-secondary: /* Medium contrast */
--text-tertiary: /* Low contrast */
```

### Usage Examples
```css
/* Theme-aware backgrounds */
.card {
    background: var(--surface-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border-light);
}

/* Brand colors */
.primary-button {
    background: var(--color-primary-500);
    color: var(--text-inverse);
}
```

## 📝 Typography System

Harmonious type scale using Major Third ratio (1.25):

```css
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
--text-2xl: 1.5rem;   /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem;  /* 36px */
--text-5xl: 3rem;     /* 48px */
--text-6xl: 3.75rem;  /* 60px */
```

### Font Families
```css
--font-primary: 'Crimson Text', serif;    /* Headings */
--font-secondary: Inter, system-ui, sans-serif; /* Body text */
--font-mono: 'SF Mono', Monaco, monospace; /* Code */
```

### Usage Examples
```css
h1 {
    font-family: var(--font-primary);
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    line-height: var(--leading-tight);
}

.body-text {
    font-family: var(--font-secondary);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
}
```

## 🔄 Border Radius System

Consistent corner rounding:

```css
--radius-xs: 0.125rem;  /* 2px */
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-3xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Perfect circle */
```

## 🌊 Shadow System

Layered shadows for depth:

```css
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

## ⚡ Animation System

Consistent timing and easing:

```css
/* Duration */
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;

/* Easing curves */
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Usage Examples
```css
.button {
    transition: all var(--duration-normal) var(--ease-out);
}

.button:hover {
    transform: translateY(calc(var(--space-xs) * -0.5));
    transition: all var(--duration-fast) var(--ease-back);
}
```

## 🎯 Component Examples

### Modern Button
```css
.button {
    padding: var(--space-md) var(--space-xl);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    border-radius: var(--radius-lg);
    border: none;
    cursor: pointer;
    transition: all var(--duration-normal) var(--ease-out);
    
    /* Primary variant */
    background: linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700));
    color: var(--text-inverse);
    box-shadow: var(--shadow-sm);
}

.button:hover {
    transform: translateY(calc(var(--space-xs) * -0.5));
    box-shadow: var(--shadow-lg);
}
```

### Modern Card
```css
.card {
    background: var(--surface-elevated);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    padding: var(--space-2xl);
    border: 1px solid var(--border-light);
    transition: box-shadow var(--duration-normal) var(--ease-out);
}

.card:hover {
    box-shadow: var(--shadow-xl);
}
```

### Form Input
```css
.input-field {
    padding: var(--space-md);
    font-size: var(--text-base);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-md);
    background-color: var(--surface-secondary);
    color: var(--text-primary);
    transition: all var(--duration-normal) var(--ease-out);
}

.input-field:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    background-color: var(--surface-elevated);
}
```

## 🔧 Utility Classes

Pre-built utility classes for rapid development:

### Spacing
```css
.p-lg { padding: var(--space-lg); }
.m-xl { margin: var(--space-xl); }
.gap-base { gap: var(--space-base); }
```

### Typography
```css
.text-2xl { font-size: var(--text-2xl); }
.font-bold { font-weight: var(--font-bold); }
.leading-tight { line-height: var(--leading-tight); }
```

### Layout
```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
```

### Colors
```css
.text-primary { color: var(--text-primary); }
.bg-surface-elevated { background: var(--surface-elevated); }
```

## 📱 Responsive Design

The system includes mobile-first responsive utilities:

```css
/* Mobile first approach */
.container {
    padding: var(--space-base);
}

/* Tablet and up */
@media (min-width: 640px) {
    .container {
        padding: var(--space-lg);
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .container {
        padding: var(--space-xl);
    }
}
```

## 🌙 Dark Mode

The system automatically adapts to user preferences:

```css
@media (prefers-color-scheme: dark) {
    :root {
        --surface-primary: var(--color-neutral-900);
        --text-primary: var(--color-neutral-100);
        /* Other dark mode overrides */
    }
}
```

## 🚀 Migration Guide

### From pixels to design system:

```css
/* Before */
.old-component {
    padding: 16px 24px;
    margin: 8px;
    font-size: 18px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: #ffffff;
    color: #000000;
}

/* After */
.new-component {
    padding: var(--space-base) var(--space-lg);
    margin: var(--space-sm);
    font-size: var(--text-lg);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    background: var(--surface-elevated);
    color: var(--text-primary);
}
```

## 🎯 Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use semantic color names** (`--text-primary` not `--color-black`)
3. **Follow the spacing scale** - don't create custom spacing
4. **Use utility classes** for simple styling
5. **Compose complex components** with design tokens
6. **Test in both light and dark mode**
7. **Ensure accessibility** with sufficient contrast ratios

## 🔄 Customization

To customize the design system, edit the root variables in `design-system.css`:

```css
:root {
    /* Customize base unit for global scaling */
    --space-unit: 1.2rem; /* Makes everything 20% larger */
    
    /* Customize brand colors */
    --color-primary-500: #3b82f6; /* Change to blue */
    
    /* Customize typography */
    --font-primary: 'Your Custom Font', serif;
}
```

This design system provides a solid foundation for creating beautiful, consistent, and maintainable user interfaces without relying on hardcoded pixel values.
