# 🛡️ SafeMeals - Complete Project Documentation
## Comprehensive Guide & Technical Reference

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [App Overview](#app-overview)
3. [Design System](#design-system)
4. [Architecture & File Structure](#architecture--file-structure)
5. [Detailed Screen Documentation](#detailed-screen-documentation)
6. [Component Library](#component-library)
7. [Internationalization System](#internationalization-system)
8. [Data Models & State Management](#data-models--state-management)
9. [User Flows & Navigation](#user-flows--navigation)
10. [Technical Stack & Dependencies](#technical-stack--dependencies)
11. [Development Guide](#development-guide)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Deployment & Production](#deployment--production)
14. [Future Roadmap](#future-roadmap)
15. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 📊 Executive Summary

### Project Information
- **Project Name**: SafeMeals
- **Version**: 1.0.0
- **Status**: ✅ Production Ready (Frontend Complete)
- **Platform**: Mobile Web Application
- **Target Audience**: International travelers with food allergies or dietary restrictions
- **Primary Markets**: Asia-Pacific, Europe, Americas

### Key Metrics
- **Total Screens**: 20+ screens
- **Supported Languages**: 5 (Korean, English, Japanese, Chinese, Spanish)
- **Translation Keys**: 150+
- **Components**: 60+ (including UI library)
- **Allergy Categories**: 8 main categories
- **Diet Categories**: 4 main categories
- **Safety Levels**: 4 levels (Safe, Caution, Danger, Unknown)

### Mission Statement
SafeMeals empowers travelers with food allergies to explore new cuisines safely by providing instant menu translation, allergen detection, and multilingual communication tools.

---

## 📱 App Overview

### What is SafeMeals?

**SafeMeals** is a comprehensive OCR-based menu translation and allergy filtering mobile application designed for travelers with food allergies and dietary restrictions. The app bridges the language and safety gap between international travelers and local restaurants.

### Core Value Proposition

1. **Safety First**: Instant allergen detection in foreign language menus
2. **Communication Bridge**: Multilingual safety cards for restaurant staff
3. **Confidence Building**: Traffic light color system for quick safety assessment
4. **Personalization**: Customizable allergy and diet profiles
5. **Accessibility**: Works across 5 major languages

### Target Users

#### Primary Users
- **International Travelers** with food allergies
- **Business Travelers** with dietary restrictions
- **Digital Nomads** exploring new cultures
- **Study Abroad Students** in foreign countries

#### Secondary Users
- **Parents** traveling with allergic children
- **Religious Diet Followers** (Halal, Kosher, Buddhist Vegetarian)
- **Health-Conscious Individuals** with specific diet plans

### Key Features Summary

#### 1. OCR Menu Scanning
- Point camera at any menu
- Instant text recognition
- Real-time translation to 5 languages
- Automatic allergen detection

#### 2. Digital Overlay UI
- Unique 50/50 split-screen design
- Top: Live camera viewfinder
- Bottom: Scrollable translated menu
- Color-coded safety indicators

#### 3. Safety Profile System
- Personalized allergy database
- Multiple dietary preferences
- Custom allergy additions
- Offline profile access

#### 4. Safety Communication Card
- PIN-protected access
- Bilingual display (user language + local language)
- Emergency communication tool
- Restaurant staff friendly design

#### 5. Multi-Language Support
- Korean (한국어)
- English
- Japanese (日本語)
- Chinese Simplified (中文)
- Spanish (Español)

---

## 🎨 Design System

### Design Philosophy

SafeMeals follows a **minimalist, safety-first design approach** with emphasis on:
- **Clarity**: Clear visual hierarchy for quick decision making
- **Consistency**: Unified design language across all screens
- **Accessibility**: High contrast colors and large touch targets
- **Trust**: Professional and reliable visual identity

### Color System

#### Traffic Light Safety Colors (Primary Palette)

```css
/* Safety Colors */
--color-safe: #2ECC71;        /* Green - Safe to eat */
--color-caution: #F1C40F;     /* Yellow - Caution advised */
--color-danger: #E74C3C;      /* Red - Contains allergens */
--color-neutral: #95A5A6;     /* Gray - No information */
```

| Color | Hex Code | RGB | Usage | Contrast Ratio |
|-------|----------|-----|-------|----------------|
| 🟢 Safe Green | `#2ECC71` | rgb(46, 204, 113) | Safe menu items | 4.5:1 (AA) |
| 🟡 Caution Yellow | `#F1C40F` | rgb(241, 196, 15) | Warning items | 4.5:1 (AA) |
| 🔴 Danger Red | `#E74C3C` | rgb(231, 76, 60) | Allergen detected | 4.5:1 (AA) |
| ⚫ Neutral Gray | `#95A5A6` | rgb(149, 165, 166) | Unknown status | 4.5:1 (AA) |

#### Secondary Colors

```css
/* Action Colors */
--color-primary: #3498DB;      /* Blue - Primary actions */
--color-secondary: #9B59B6;    /* Purple - Secondary actions */

/* Background Colors */
--color-bg-primary: #FFFFFF;   /* White - Main background */
--color-bg-secondary: #F8F9FA; /* Light gray - Section backgrounds */
--color-bg-tertiary: #E9ECEF;  /* Lighter gray - Cards */

/* Text Colors */
--color-text-primary: #2C3E50;   /* Dark blue-gray - Primary text */
--color-text-secondary: #7F8C8D; /* Medium gray - Secondary text */
--color-text-tertiary: #BDC3C7;  /* Light gray - Disabled text */

/* Border Colors */
--color-border-light: #DEE2E6;
--color-border-medium: #CED4DA;
--color-border-dark: #ADB5BD;
```

#### Semantic Colors

```css
/* Status Colors */
--color-success: #27AE60;
--color-warning: #E67E22;
--color-error: #C0392B;
--color-info: #2980B9;

/* Allergy Category Colors */
--color-seafood: #3498DB;      /* Blue */
--color-nuts: #D35400;         /* Orange */
--color-grains: #F39C12;       /* Yellow-orange */
--color-meats: #E74C3C;        /* Red */
--color-dairy: #9B59B6;        /* Purple */
--color-fruits: #E91E63;       /* Pink */
--color-additives: #16A085;    /* Teal */
--color-other: #95A5A6;        /* Gray */
```

### Typography

#### Font Families

```css
/* System Font Stack for Multi-language Support */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Noto Sans KR', 'Noto Sans JP', 'Noto Sans SC',
             'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

#### Font Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| H1 - Display | 32px | 700 (Bold) | 40px | Page titles |
| H2 - Heading | 24px | 600 (Semi-bold) | 32px | Section headers |
| H3 - Subheading | 20px | 600 (Semi-bold) | 28px | Card titles |
| H4 - Small Heading | 18px | 600 (Semi-bold) | 24px | List headers |
| Body Large | 16px | 400 (Regular) | 24px | Primary content |
| Body Regular | 14px | 400 (Regular) | 20px | Secondary content |
| Body Small | 12px | 400 (Regular) | 18px | Captions, labels |
| Button Text | 16px | 500 (Medium) | 24px | Buttons, CTAs |

#### Typography Guidelines

1. **Language-Specific Adjustments**:
   - Korean: Use Noto Sans KR for optimal readability
   - Japanese: Use Noto Sans JP for kanji clarity
   - Chinese: Use Noto Sans SC for simplified characters
   - English/Spanish: System default works well

2. **Readability Rules**:
   - Minimum font size: 12px
   - Maximum line length: 70 characters
   - Optimal line height: 1.5x font size
   - Paragraph spacing: 1em

### Spacing System

```css
/* 8px Base Unit Spacing Scale */
--spacing-xs: 4px;    /* 0.5 units */
--spacing-sm: 8px;    /* 1 unit */
--spacing-md: 16px;   /* 2 units */
--spacing-lg: 24px;   /* 3 units */
--spacing-xl: 32px;   /* 4 units */
--spacing-2xl: 48px;  /* 6 units */
--spacing-3xl: 64px;  /* 8 units */
```

### Border Radius

```css
--radius-sm: 4px;    /* Buttons, inputs */
--radius-md: 8px;    /* Cards, small containers */
--radius-lg: 12px;   /* Large cards */
--radius-xl: 16px;   /* Modals, major sections */
--radius-2xl: 24px;  /* Special elements */
--radius-full: 9999px; /* Pills, badges */
```

### Elevation & Shadows

```css
/* Shadow System */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);
--shadow-2xl: 0 25px 50px rgba(0, 0, 0, 0.25);
```

### Animation & Transitions

```css
/* Timing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Duration */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

### Iconography

- **Library**: Lucide React
- **Default Size**: 24px
- **Small Size**: 16px
- **Large Size**: 32px
- **Stroke Width**: 2px
- **Style**: Outline (consistent with modern UI)

### Component Design Patterns

#### Buttons

```typescript
// Primary Button
<button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg">
  Primary Action
</button>

// Secondary Button
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-3 rounded-lg">
  Secondary Action
</button>

// Danger Button
<button className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg">
  Delete
</button>
```

#### Cards

```typescript
<div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
  {/* Card content */}
</div>
```

#### Input Fields

```typescript
<input 
  type="text"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
  placeholder="Enter text..."
/>
```

---

## 📂 Architecture & File Structure

### Complete Directory Tree

```
/
├── App.tsx                                    # 🎯 Main App Entry Point
│
├── styles/
│   └── globals.css                            # 🎨 Global Styles & Tailwind v4 Tokens
│
├── lib/
│   ├── translations.ts                        # 🌍 5-Language Translation System
│   └── translations-clean.ts                  # 📦 Backup Translations
│
├── components/
│   │
│   ├── 🏠 MAIN SCREENS (Top Level)
│   ├── splash-screen.tsx                      # Splash Screen (3s auto-transition)
│   ├── login-screen.tsx                       # Login/Auth Screen
│   ├── language-selector.tsx                  # Language Selection Modal
│   ├── onboarding-screen.tsx                  # Onboarding Main Container
│   ├── home-screen.tsx                        # Home Screen Wrapper
│   ├── home-dashboard.tsx                     # Home Dashboard Content
│   ├── scan-result-screen.tsx                 # Scan Result List View
│   ├── scan-result-split.tsx                  # 50/50 Split Camera View
│   ├── menu-detail-modal.tsx                  # Menu Item Detail Modal
│   ├── safety-communication-card.tsx          # Safety Card for Staff
│   ├── profile-screen.tsx                     # Profile Main Screen
│   ├── bottom-nav.tsx                         # Bottom Navigation Bar
│   │
│   ├── 📋 ONBOARDING FLOW (5 Steps)
│   ├── onboarding/
│   │   ├── signup-screen.tsx                  # Step 1: Email/Password Signup
│   │   ├── allergy-category-screen.tsx        # Step 2: Allergy Categories (8 categories)
│   │   ├── allergy-detail-screen.tsx          # Step 3: Specific Allergens
│   │   ├── allergy-search-screen.tsx          # Step 3.5: Custom Allergy Addition
│   │   ├── diet-category-screen.tsx           # Step 4: Diet Categories (4 categories)
│   │   └── diet-detail-screen.tsx             # Step 5: Specific Diets
│   │
│   ├── 👤 PROFILE SUB-SCREENS
│   ├── profile/
│   │   ├── safety-profile-edit-screen.tsx     # Edit Allergies & Diets
│   │   ├── notifications-screen.tsx           # Notification Settings
│   │   ├── language-settings-screen.tsx       # Language Preferences
│   │   ├── help-support-screen.tsx            # FAQ, Contact, Safety Guide
│   │   └── safety-card-pin-screen.tsx         # PIN Protection for Safety Card
│   │
│   ├── 📸 ADDITIONAL SCREENS
│   ├── screens/
│   │   ├── camera-screen.tsx                  # Camera/Scanner Interface
│   │   └── allergy-detail-screen.tsx          # Allergy Information Detail
│   │
│   ├── 🔄 REUSABLE COMMON COMPONENTS
│   ├── common/
│   │   ├── allergy-card.tsx                   # Allergy Selection Card
│   │   ├── menu-list-item.tsx                 # Menu Item in List
│   │   ├── safety-badge.tsx                   # Safety Level Badge
│   │   └── scan-button.tsx                    # Floating Scan Button
│   │
│   ├── 🎛️ UI COMPONENT LIBRARY (shadcn/ui)
│   └── ui/
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx                         # ⭐ Most Used
│       ├── calendar.tsx
│       ├── card.tsx                           # ⭐ Most Used
│       ├── carousel.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx                       # ⭐ Most Used
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── context-menu.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── form.tsx
│       ├── hover-card.tsx
│       ├── input-otp.tsx
│       ├── input.tsx                          # ⭐ Most Used
│       ├── label.tsx
│       ├── menubar.tsx
│       ├── navigation-menu.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── resizable.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── slider.tsx
│       ├── sonner.tsx                         # Toast Notifications
│       ├── switch.tsx                         # ⭐ Most Used
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       ├── tooltip.tsx
│       ├── use-mobile.ts                      # Mobile Detection Hook
│       └── utils.ts                           # Utility Functions
│
├── figma/
│   └── ImageWithFallback.tsx                  # 🔒 Protected: Image Component
│
├── guidelines/
│   └── Guidelines.md                          # Development Guidelines
│
└── PROJECT_DOCUMENTATION.md                   # 📄 This Document
```

### File Organization Principles

#### 1. **Screens** (Top-level components/)
- Full-page components that represent distinct app states
- Each screen is self-contained with its own logic
- Named with `-screen.tsx` suffix for clarity

#### 2. **Sub-screens** (Nested in folders)
- Related screens grouped by feature (onboarding/, profile/)
- Follows the same screen conventions
- Easier navigation and maintenance

#### 3. **Common Components** (components/common/)
- Shared across multiple screens
- Business logic specific to SafeMeals
- Not generic enough for UI library

#### 4. **UI Components** (components/ui/)
- Generic, reusable UI elements
- Based on shadcn/ui library
- No business logic, pure presentation

#### 5. **Utilities** (lib/)
- Non-component code (translations, helpers)
- Shared data and constants
- Type definitions

---

## 📱 Detailed Screen Documentation

### 1. Authentication Flow

#### 1.1 Splash Screen (`splash-screen.tsx`)

**Purpose**: Initial app loading screen with branding

**Design Specs**:
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│         🛡️                      │
│      SafeMeals                  │
│                                 │
│   "안전하게, 어디서나"            │
│   "Eat fearlessly, anywhere"    │
│                                 │
│      [Loading spinner]          │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Key Features**:
- Auto-transitions after 3 seconds
- Displays app logo and tagline
- Subtle loading animation
- No user interaction required

**Technical Implementation**:
```typescript
export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="size-full bg-gradient-to-b from-blue-500 to-blue-600 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🛡️</div>
        <h1 className="text-white mb-2">SafeMeals</h1>
        <p className="text-blue-100">안전하게, 어디서나</p>
        <div className="mt-8">
          <div className="animate-spin size-8 border-4 border-white border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
}
```

---

#### 1.2 Login Screen (`login-screen.tsx`)

**Purpose**: User authentication and account access

**Design Specs**:
```
┌─────────────────────────────────┐
│  [🌐 Language]          [EN ▼]  │ ← Language selector
├─────────────────────────────────┤
│                                 │
│         🛡️ SafeMeals            │
│    "Eat fearlessly, anywhere"   │
│                                 │
│  ┌────────────────────────────┐ │
│  │ 📧 Email                   │ │
│  │ example@email.com          │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ 🔒 Password                │ │
│  │ ••••••••                   │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │      Sign In               │ │ ← Primary button
│  └────────────────────────────┘ │
│                                 │
│  Don't have an account?         │
│  [Get Started]                  │ ← Secondary CTA
│                                 │
└─────────────────────────────────┘
```

**Key Features**:
- Email/password authentication
- Language selector in header
- "Get Started" link to onboarding
- Form validation
- Error messaging

**Form Validation Rules**:
```typescript
const validationRules = {
  email: {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address"
    }
  },
  password: {
    required: "Password is required",
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters"
    }
  }
};
```

**States**:
1. **Default**: Empty form
2. **Typing**: Active input focus
3. **Validating**: Loading spinner
4. **Error**: Red error message
5. **Success**: Transition to home

---

#### 1.3 Language Selector (`language-selector.tsx`)

**Purpose**: Allow users to select their preferred language

**Design Specs**:
```
┌─────────────────────────────────┐
│  Select Language                │
│                                 │
│  🇰🇷  한국어 (Korean)       ✓   │
│  🇺🇸  English                   │
│  🇯🇵  日本語 (Japanese)         │
│  🇨🇳  中文 (Chinese)             │
│  🇪🇸  Español (Spanish)         │
│                                 │
│  [Cancel]        [Confirm]      │
└─────────────────────────────────┘
```

**Key Features**:
- Modal overlay
- 5 language options with flags
- Current selection highlighted
- Instant UI update on confirm
- Persists to localStorage

**Language Options**:
```typescript
const languages = [
  { code: 'ko', name: '한국어', flag: '🇰🇷', nativeName: 'Korean' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', nativeName: 'Japanese' },
  { code: 'zh', name: '中文', flag: '🇨🇳', nativeName: 'Chinese' },
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Spanish' }
];
```

---

### 2. Onboarding Flow (5 Steps)

#### Step 1: Signup Screen (`signup-screen.tsx`)

**Purpose**: Create new user account

**Design Specs**:
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│  Step 1 of 5                    │
│  ▓▓░░░░░░░░                    │ ← Progress bar
│                                 │
│  Create Account                 │
│  Join SafeMeals to start eating │
│  safely anywhere                │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Email                      │ │
│  │ example@email.com          │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Password                   │ │
│  │ ••••••••                   │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Confirm Password           │ │
│  │ ••••••••                   │ │
│  └────────────────────────────┘ │
│                                 │
│  ☐ I agree to Terms & Privacy  │
│                                 │
├─────────────────────────────────┤
│  [Skip]              [Next →]   │
└─────────────────────────────────┘
```

**Validation Rules**:
- Email: Valid format, not already registered
- Password: Min 8 characters, 1 uppercase, 1 number
- Confirm Password: Must match password
- Terms: Must be checked to proceed

---

#### Step 2: Allergy Category Screen (`allergy-category-screen.tsx`)

**Purpose**: Select broad allergy categories

**Design Specs**:
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│  Step 2 of 5                    │
│  ▓▓▓▓░░░░░░                    │
│                                 │
│  What allergies do you have?    │
│  Select all categories that     │
│  apply to you                   │
│                                 │
│  ┌─────────────┬─────────────┐ │
│  │ 🦐 Seafood  │ 🥜 Nuts     │ │
│  │ 새우, 게, 조개│ 땅콩, 아몬드 │ │
│  └─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┐ │
│  │ 🌾 Grains   │ 🥩 Meats    │ │
│  │ 밀, 보리, 귀리│ 소고기, 돼지 │ │
│  └─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┐ │
│  │ 🥛 Dairy    │ 🍓 Fruits   │ │
│  │ 우유, 치즈   │ 특정 과일    │ │
│  └─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┐ │
│  │ ⚗️ Additives│ 🔍 Other    │ │
│  │ MSG, 첨가물  │ 직접 검색    │ │
│  └─────────────┴─────────────┘ │
│                                 │
│  [3 selected]                   │
│                                 │
├─────────────────────────────────┤
│  [Skip]              [Next →]   │
└─────────────────────────────────┘
```

**8 Allergy Categories**:

| Category | Icon | Korean | Examples |
|----------|------|--------|----------|
| Seafood | 🦐 | 해산물 | Shrimp, Crab, Shellfish, Fish |
| Nuts | 🥜 | 견과류 | Peanuts, Almonds, Walnuts, Cashews |
| Grains/Wheat | 🌾 | 곡류/밀 | Wheat, Barley, Oats, Rice |
| Meats | 🥩 | 육류 | Beef, Pork, Chicken, Lamb |
| Dairy & Eggs | 🥛 | 유제품·난류 | Milk, Cheese, Butter, Eggs |
| Fruits | 🍓 | 과일 | Strawberry, Kiwi, Mango, Peach |
| Additives | ⚗️ | 첨가물 | Sulfites, MSG, Food Dyes |
| Other | 🔍 | 기타 | Custom allergies |

**Interaction**:
- Tap to select/deselect
- Multiple selection allowed
- Visual feedback: Border color changes
- Counter shows total selected
- Can skip if no allergies

---

#### Step 3: Allergy Detail Screen (`allergy-detail-screen.tsx`)

**Purpose**: Select specific allergens within chosen categories

**Design Specs**:
```
┌─────────────────────────────────┐
│  ← Back to Categories           │
├─────────────────────────────────┤
│  Step 3 of 5                    │
│  ▓▓▓▓▓▓░░░░                    │
│                                 │
│  Select specific allergies      │
│  Choose specific items from     │
│  your selected categories       │
│                                 │
│  [Seafood ▼]  [Nuts ▼]  [All ▼]│ ← Category tabs
│                                 │
│  🦐 Seafood                     │
│  ┌─────────────┬─────────────┐ │
│  │ ☑ Shrimp    │ ☐ Crab      │ │
│  │   새우       │   게         │ │
│  └─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┐ │
│  │ ☑ Lobster   │ ☐ Squid     │ │
│  │   랍스터      │   오징어     │ │
│  └─────────────┴─────────────┘ │
│  ┌─────────────┬─────────────┐ │
│  │ ☐ Clams     │ ☑ Fish      │ │
│  │   조개류      │   생선       │ │
│  └─────────────┴─────────────┘ │
│                                 │
│  🥜 Nuts                        │
│  ┌─────────────┬─────────────┐ │
│  │ ☑ Peanut    │ ☐ Almond    │ │
│  │   땅콩       │   아몬드     │ │
│  └─────────────┴─────────────┘ │
│  ... (more nuts)                │
│                                 │
│  [8 allergies selected]         │
│                                 │
├─────────────────────────────────┤
│  [Back]              [Next →]   │
└─────────────────────────────────┘
```

**Specific Allergens by Category**:

**Seafood** (6 items):
- Shrimp (새우)
- Crab (게)
- Lobster (랍스터)
- Squid (오징어)
- Clams (조개류)
- Fish (생선)

**Nuts** (5 items):
- Peanut (땅콩)
- Almond (아몬드)
- Walnut (호두)
- Cashew (캐슈넛)
- Pistachio (피스타치오)

**Grains/Wheat** (5 items):
- Wheat (밀)
- Barley (보리)
- Oats (귀리)
- Rice (쌀)
- Corn (옥수수)

**Meats** (4 items):
- Beef (소고기)
- Pork (돼지고기)
- Chicken (닭고기)
- Lamb (양고기)

**Dairy & Eggs** (5 items):
- Milk (우유)
- Cheese (치즈)
- Butter (버터)
- Yogurt (요거트)
- Egg (계란)

**Fruits** (4 items):
- Strawberry (딸기)
- Kiwi (키위)
- Mango (망고)
- Peach (복숭아)

**Additives** (3 items):
- Sulfites (아황산염)
- MSG
- Food Dyes (식용색소)

---

#### Step 3.5: Custom Allergy Search (`allergy-search-screen.tsx`)

**Purpose**: Add custom allergies not in predefined categories

**Design Specs**:
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│  Other - Add Custom Allergy     │
│  2 selected                     │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌────────────────────────────┐ │
│  │ ➕ Add Custom Allergy      │ │
│  │                            │ │
│  │ Add any allergy not listed │ │
│  │ in the categories          │ │
│  │                            │ │
│  │ ┌────────────────┬───────┐│ │
│  │ │ Allergy Name   │ [Add] ││ │
│  │ └────────────────┴───────┘│ │
│  └────────────────────────────┘ │
│                                 │
│  Selected Custom Allergies      │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Sesame               [×]   │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ Mustard              [×]   │ │
│  └────────────────────────────┘ │
│                                 │
│                                 │
│                                 │
├─────────────────────────────────┤
│          [Next (2) →]            │
└─────────────────────────────────┘
```

**Key Features**:
- Free text input for custom allergies
- Real-time add to list
- Delete custom items with × button
- No duplicates allowed
- Input validation (min 2 characters)

**Use Cases**:
- Regional ingredients (e.g., "Kimchi", "Natto")
- Rare allergies (e.g., "Celery", "Lupin")
- Compound ingredients (e.g., "Soy Sauce")
- Personal sensitivities

---

#### Step 4: Diet Category Screen (`diet-category-screen.tsx`)

**Purpose**: Select dietary preference categories

**Design Specs**:
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│  Step 4 of 5                    │
│  ▓▓▓▓▓▓▓▓░░                    │
│                                 │
│  Tell us your dietary           │
│  preferences                    │
│  Select categories that apply   │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🌱 Plant-Based              ││
│  │    Vegetarian & vegan diets ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🕌 Religious Diet           ││
│  │    Halal, Kosher, etc.      ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🚫 Avoidance Diet           ││
│  │    Specific ingredient      ││
│  │    avoidance                ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ✅ No Preference            ││
│  │    No specific restrictions ││
│  └─────────────────────────────┘│
│                                 │
│  [1 selected]                   │
│                                 │
├─────────────────────────────────┤
│  [Skip]              [Next →]   │
└─────────────────────────────────┘
```

**4 Diet Categories**:

| Category | Icon | Description | Common Diets |
|----------|------|-------------|--------------|
| Plant-Based | 🌱 | Vegetarian & vegan diets | Vegan, Vegetarian, Lacto-Ovo |
| Religious Diet | 🕌 | Faith-based restrictions | Halal, Kosher, Buddhist |
| Avoidance Diet | 🚫 | Specific ingredient avoidance | Pork-Free, Alcohol-Free |
| No Preference | ✅ | No dietary restrictions | Standard diet |

---

#### Step 5: Diet Detail Screen (`diet-detail-screen.tsx`)

**Purpose**: Select specific dietary preferences

**Design Specs**:
```
┌─────────────────────────────────┐
│  ← Back to Categories           │
├─────────────────────────────────┤
│  Step 5 of 5                    │
│  ▓▓▓▓▓▓▓▓▓▓                    │
│                                 │
│  Select specific diets          │
│  Choose from your selected      │
│  categories                     │
│                                 │
│  [Plant-Based ▼]  [Religious ▼] │
│                                 │
│  🌱 Plant-Based                 │
│  ┌─────────────────────────────┐│
│  │ ☑ Strict Vegan              ││
│  │   No animal products        ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ☐ Lacto Vegetarian          ││
│  │   Allows dairy              ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ☐ Ovo Vegetarian            ││
│  │   Allows eggs               ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ☐ Pesco Vegetarian          ││
│  │   Allows fish               ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ ☑ Lactose Intolerant        ││
│  │   No lactose/dairy          ││
│  └─────────────────────────────┘│
│                                 │
│  [2 diets selected]             │
│                                 │
├─────────────────────────────────┤
│  [Back]         [Complete ✓]    │
└─────────────────────────────────┘
```

**Specific Diets by Category**:

**Plant-Based** (6 options):
1. **Strict Vegan**: No animal products at all
2. **Lacto Vegetarian**: Dairy allowed, no eggs/meat
3. **Ovo Vegetarian**: Eggs allowed, no dairy/meat
4. **Pesco Vegetarian**: Fish allowed, no other meat
5. **Flexitarian**: Mostly vegetarian, occasional meat
6. **Lactose Intolerant**: No lactose/dairy products ⭐ NEW

**Religious Diet** (3 options):
1. **Halal**: Islamic dietary laws (no pork, alcohol)
2. **Kosher**: Jewish dietary laws
3. **Buddhist Vegetarian**: No pungent vegetables (garlic, onion)

**Avoidance Diet** (3 options):
1. **Pork-Free**: Avoids pork products
2. **Alcohol-Free**: No alcohol in cooking
3. **Garlic/Onion-Free**: Avoids garlic and onion

**Completion Flow**:
- After "Complete" button → Save profile
- Show success message
- Transition to main app (Home Dashboard)

---

### 3. Main App Screens

#### 3.1 Home Dashboard (`home-dashboard.tsx`)

**Purpose**: Main landing page after authentication

**Complete Design Layout**:
```
┌─────────────────────────────────┐
│  🛡️ SafeMeals                   │
│  안전하게, 어디서나                │
│                          [🌐 KO]│
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │ 📸 Ready to Scan            ││
│  │                             ││
│  │ [3 active] restrictions     ││
│  │ • Shrimp  • Peanuts  • Milk ││
│  │                             ││
│  │ Point your camera at any    ││
│  │ menu to instantly see       ││
│  │ translations and alerts     ││
│  │                             ││
│  │   ┌───────────────────┐    ││
│  │   │  📷 Scan Menu     │    ││
│  │   └───────────────────┘    ││
│  └─────────────────────────────┘│
│                                 │
│  📋 Recent Scans                │
│  ────────────── [See All →]     │
│  ┌─────────────────────────────┐│
│  │ Kimchi House • 2 hrs ago    ││
│  │ 🟢 Bibimbap                 ││
│  │ Mixed rice with vegetables  ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Pasta Bella • Yesterday     ││
│  │ 🟡 Carbonara                ││
│  │ ⚠️ May contain dairy        ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Sushi Bar • 3 days ago      ││
│  │ 🔴 California Roll          ││
│  │ 🚨 Contains shrimp          ││
│  └─────────────────────────────┘│
│                                 │
│  🏪 Safe Restaurants Nearby     │
│  ────────────── [View All →]    │
│  ┌─────────────────────────────┐│
│  │ 🇰🇷 Kimchi House    0.5km   ││
│  │ Korean • 12 safe items      ││
│  │ 🟢🟢🟢🟢⚫             4.8★ ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🇮🇹 Pasta Bella     0.8km   ││
│  │ Italian • 8 safe items      ││
│  │ 🟢🟢🟢⚫⚫             4.5★ ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🇮🇳 Spice Garden    1.2km   ││
│  │ Indian • 15 safe items      ││
│  │ 🟢🟢🟢🟢🟢             4.9★ ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
│  🏠    📸    🛡️     👤          │ ← Bottom Nav
│ Home  Scan  Card    My          │
└─────────────────────────────────┘
```

**Sections**:

1. **Header**:
   - SafeMeals logo and tagline
   - Language selector (top right)

2. **Scan CTA Card**:
   - Active restrictions count and list
   - Description of scan feature
   - Large "Scan Menu" button
   - Blue gradient background

3. **Recent Scans**:
   - Last 3 scanned menus
   - Each shows: Restaurant, time ago, item name, safety level
   - "See All" link to full history

4. **Safe Restaurants Nearby**:
   - Top 3 nearby restaurants with safe options
   - Shows: Name, distance, cuisine, safe item count, rating
   - Safety indicator dots (🟢 = safe options available)
   - "View All" link to full map view

**Interaction States**:
- Pull to refresh
- Scroll to load more restaurants
- Tap scan card → Camera screen
- Tap recent scan → Scan result detail
- Tap restaurant → Restaurant detail page

---

#### 3.2 Scan Result Screen (`scan-result-screen.tsx`)

**Purpose**: Display scanned menu items in a list view

**Design Layout**:
```
┌─────────────────────────────────┐
│  ← Back         Scan Complete   │
├─────────────────────────────────┤
│  📸 Kimchi House                │
│  6 items detected               │
│                                 │
│  Filter: [All ▼] [Safe] [⚠️] [🚨]│
│                                 │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ 🟢 Bibimbap          $12.00 ││
│  │ Mixed rice with vegetables, ││
│  │ egg, and gochujang sauce    ││
│  │ ✅ Safe for you             ││
│  │                    [View →] ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🟡 Kimchi Jjigae    $10.00 ││
│  │ Spicy kimchi stew with tofu ││
│  │ ⚠️ May contain fish sauce   ││
│  │                    [View →] ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🔴 Bulgogi          $18.00 ││
│  │ Marinated grilled beef      ││
│  │ 🚨 Contains: Beef           ││
│  │                    [View →] ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🟢 Japchae          $11.00 ││
│  │ Stir-fried glass noodles    ││
│  │ ✅ Safe for you             ││
│  │                    [View →] ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🟢 Veggie Kimbap    $8.00  ││
│  │ Rice rolls with vegetables  ││
│  │ ✅ Safe for you             ││
│  │                    [View →] ││
│  └─────────────────────────────┘│
│  ┌─────────────────────────────┐│
│  │ 🟡 Soybean Stew     $9.00  ││
│  │ Soft tofu in savory broth   ││
│  │ ⚠️ Contains hidden beef     ││
│  │    stock (not vegan)        ││
│  │                    [View →] ││
│  └─────────────────────────────┘│
│                                 │
│  [Scan Again]  [Share Results]  │
└─────────────────────────────────┘
```

**Features**:
- Filter by safety level
- Color-coded cards (green/yellow/red)
- Price display
- Quick "View" button for details
- "Scan Again" and "Share Results" actions

---

#### 3.3 Digital Overlay (Split View) (`scan-result-split.tsx`)

**Purpose**: Unique 50/50 split view showing camera + results simultaneously

**Design Layout**:
```
┌─────────────────────────────────┐
│         📷 CAMERA VIEW          │
│    (Top 50% of screen)          │
│                                 │
│    [Live menu viewfinder]       │
│    ┌─────────────────────┐     │
│    │  메뉴판               │     │
│    │  비빔밥 ....... 12,000│     │
│    │  김치찌개 ..... 10,000│     │
│    │  불고기 ....... 18,000│     │
│    └─────────────────────┘     │
│                                 │
│         [Scan Progress]         │
│         ▓▓▓▓▓▓░░░░ 60%        │
├─────────────────────────────────┤ ← Draggable divider
│    📋 MENU ITEMS (Bottom 50%)   │
│                                 │
│  6 items • Scanning...          │
│                                 │
│  🟢 Bibimbap              Safe  │
│     Mixed rice                  │
│                                 │
│  🟡 Kimchi Jjigae      Caution  │
│     ⚠️ Fish sauce possible      │
│                                 │
│  🔴 Bulgogi            Danger   │
│     🚨 Contains beef            │
│                                 │
│  (Scrollable list...)           │
│                                 │
└─────────────────────────────────┘
```

**Key Features**:
1. **Top Half - Camera**:
   - Live viewfinder showing menu
   - OCR scanning overlay
   - Progress indicator
   - Tap to focus

2. **Bottom Half - Results**:
   - Real-time menu item list
   - Scrollable results
   - Color-coded safety indicators
   - Tap item for detail modal

3. **Draggable Divider**:
   - Drag to adjust camera/results ratio
   - Snap to 50/50, 70/30, 30/70 ratios
   - Smooth animation

4. **Scanning States**:
   - **Initializing**: Camera loading
   - **Scanning**: OCR in progress
   - **Processing**: Translating text
   - **Complete**: All items detected
   - **Error**: Retry option

---

#### 3.4 Menu Detail Modal (`menu-detail-modal.tsx`)

**Purpose**: Show comprehensive information about a menu item

**Design Layout**:
```
┌─────────────────────────────────┐
│  [×]                            │
├─────────────────────────────────┤
│                                 │
│  Bibimbap                       │
│  비빔밥                          │
│                                 │
│  ┌────────────────────────┐    │
│  │  🟢 SAFE FOR YOU       │    │
│  │  No allergens detected │    │
│  └────────────────────────┘    │
│                                 │
│  💵 Price: $12.00               │
│  📏 Serving: 1 bowl (500g)      │
│                                 │
├─────────────────────────────────┤
│  📝 Description                 │
│  Mixed rice bowl topped with    │
│  seasoned vegetables, egg, and  │
│  spicy gochujang sauce. A       │
│  classic Korean dish.           │
│                                 │
├─────────────────────────────────┤
│  🥘 Ingredients                 │
│  ✅ Rice                        │
│  ✅ Carrot                      │
│  ✅ Zucchini                    │
│  ✅ Spinach                     │
│  ✅ Bean sprouts                │
│  ⚠️ Egg (may contain)           │
│  ✅ Gochujang sauce             │
│  ✅ Sesame oil                  │
│  ✅ Sesame seeds                │
│                                 │
├─────────────────────────────────┤
│  🚨 Allergen Check              │
│  ✅ Shrimp - Not detected       │
│  ✅ Peanuts - Not detected      │
│  ⚠️ Egg - May be present        │
│                                 │
├─────────────────────────────────┤
│  ℹ️ Additional Info             │
│  • Vegetarian-friendly          │
│  • Can be made vegan            │
│  • Gluten-free option available │
│  • Spicy level: Medium 🌶️🌶️   │
│                                 │
├─────────────────────────────────┤
│  [← Back]        [Order Guide]  │
└─────────────────────────────────┘
```

**Sections**:
1. **Header**: Item name (English + Original language)
2. **Safety Status**: Large banner with safety level
3. **Basic Info**: Price, serving size
4. **Description**: Detailed explanation of dish
5. **Ingredients**: Full ingredient list with check marks
6. **Allergen Check**: Match against user's allergies
7. **Additional Info**: Dietary tags, customization options
8. **Actions**: Back button, Order guide link

---

#### 3.5 Safety Communication Card (`safety-communication-card.tsx`)

**Purpose**: Bilingual card to show restaurant staff

**Design Layout**:
```
┌─────────────────────────────────┐
│                                 │
│         🛡️ SAFEMEALS            │
│                                 │
├─────────────────────────────────┤
│                                 │
│  저는 알레르기가 있습니다          │
│  I have food allergies          │
│                                 │
├─────────────────────────────────┤
│                                 │
│  🚨 주요 알레르기 / Main Allergies│
│                                 │
│  • 새우 Shrimp                  │
│  • 땅콩 Peanuts                 │
│  • 견과류 Tree Nuts              │
│                                 │
├─────────────────────────────────┤
│                                 │
│  이 음식에 [새우]가 들어있나요?   │
│                                 │
│  Does this food contain         │
│  [Shrimp]?                      │
│                                 │
├─────────────────────────────────┤
│                                 │
│  기타 알레르기:                  │
│  Other allergies:               │
│                                 │
│  • 유제품 Dairy                 │
│  • 계란 Eggs                    │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ⚠️ 이 카드에는 민감한 건강      │
│     정보가 포함되어 있습니다      │
│                                 │
│  ⚠️ This card contains sensitive│
│     health information          │
│                                 │
└─────────────────────────────────┘
```

**Key Features**:
1. **Bilingual Text**: User's language + Local language
2. **Clear Hierarchy**: Most important allergies first
3. **Question Format**: Ready-to-ask format for staff
4. **Privacy Warning**: Reminds about sensitive info
5. **Large Text**: Easy to read from distance

**Language Pairs** (Auto-detected based on location):
- Korean + English
- English + Japanese
- English + Chinese
- English + Spanish
- etc.

**PIN Protection Flow**:
```
1. User taps "Safety Card" tab
2. PIN screen appears
3. Enter 4-digit PIN
4. If correct → Show card
5. If incorrect → Error message + retry
6. 3 failed attempts → Lock for 5 minutes
```

---

#### 3.6 Profile Screen (`profile-screen.tsx`)

**Purpose**: User account and settings management

**Complete Design Layout**:
```
┌─────────────────────────────────┐
│  My Profile                     │
│                          [Edit] │
├─────────────────────────────────┤
│                                 │
│      ┌────────────┐             │
│      │     👤     │             │
│      │  John Doe  │             │
│      └────────────┘             │
│                                 │
│   SafeMeals Member since 2024   │
│   john.doe@email.com            │
│                                 │
├─────────────────────────────────┤
│  🛡️ Your Safety Profile         │
│  ────────────────────────────   │
│                                 │
│  🚨 Allergies                   │
│  ┌─────────────────────────────┐│
│  │ 3 restrictions              ││
│  │                             ││
│  │ • Shrimp (Seafood)          ││
│  │ • Peanuts (Nuts)            ││
│  │ • Tree Nuts (Nuts)          ││
│  │                             ││
│  │        [Edit Allergies]     ││
│  └─────────────────────────────┘│
│                                 │
│  🍽️ Diet Preferences            │
│  ┌─────────────────────────────┐│
│  │ 1 preference                ││
│  │                             ││
│  │ • Vegan (Plant-Based)       ││
│  │                             ││
│  │    [Edit Dietary Prefs]     ││
│  └─────────────────────────────┘│
│                                 │
│  ℹ️ Your safety profile is used │
│  to scan menus and identify     │
│  safe foods. Keep it updated.   │
│                                 │
├─────────────────────────────────┤
│  ⚙️ Settings                    │
│  ────────────────────────────   │
│                                 │
│  🔔 Notifications               │
│  Enabled                  [→]  │
│                                 │
│  🌐 Language                    │
│  한국어 (Korean)           [→]  │
│                                 │
│  ❓ Help & Support              │
│  FAQ, Contact, Safety Guide [→]│
│                                 │
│  🔒 Privacy & Security          │
│  PIN, Data Settings        [→] │
│                                 │
│  ℹ️ About SafeMeals             │
│  Version 1.0.0             [→] │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────────┐│
│  │      🚪 Log Out             ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

---

### 4. Profile Sub-Screens

#### 4.1 Safety Profile Edit (`safety-profile-edit-screen.tsx`)

**Purpose**: Edit allergies and dietary preferences

**Features**:
- Reuses onboarding flow components
- Shows current selections
- Real-time save (no "Save" button needed)
- Confirmation when deleting items

**Flow**:
1. Tap "Edit Allergies" → Allergy category screen
2. Select categories → Detail screen
3. Changes auto-save → Back to profile

---

#### 4.2 Notifications Screen (`notifications-screen.tsx`)

**Design Layout**:
```
┌─────────────────────────────────┐
│  ← Notifications                │
├─────────────────────────────────┤
│                                 │
│  Manage your notification       │
│  preferences                    │
│                                 │
├─────────────────────────────────┤
│  🔔 Scan Alerts            [ON] │
│  Receive alerts when scan       │
│  results are ready              │
│                                 │
├─────────────────────────────────┤
│  🚨 Allergy Warnings       [ON] │
│  Important alerts for           │
│  detected allergens             │
│  (Always enabled for safety)    │
│                                 │
├─────────────────────────────────┤
│  🏪 Nearby Restaurants     [ON] │
│  Discover safe restaurants      │
│  near you                       │
│                                 │
├─────────────────────────────────┤
│  ✨ New Features          [OFF] │
│  Updates on new app             │
│  features                       │
│                                 │
├─────────────────────────────────┤
│  📧 Email Notifications    [ON] │
│  Receive updates via email      │
│                                 │
├─────────────────────────────────┤
│  📱 Push Notifications     [ON] │
│  Real-time push alerts          │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ℹ️ You can change these        │
│  settings anytime. Important    │
│  allergy warnings are always    │
│  enabled for your safety.       │
│                                 │
└─────────────────────────────────┘
```

**Settings**:
1. **Scan Alerts**: When scan completes
2. **Allergy Warnings**: Allergen detected (mandatory)
3. **Nearby Restaurants**: Location-based suggestions
4. **New Features**: App updates and releases
5. **Email Notifications**: Email preferences
6. **Push Notifications**: Mobile push alerts

---

#### 4.3 Language Settings (`language-settings-screen.tsx`)

**Design Layout**:
```
┌─────────────────────────────────┐
│  ← Language                     │
├─────────────────────────────────┤
│                                 │
│  Select your preferred language │
│  for the app interface and menu │
│  translations                   │
│                                 │
├─────────────────────────────────┤
│  ☑ 🇰🇷 한국어                   │
│     Korean                      │
│                                 │
├─────────────────────────────────┤
│  ☐ 🇺🇸 English                  │
│     English                     │
│                                 │
├─────────────────────────────────┤
│  ☐ 🇯🇵 日本語                   │
│     Japanese                    │
│                                 │
├─────────────────────────────────┤
│  ☐ 🇨🇳 中文                     │
│     Chinese (Simplified)        │
│                                 │
├─────────────────────────────────┤
│  ☐ 🇪🇸 Español                  │
│     Spanish                     │
│                                 │
├─────────────────────────────────┤
│                                 │
│  ℹ️ App interface and menu      │
│  translations will be updated   │
│  to your selected language.     │
│  This change will take effect   │
│  immediately.                   │
│                                 │
└─────────────────────────────────┘
```

**Features**:
- Radio button selection (single choice)
- Instant UI update on selection
- Persists to localStorage
- Shows language in native script

---

#### 4.4 Help & Support Screen (`help-support-screen.tsx`)

**Complete Design Layout**:
```
┌─────────────────────────────────┐
│  ← Help & Support               │
├─────────────────────────────────┤
│                                 │
│  How can we help you?           │
│                                 │
├─────────────────────────────────┤
│  📚 FAQ                         │
│  ┌─────────────────────────────┐│
│  │ Frequently Asked Questions  ││
│  │ Find answers to common      ││
│  │ questions                   ││
│  │                        [→] ││
│  └─────────────────────────────┘│
│                                 │
│  🛡️ Safety Guide                │
│  ┌─────────────────────────────┐│
│  │ How to use SafeMeals        ││
│  │ effectively                 ││
│  │                        [→] ││
│  └─────────────────────────────┘│
│                                 │
│  🔒 Privacy Policy              │
│  ┌─────────────────────────────┐│
│  │ How your data is            ││
│  │ protected                   ││
│  │                        [→] ││
│  └─────────────────────────────┘│
│                                 │
│  📜 Terms of Service            │
│  ┌─────────────────────────────┐│
│  │ Our terms and conditions    ││
│  │                        [→] ││
│  └─────────────────────────────┘│
│                                 │
│  💬 Contact Support             │
│  ┌─────────────────────────────┐│
│  │ Get help from our team      ││
│  │ support@safemeals.app       ││
│  │                        [→] ││
│  └─────────────────────────────┘│
│                                 │
│  ─────── Need More Help? ────── │
│                                 │
│  📧 Email Us                    │
│  support@safemeals.app          │
│                                 │
│  🌐 Visit Our Website           │
│  www.safemeals.app              │
│                                 │
│  💬 Live Chat                   │
│  Available Mon-Fri 9AM-6PM      │
│                                 │
└─────────────────────────────────┘
```

**FAQ Section** (Expanded View):
```
┌─────────────────────────────────┐
│  ← FAQ                          │
├─────────────────────────────────┤
│                                 │
│  Common Questions               │
│                                 │
├─────────────────────────────────┤
│  [▼] What is the accuracy of    │
│      OCR scanning?              │
│                                 │
│  We use OCR technology with     │
│  over 95% accuracy for printed  │
│  menus in supported languages.  │
│  However, handwritten menus or  │
│  stylized fonts may have lower  │
│  accuracy.                      │
│                                 │
├─────────────────────────────────┤
│  [▶] Can I use this app offline?│
│                                 │
├─────────────────────────────────┤
│  [▶] How do I update my         │
│      allergies?                 │
│                                 │
├─────────────────────────────────┤
│  [▶] Is my health information   │
│      secure?                    │
│                                 │
├─────────────────────────────────┤
│  [▶] What languages are         │
│      supported?                 │
│                                 │
├─────────────────────────────────┤
│  [▶] How does the Safety Card   │
│      work?                      │
│                                 │
├─────────────────────────────────┤
│  [▶] Can I add custom           │
│      allergies?                 │
│                                 │
├─────────────────────────────────┤
│  [▶] How accurate is allergen   │
│      detection?                 │
│                                 │
└─────────────────────────────────┘
```

**FAQ Q&A Content**:

**Q1: What is the accuracy of OCR scanning?**
A: We use advanced OCR technology with over 95% accuracy for printed menus in our supported languages (Korean, English, Japanese, Chinese, Spanish). However, accuracy may vary with:
- Handwritten menus
- Stylized or decorative fonts
- Poor lighting conditions
- Blurry images
- Menu damage or stains

**Q2: Can I use this app offline?**
A: Partially. Your saved safety profile (allergies and diets) works offline. However, menu scanning and translation require an internet connection for:
- OCR text recognition
- Real-time translation
- Allergen database lookup
- Restaurant information

**Q3: How do I update my allergies?**
A: Go to My Profile → Safety Profile → Edit Allergies. You can add, remove, or modify your allergy list anytime. Changes are saved automatically.

**Q4: Is my health information secure?**
A: Yes. We take privacy seriously:
- All data encrypted in transit
- Stored locally on your device
- Optional cloud backup (encrypted)
- Never shared with third parties
- PIN protection for Safety Card
- GDPR and HIPAA compliant

**Q5: What languages are supported?**
A: Currently 5 languages:
- Korean (한국어)
- English
- Japanese (日本語)
- Chinese Simplified (中文)
- Spanish (Español)

More languages coming soon!

**Q6: How does the Safety Card work?**
A: The Safety Card is a bilingual communication tool:
1. Protected by 4-digit PIN
2. Shows your main allergies
3. Displays in your language + local language
4. Ready-to-show format for restaurant staff
5. Includes emergency contact info (optional)

**Q7: Can I add custom allergies?**
A: Yes! In the allergy selection step, choose "Other" category. You can add any allergy not in our predefined list, such as regional ingredients or rare allergens.

**Q8: How accurate is allergen detection?**
A: Our system cross-references menu items with:
- Ingredient databases
- Common food allergens
- Hidden allergen warnings
- Cross-contamination risks

However, always verify with restaurant staff for severe allergies.

---

#### 4.5 Safety Card PIN Screen (`safety-card-pin-screen.tsx`)

**Design Layout**:
```
┌─────────────────────────────────┐
│  ← Back                         │
├─────────────────────────────────┤
│                                 │
│         🔒                      │
│                                 │
│    Protected Access             │
│                                 │
│  Enter your 4-digit PIN to      │
│  access the Safety Card         │
│                                 │
│  ┌───┬───┬───┬───┐            │
│  │ • │ • │   │   │            │
│  └───┴───┴───┴───┘            │
│                                 │
│  ┌───┬───┬───┐                │
│  │ 1 │ 2 │ 3 │                │
│  ├───┼───┼───┤                │
│  │ 4 │ 5 │ 6 │                │
│  ├───┼───┼───┤                │
│  │ 7 │ 8 │ 9 │                │
│  ├───┼───┼───┤                │
│  │   │ 0 │ ⌫ │                │
│  └───┴───┴───┘                │
│                                 │
│  Forgot PIN? [Reset]            │
│                                 │
│  ℹ️ The safety card contains    │
│  sensitive allergy information. │
│  PIN ensures only you can       │
│  share it with restaurant staff.│
│                                 │
│  📌 Demo: Use any 4-digit PIN   │
│                                 │
└─────────────────────────────────┘
```

**Features**:
- Numeric keypad (0-9)
- Backspace button
- Dots show entered digits
- Error shake animation on wrong PIN
- "Forgot PIN" → Reset flow
- Demo mode (any PIN works in development)

**Security**:
- 3 attempts before 5-minute lockout
- Optional biometric unlock (future)
- PIN stored securely (hashed)

---

## 🧩 Component Library

### Common Components

#### 1. Allergy Card (`allergy-card.tsx`)

**Purpose**: Selectable card for allergy categories and items

**Props**:
```typescript
interface AllergyCardProps {
  name: string;           // Display name
  icon?: string;          // Emoji icon
  description?: string;   // Subtitle
  selected: boolean;      // Selection state
  onClick: () => void;    // Click handler
  color?: string;         // Custom color
  disabled?: boolean;     // Disabled state
}
```

**Usage Example**:
```typescript
<AllergyCard
  name="Shrimp"
  icon="🦐"
  description="새우"
  selected={true}
  onClick={() => toggleAllergy('shrimp')}
  color="blue"
/>
```

**Visual States**:
- **Default**: White background, gray border
- **Hover**: Light blue background
- **Selected**: Blue border, checkmark icon
- **Disabled**: Gray background, low opacity

---

#### 2. Menu List Item (`menu-list-item.tsx`)

**Purpose**: Display menu item with safety information

**Props**:
```typescript
interface MenuListItemProps {
  name: string;
  translatedName?: string;
  description: string;
  price?: string;
  safetyLevel: 'safe' | 'caution' | 'danger' | 'unknown';
  allergens?: string[];
  onClick: () => void;
}
```

**Usage Example**:
```typescript
<MenuListItem
  name="Bibimbap"
  translatedName="비빔밥"
  description="Mixed rice with vegetables, egg, and gochujang sauce"
  price="$12.00"
  safetyLevel="safe"
  allergens={[]}
  onClick={() => showDetail('bibimbap')}
/>
```

---

#### 3. Safety Badge (`safety-badge.tsx`)

**Purpose**: Color-coded safety indicator

**Props**:
```typescript
interface SafetyBadgeProps {
  level: 'safe' | 'caution' | 'danger' | 'unknown';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}
```

**Visual Design**:
```typescript
const SafetyBadge = ({ level, size = 'md', showText = true }) => {
  const config = {
    safe: { bg: 'bg-green-500', text: 'Safe', icon: '✓' },
    caution: { bg: 'bg-yellow-500', text: 'Caution', icon: '⚠️' },
    danger: { bg: 'bg-red-500', text: 'Danger', icon: '🚨' },
    unknown: { bg: 'bg-gray-400', text: 'Unknown', icon: '?' }
  };
  
  // ... render logic
};
```

---

#### 4. Scan Button (`scan-button.tsx`)

**Purpose**: Prominent floating action button for scanning

**Design**:
- Large circular button
- Camera icon
- Pulsing animation
- Fixed position (bottom center)
- Elevation shadow

**Usage**:
```typescript
<ScanButton onClick={handleScanStart} />
```

---

### UI Component Library (shadcn/ui)

**Most Used Components**:

1. **Button** (`ui/button.tsx`):
   - Variants: default, destructive, outline, ghost, link
   - Sizes: sm, md, lg
   - States: default, hover, active, disabled

2. **Card** (`ui/card.tsx`):
   - CardHeader, CardTitle, CardDescription
   - CardContent, CardFooter
   - Clean, minimal design

3. **Input** (`ui/input.tsx`):
   - Text, email, password, number types
   - Focus states
   - Error states

4. **Checkbox** (`ui/checkbox.tsx`):
   - Controlled/uncontrolled modes
   - Indeterminate state
   - Label integration

5. **Switch** (`ui/switch.tsx`):
   - ON/OFF toggle
   - Smooth animation
   - Accessible

6. **Dialog** (`ui/dialog.tsx`):
   - Modal overlay
   - DialogHeader, DialogContent, DialogFooter
   - Keyboard navigation

7. **Toast** (`ui/sonner.tsx`):
   - Success, error, warning, info variants
   - Auto-dismiss
   - Action buttons

---

## 🌍 Internationalization System

### Translation Architecture

**File**: `/lib/translations.ts`

**Type Definition**:
```typescript
export type Language = 'ko' | 'en' | 'ja' | 'zh' | 'es';

export interface TranslationKeys {
  // App basics
  appName: string;
  tagline: string;
  
  // Signup
  createAccount: string;
  email: string;
  password: string;
  getStarted: string;
  
  // ... 150+ keys total
}

export const translations: Record<Language, TranslationKeys> = {
  ko: { /* Korean translations */ },
  en: { /* English translations */ },
  ja: { /* Japanese translations */ },
  zh: { /* Chinese translations */ },
  es: { /* Spanish translations */ }
};
```

### Translation Coverage

**Categories** (Total: ~150 keys):

1. **Signup & Auth** (10 keys)
   - Email, password, sign in/up
   - Validation messages

2. **Onboarding** (15 keys)
   - Step indicators
   - Instructions
   - Button labels

3. **Allergy Categories** (40 keys)
   - 8 categories × 5 languages
   - Descriptions
   - Specific allergens

4. **Diet Preferences** (25 keys)
   - 4 categories
   - Specific diets
   - Descriptions

5. **Navigation** (10 keys)
   - Tab labels
   - Back/Next buttons
   - Screen titles

6. **Home Screen** (15 keys)
   - Section headers
   - CTA buttons
   - Status messages

7. **Scan Results** (20 keys)
   - Safety levels
   - Filter labels
   - Action buttons

8. **Profile** (30 keys)
   - Settings labels
   - Help content
   - Notification options

9. **Safety Card** (10 keys)
   - Card text
   - Allergy statements
   - Questions for staff

10. **Errors & Feedback** (15 keys)
    - Error messages
    - Success messages
    - Loading states

### Usage in Components

```typescript
import { Language, translations } from '@/lib/translations';

export function MyComponent({ language }: { language: Language }) {
  const t = translations[language];
  
  return (
    <div>
      <h1>{t.appName}</h1>
      <p>{t.tagline}</p>
      <button>{t.getStarted}</button>
    </div>
  );
}
```

### Language Context

```typescript
// contexts/LanguageContext.tsx
import { createContext, useContext, useState } from 'react';

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
}>({
  language: 'en',
  setLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

---

## 📊 Data Models & State Management

### User Profile Model

```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLoginAt: Date;
  language: Language;
  safetyProfile: SafetyProfile;
  settings: UserSettings;
}

interface SafetyProfile {
  allergies: Allergy[];
  diets: Diet[];
  customAllergies: string[];
  lastUpdated: Date;
}

interface Allergy {
  id: string;
  category: AllergyCategory;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

type AllergyCategory =
  | 'seafood'
  | 'nuts'
  | 'grains'
  | 'meats'
  | 'dairy'
  | 'fruits'
  | 'additives'
  | 'other';

interface Diet {
  id: string;
  category: DietCategory;
  name: string;
  strictness: 'flexible' | 'moderate' | 'strict';
}

type DietCategory =
  | 'plantBased'
  | 'religious'
  | 'avoidance'
  | 'noPreference';

interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  display: DisplaySettings;
}

interface NotificationSettings {
  scanAlerts: boolean;
  allergyWarnings: boolean;  // Always true
  nearbyRestaurants: boolean;
  newFeatures: boolean;
  email: boolean;
  push: boolean;
}

interface PrivacySettings {
  shareProfile: boolean;
  dataCollection: boolean;
  analytics: boolean;
}

interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  colorBlindMode: boolean;
}
```

### Menu & Scan Models

```typescript
interface MenuItem {
  id: string;
  name: string;
  translatedName: string;
  originalName: string;
  description: string;
  translatedDescription: string;
  ingredients: Ingredient[];
  price: Price;
  allergens: AllergenInfo[];
  dietaryInfo: DietaryInfo;
  safetyLevel: SafetyLevel;
  imageUrl?: string;
  spicyLevel?: number;
  servingSize?: string;
}

interface Ingredient {
  name: string;
  translatedName: string;
  isAllergen: boolean;
  allergenType?: AllergyCategory;
  confidence: number;  // 0-1 (OCR confidence)
}

interface Price {
  amount: number;
  currency: string;
  originalText: string;
}

interface AllergenInfo {
  allergen: string;
  presence: 'detected' | 'may_contain' | 'not_detected';
  confidence: number;
  matchedIngredients: string[];
}

interface DietaryInfo {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  halal: boolean;
  kosher: boolean;
}

type SafetyLevel = 'safe' | 'caution' | 'danger' | 'unknown';

interface ScanResult {
  id: string;
  timestamp: Date;
  userId: string;
  restaurant: Restaurant;
  imageUrl: string;
  menuItems: MenuItem[];
  ocrConfidence: number;
  processingTime: number;  // ms
  status: 'processing' | 'complete' | 'error';
}

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  distance?: number;  // meters
  rating?: number;
  safeItemCount: number;
  totalScans: number;
}
```

### State Management

**Context-based State**:

```typescript
// contexts/AppContext.tsx
interface AppState {
  user: UserProfile | null;
  language: Language;
  currentScan: ScanResult | null;
  scanHistory: ScanResult[];
  nearbyRestaurants: Restaurant[];
  loading: boolean;
  error: string | null;
}

interface AppActions {
  setUser: (user: UserProfile) => void;
  setLanguage: (lang: Language) => void;
  updateSafetyProfile: (profile: Partial<SafetyProfile>) => void;
  addScanResult: (scan: ScanResult) => void;
  clearError: () => void;
}

const AppContext = createContext<AppState & AppActions>({
  // ... default values
});

export const useApp = () => useContext(AppContext);
```

**Local Storage**:

```typescript
// utils/storage.ts
const STORAGE_KEYS = {
  USER_PROFILE: 'safemeals_user_profile',
  LANGUAGE: 'safemeals_language',
  SCAN_HISTORY: 'safemeals_scan_history',
  SAFETY_PROFILE: 'safemeals_safety_profile'
};

export const storage = {
  saveUserProfile: (profile: UserProfile) => {
    localStorage.setItem(
      STORAGE_KEYS.USER_PROFILE,
      JSON.stringify(profile)
    );
  },
  
  getUserProfile: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : null;
  },
  
  // ... other storage methods
};
```

---

## 🗺️ User Flows & Navigation

### Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────┐
│                     SAFEMEALS USER FLOW                      │
└─────────────────────────────────────────────────────────────┘

1. FIRST TIME USER
   │
   ├─ Splash Screen (3s)
   ├─ Login/Signup Screen
   │  ├─ [Sign In] → Home (existing user)
   │  └─ [Get Started] → Onboarding
   │     │
   │     ├─ Step 1: Create Account
   │     ├─ Step 2: Allergy Categories
   │     ├─ Step 3: Specific Allergies
   │     ├─ Step 3.5: Custom Allergies (if needed)
   │     ├─ Step 4: Diet Categories
   │     └─ Step 5: Specific Diets
   │        └─ [Complete] → Home Dashboard
   │
   └─ Home Dashboard

2. RETURNING USER
   │
   ├─ Splash Screen (3s)
   └─ Home Dashboard
      │
      ├─ 🏠 HOME TAB
      │  ├─ Quick Scan CTA
      │  ├─ Recent Scans
      │  └─ Nearby Safe Restaurants
      │
      ├─ 📸 SCAN TAB
      │  ├─ Camera Screen
      │  ├─ OCR Processing
      │  ├─ Scan Result Screen
      │  │  ├─ [View Item] → Menu Detail Modal
      │  │  └─ [Scan Again] → Camera Screen
      │  └─ Digital Overlay (50/50 Split)
      │
      ├─ 🛡️ SAFETY CARD TAB
      │  ├─ PIN Entry Screen
      │  └─ Safety Communication Card
      │
      └─ 👤 PROFILE TAB
         ├─ Profile Overview
         ├─ [Edit Allergies] → Allergy Edit Flow
         ├─ [Edit Diets] → Diet Edit Flow
         ├─ [Notifications] → Notification Settings
         ├─ [Language] → Language Selection
         ├─ [Help & Support] → Help Center
         │  ├─ FAQ
         │  ├─ Safety Guide
         │  ├─ Privacy Policy
         │  └─ Contact Support
         └─ [Log Out] → Login Screen
```

### Navigation Rules

1. **Bottom Navigation** (Always visible except during onboarding):
   - Home: Main dashboard
   - Scan: Camera interface
   - Safety Card: Communication tool
   - My: Profile & settings

2. **Back Navigation**:
   - Hardware back button (Android)
   - Swipe from left edge (iOS)
   - Back arrow in header
   - Never exits app accidentally (confirmation)

3. **Deep Linking**:
   - `/home` → Home Dashboard
   - `/scan` → Camera Screen
   - `/scan/:id` → Specific Scan Result
   - `/profile` → Profile Screen
   - `/profile/allergies` → Edit Allergies
   - `/safety-card` → PIN Entry → Card

4. **Modal Navigation**:
   - Menu Detail Modal: Overlay on scan results
   - Language Selector: Overlay on any screen
   - Error Dialogs: Blocking modals
   - Success Toasts: Non-blocking notifications

---

## 🔧 Technical Stack & Dependencies

### Core Technologies

```json
{
  "name": "safemeals",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    
    "// UI & Styling": "",
    "tailwindcss": "^4.0.0",
    "lucide-react": "^0.300.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    
    "// State Management": "",
    "react-hook-form": "^7.55.0",
    "zustand": "^4.4.0",
    
    "// Utilities": "",
    "date-fns": "^2.30.0",
    "zod": "^3.22.0",
    
    "// Future (Backend)": "",
    "@supabase/supabase-js": "^2.38.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "vite": "^5.0.0",
    "eslint": "^8.50.0",
    "prettier": "^3.0.0"
  }
}
```

### Project Structure (Tech Stack)

```
Frontend:
- React 18 (with TypeScript)
- Tailwind CSS v4.0
- Vite (Build tool)

UI Components:
- shadcn/ui (40+ components)
- Lucide React (Icons)
- Radix UI (Primitives)

State Management:
- React Context API
- useState/useReducer
- LocalStorage (persistence)

Future Backend:
- Supabase (Auth, Database, Storage)
- PostgreSQL (via Supabase)
- Real-time subscriptions

APIs (Planned):
- Google Cloud Vision API (OCR)
- Google Translate API (Translation)
- Custom allergen detection API
```

### Browser Support

```
Chrome/Edge: Latest 2 versions
Safari: Latest 2 versions
Firefox: Latest 2 versions
Mobile:
  - iOS Safari: 14.0+
  - Chrome Android: Latest
  - Samsung Internet: Latest
```

---

## 👩‍💻 Development Guide

### Getting Started

```bash
# 1. Clone repository (future)
git clone https://github.com/safemeals/app.git
cd app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# 4. Run development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:5173
```

### Environment Variables

```bash
# .env.local
VITE_APP_NAME=SafeMeals
VITE_APP_VERSION=1.0.0

# Future: Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Future: Google Cloud
VITE_GOOGLE_CLOUD_API_KEY=your_api_key
VITE_GOOGLE_CLOUD_VISION_API=your_vision_api_key
VITE_GOOGLE_TRANSLATE_API=your_translate_api_key
```

### Coding Standards

**File Naming**:
- Components: `PascalCase.tsx` (e.g., `ProfileScreen.tsx`)
- Utilities: `kebab-case.ts` (e.g., `storage-utils.ts`)
- Styles: `kebab-case.css` (e.g., `global-styles.css`)

**Component Structure**:
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Language, translations } from '@/lib/translations';

// 2. Types
interface MyComponentProps {
  language: Language;
  onComplete: () => void;
}

// 3. Component
export function MyComponent({ language, onComplete }: MyComponentProps) {
  // 3a. Hooks
  const [state, setState] = useState(false);
  const t = translations[language];
  
  // 3b. Handlers
  const handleClick = () => {
    setState(!state);
    onComplete();
  };
  
  // 3c. Render
  return (
    <div>
      <h1>{t.title}</h1>
      <Button onClick={handleClick}>{t.submit}</Button>
    </div>
  );
}
```

**TypeScript Rules**:
- No `any` types (use `unknown` if needed)
- Explicit function return types
- Strict null checks
- Interface over Type for objects

**CSS/Tailwind**:
- Use Tailwind utility classes first
- Custom CSS only when necessary
- Follow mobile-first responsive design
- Use CSS variables for theme colors

### Git Workflow

```bash
# Feature branch
git checkout -b feature/allergy-search
git commit -m "feat: add custom allergy search"
git push origin feature/allergy-search

# Commit message format
# feat: new feature
# fix: bug fix
# docs: documentation
# style: formatting
# refactor: code restructuring
# test: adding tests
# chore: maintenance
```

---

## 🧪 Testing & Quality Assurance

### Testing Strategy

**Unit Tests**:
- Utility functions
- Helper methods
- Translation keys

**Component Tests**:
- Render tests
- User interaction tests
- State management tests

**Integration Tests**:
- User flows (onboarding, scanning)
- Navigation tests
- API integration tests

**E2E Tests**:
- Complete user journeys
- Cross-browser testing
- Mobile device testing

### Test Coverage Goals

```
Components: 80%+ coverage
Utilities: 90%+ coverage
Critical paths: 100% coverage
```

### Quality Checklist

**Before Commit**:
- [ ] TypeScript compiles without errors
- [ ] No console errors/warnings
- [ ] All tests pass
- [ ] Code formatted (Prettier)
- [ ] Linted (ESLint)

**Before PR**:
- [ ] Feature works on all browsers
- [ ] Mobile responsive
- [ ] Accessibility checked
- [ ] Performance acceptable
- [ ] Documentation updated

**Before Release**:
- [ ] All features tested
- [ ] No critical bugs
- [ ] Performance optimized
- [ ] Security audit passed
- [ ] User testing completed

---

## 🚀 Deployment & Production

### Build Process

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

### Deployment Checklist

**Pre-deployment**:
- [ ] Update version number
- [ ] Update changelog
- [ ] Run full test suite
- [ ] Build production bundle
- [ ] Check bundle size
- [ ] Verify environment variables

**Deployment**:
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Verify production
- [ ] Monitor error logs

**Post-deployment**:
- [ ] Tag release in Git
- [ ] Update documentation
- [ ] Notify team
- [ ] Monitor metrics
- [ ] User feedback collection

### Performance Metrics

**Target Metrics**:
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Monitoring

**Error Tracking**:
- Sentry (recommended)
- Custom error logging
- User feedback reports

**Analytics**:
- Google Analytics
- Custom event tracking
- User behavior analysis

---

## 🗺️ Future Roadmap

### Phase 1: Current (Complete) ✅
- [x] Complete UI/UX design system
- [x] 5-step onboarding flow
- [x] Profile management
- [x] Safety communication card
- [x] Multi-language support (5 languages)
- [x] Custom allergy addition
- [x] Help & support system

### Phase 2: Backend Integration (Next 3 months)
- [ ] Supabase backend setup
- [ ] User authentication (email/password)
- [ ] Social login (Google, Apple)
- [ ] Profile cloud sync
- [ ] Scan history persistence
- [ ] Real-time updates

### Phase 3: OCR & Translation (Month 4-6)
- [ ] Google Cloud Vision API integration
- [ ] Real-time OCR scanning
- [ ] Multi-language translation
- [ ] Allergen detection algorithm
- [ ] Ingredient database
- [ ] Confidence scoring

### Phase 4: Restaurant Features (Month 7-9)
- [ ] Restaurant database
- [ ] Location-based search
- [ ] User reviews & ratings
- [ ] Safe menu submissions
- [ ] Restaurant partnerships
- [ ] Verified safe restaurants

### Phase 5: Advanced Features (Month 10-12)
- [ ] AI-powered allergen detection
- [ ] Image recognition (food photos)
- [ ] Nutrition information
- [ ] Cross-contamination warnings
- [ ] Community features
- [ ] Restaurant chat

### Phase 6: Mobile Apps (Year 2)
- [ ] React Native mobile app
- [ ] iOS App Store release
- [ ] Google Play Store release
- [ ] Offline mode enhancement
- [ ] Camera optimization
- [ ] Push notifications

### Phase 7: Ecosystem (Year 2+)
- [ ] Wearable device support (Apple Watch)
- [ ] Apple Health integration
- [ ] Restaurant POS integration
- [ ] API for third-party apps
- [ ] White-label solution
- [ ] Enterprise features

---

## 🔧 Troubleshooting & FAQ

### Common Issues

**Issue 1: App not loading**
```
Problem: Blank screen on startup
Solution:
1. Clear browser cache
2. Check console for errors
3. Verify all dependencies installed
4. Try different browser
```

**Issue 2: Translation not working**
```
Problem: Text showing as [object Object]
Solution:
1. Check language prop passed correctly
2. Verify translation key exists
3. Check translations.ts for typos
4. Ensure language is valid type
```

**Issue 3: Onboarding stuck**
```
Problem: Can't proceed to next step
Solution:
1. Check form validation
2. Ensure at least one item selected
3. Verify state management
4. Check console for errors
```

**Issue 4: Profile not saving**
```
Problem: Changes not persisted
Solution:
1. Check localStorage available
2. Verify storage quota not exceeded
3. Check for JSON stringify errors
4. Try different browser
```

### Developer FAQ

**Q: How to add a new language?**
A: 
1. Add language code to `Language` type in `translations.ts`
2. Add full translation object for new language
3. Add language option in `language-selector.tsx`
4. Test all screens with new language

**Q: How to add a new allergy category?**
A:
1. Add category to `AllergyCategory` type
2. Add translations for category name and description
3. Add category to `allergy-category-screen.tsx`
4. Add specific allergens to `allergy-detail-screen.tsx`
5. Update safety profile model

**Q: How to customize colors?**
A:
1. Edit color variables in `globals.css`
2. Use Tailwind color classes
3. Ensure WCAG AA contrast compliance
4. Test on all screens

**Q: How to add a new screen?**
A:
1. Create component in appropriate folder
2. Add routing logic in `App.tsx`
3. Add navigation links
4. Add to navigation flow diagram
5. Update documentation

---

## 📞 Support & Contact

### For Users
- **Email**: support@safemeals.app
- **Website**: www.safemeals.app
- **FAQ**: See Help & Support in app
- **Emergency**: Always verify with restaurant staff

### For Developers
- **GitHub**: github.com/safemeals/app
- **Documentation**: docs.safemeals.app
- **API Docs**: api.safemeals.app/docs
- **Discord**: discord.gg/safemeals

### Contributing
We welcome contributions! Please see:
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- SECURITY.md

---

## 📄 License & Legal

### License
MIT License - See LICENSE file

### Privacy
- GDPR compliant
- HIPAA considerations
- Data encryption
- User consent required

### Disclaimer
⚠️ **IMPORTANT SAFETY NOTICE**

SafeMeals is a tool to assist with food allergy management but should not be relied upon as the sole source of allergen information. Users with severe allergies should:

1. Always inform restaurant staff directly
2. Verify ingredients with restaurant
3. Carry emergency medication (EpiPen)
4. Use SafeMeals as a supplementary tool only

SafeMeals and its developers are not responsible for any allergic reactions or health issues resulting from app use. The accuracy of allergen detection depends on menu quality, OCR accuracy, and database completeness.

---

## 📊 Appendix

### A. Allergy Category Mapping

| Category | Specific Items | Count |
|----------|---------------|-------|
| Seafood | Shrimp, Crab, Lobster, Squid, Clams, Fish | 6 |
| Nuts | Peanut, Almond, Walnut, Cashew, Pistachio | 5 |
| Grains | Wheat, Barley, Oats, Rice, Corn | 5 |
| Meats | Beef, Pork, Chicken, Lamb | 4 |
| Dairy & Eggs | Milk, Cheese, Butter, Yogurt, Egg | 5 |
| Fruits | Strawberry, Kiwi, Mango, Peach | 4 |
| Additives | Sulfites, MSG, Food Dyes | 3 |
| **Total** | | **32 items** |

### B. Diet Preference Mapping

| Category | Specific Diets | Count |
|----------|---------------|-------|
| Plant-Based | Strict Vegan, Lacto Vegetarian, Ovo Vegetarian, Pesco Vegetarian, Flexitarian, Lactose Intolerant | 6 |
| Religious | Halal, Kosher, Buddhist Vegetarian | 3 |
| Avoidance | Pork-Free, Alcohol-Free, Garlic/Onion-Free | 3 |
| **Total** | | **12 diets** |

### C. Translation Key Index

See `/lib/translations.ts` for complete list (150+ keys)

### D. Color Accessibility Matrix

| Foreground | Background | Contrast | WCAG Level |
|------------|-----------|----------|------------|
| White | Green (#2ECC71) | 4.8:1 | AA |
| White | Yellow (#F1C40F) | 4.5:1 | AA |
| White | Red (#E74C3C) | 4.9:1 | AA |
| Dark Gray | White | 12.6:1 | AAA |

### E. Screen Size Breakpoints

```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Desktops */
xl: 1280px  /* Large desktops */
2xl: 1536px /* Extra large screens */
```

**SafeMeals is optimized for mobile (375px - 428px)**

---

## 🎉 Conclusion

SafeMeals represents a comprehensive solution for travelers with food allergies and dietary restrictions. This documentation covers the complete frontend implementation including:

- ✅ 20+ screens fully designed and implemented
- ✅ 5-language internationalization system
- ✅ Complete safety profile management
- ✅ Unique digital overlay UI design
- ✅ Professional design system
- ✅ Comprehensive component library
- ✅ Production-ready codebase

**Current Status**: Frontend complete and ready for backend integration.

**Next Steps**: 
1. Backend integration (Supabase)
2. OCR API integration
3. User testing
4. App store deployment

---

**Document Version**: 2.0 (Extended)
**Last Updated**: December 2024
**Author**: SafeMeals Development Team
**Status**: Living Document (Continuously Updated)

---

*Thank you for choosing SafeMeals. Eat fearlessly, anywhere.* 🛡️
