# TripAvail Architecture Overview

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        TripAvail App                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Presentation Layer (UI)                │    │
│  │  ┌──────────┬──────────┬──────────┬─────────────┐  │    │
│  │  │ Splash   │ Onboard  │   Auth   │   Profile   │  │    │
│  │  │  Screen  │  Screen  │  Screens │   Screen    │  │    │
│  │  └──────────┴──────────┴──────────┴─────────────┘  │    │
│  │  ┌──────────┬──────────┬─────────────────────────┐  │    │
│  │  │  Home    │ Partner  │   Hotel / Tour Operator  │  │    │
│  │  │  Screen  │Workspace │        Screens          │  │    │
│  │  └──────────┴──────────┴─────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Business Logic Layer (GetX)                │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │     Controllers (State Management)            │  │    │
│  │  │  • AuthController                            │  │    │
│  │  │  • ProfileController                         │  │    │
│  │  │  • PartnerDashboardController                │  │    │
│  │  │  • ThemeController                           │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │             Data Layer                              │    │
│  │  ┌──────────────────────────────────────────────┐  │    │
│  │  │  Models & Services                            │  │    │
│  │  │  • User Model                                │  │    │
│  │  │  • Profile Model                             │  │    │
│  │  │  • Location Service                          │  │    │
│  │  │  • Profile Storage                           │  │    │
│  │  └──────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Shared Resources                             │    │
│  │  • Widgets (Reusable Components)                   │    │
│  │  • Utils (Helpers, Constants, Theme)               │    │
│  │  • Assets (Images, Fonts, Animations)              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Feature-First Architecture

### Philosophy
**"Organize by feature, not by type"**

```
❌ Type-First (Anti-Pattern)
├── screens/
│   ├── login_screen.dart
│   ├── profile_screen.dart
│   └── hotel_list_screen.dart
├── widgets/
│   ├── login_form.dart
│   ├── profile_card.dart
│   └── hotel_card.dart
└── controllers/
    ├── auth_controller.dart
    ├── profile_controller.dart
    └── hotel_controller.dart

✅ Feature-First (Our Pattern)
├── features/
│   ├── authentication/
│   │   ├── login_screen.dart
│   │   ├── signup_screen.dart
│   │   ├── widgets/
│   │   └── controllers/
│   ├── profile/
│   │   ├── profile_screen.dart
│   │   ├── widgets/
│   │   └── controllers/
│   └── hotel_manager/
│       ├── presentation/
│       │   ├── screens/
│       │   ├── widgets/
│       │   └── controllers/
│       └── models/
```

### Benefits
✅ **Encapsulation** - Each feature is self-contained  
✅ **Scalability** - Easy to add/remove features  
✅ **Team Collaboration** - Multiple devs can work on different features  
✅ **Code Organization** - Related code stays together  
✅ **Maintainability** - Changes are localized  

---

## 🔄 Application Flow

### User Journey Map

```
┌─────────────┐
│  App Start  │
└──────┬──────┘
       │
       v
┌─────────────────┐
│ Splash Screen   │  ← Animated (4s)
└──────┬──────────┘
       │
       v
┌─────────────────┐
│  Onboarding     │  ← First time only
└──────┬──────────┘
       │
       ├───────────────────┐
       v                   v
┌──────────────┐    ┌──────────────┐
│    Login     │    │   Signup     │
└──────┬───────┘    └──────┬───────┘
       │                   │
       │                   v
       │            ┌──────────────┐
       │            │  Email Entry │
       │            └──────┬───────┘
       │                   │
       │                   v
       │            ┌──────────────┐
       │            │     OTP      │
       │            └──────┬───────┘
       │                   │
       │                   v
       │            ┌──────────────┐
       │            │  Setup Name  │
       │            └──────┬───────┘
       │                   │
       │                   v
       │            ┌──────────────┐
       │            │Setup Location│
       │            └──────┬───────┘
       │                   │
       └───────────────────┘
                   │
                   v
       ┌───────────────────┐
       │  Main App (Home)  │
       └───────────────────┘
                   │
       ┌───────────┼───────────┐
       v           v           v
┌──────────┐ ┌─────────┐ ┌─────────┐
│ Profile  │ │ Partner │ │  More   │
│          │ │Workspace│ │Features │
└──────────┘ └─────────┘ └─────────┘
```

---

## 🎯 State Management (GetX)

### Pattern

```dart
// Controller (Business Logic)
class ProfileController extends GetxController {
  final Rx<User?> user = Rx<User?>(null);
  final RxBool isLoading = false.obs;
  
  Future<void> loadProfile() async {
    isLoading.value = true;
    user.value = await fetchFromApi();
    isLoading.value = false;
  }
}

// Screen (UI)
class ProfileScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GetX<ProfileController>(
      builder: (controller) {
        if (controller.isLoading.value) {
          return CircularProgressIndicator();
        }
        return Text(controller.user.value?.name ?? '');
      },
    );
  }
}
```

### State Flow

```
User Action → Controller Method → Update Observable → UI Rebuilds
    ↓              ↓                    ↓                ↓
 Button Tap → loadProfile() → user.value = data → GetX rebuilds
```

---

## 🎨 Theme Architecture

### Theme System

```
Theme System
├── Light Theme (app_light_theme.dart)
│   ├── Primary Colors
│   ├── Text Styles
│   ├── Component Themes
│   └── Color Scheme
│
├── Dark Theme (app_dark_theme.dart)
│   ├── Primary Colors
│   ├── Text Styles
│   ├── Component Themes
│   └── Color Scheme
│
├── Constants (app_constants.dart)
│   ├── AppColors
│   ├── AppRoleGradients
│   ├── AppSizes
│   └── AppBorderRadius
│
├── Text Styles (app_text_styles.dart)
│   ├── Headline Styles
│   ├── Title Styles
│   └── Body Styles
│
└── Extensions (role_theme_extension.dart)
    └── Role-specific theming
```

### Theme Switching

```dart
// ThemeController manages theme state
class ThemeController extends GetxController {
  final isDarkMode = false.obs;
  
  void toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
    Get.changeTheme(
      isDarkMode.value ? AppDarkTheme.theme : AppLightTheme.theme
    );
  }
}
```

---

## 🔐 Authentication Architecture

### Auth Flow

```
┌─────────────────┐
│  Email Entry    │
│  (email input)  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Send OTP      │  ← Backend API call
│   (email sent)  │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   OTP Screen    │
│  (6-digit code) │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Verify OTP     │  ← Backend validation
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Setup Profile  │
│ (name, location)│
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Save to Local  │  ← SharedPreferences
│  Storage        │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Navigate to   │
│   Main App      │
└─────────────────┘
```

---

## 🏨 Partner Architecture

### Dual Role System

```
Partner Entry
      │
      ├──────────────┬──────────────┐
      v              v
┌─────────────┐  ┌─────────────┐
│   Hotel     │  │    Tour     │
│  Manager    │  │  Operator   │
└──────┬──────┘  └──────┬──────┘
       │                │
       v                v
┌─────────────────────────────┐
│  Partner Workspace Screen   │
│  (role-specific dashboard)  │
└──────────┬──────────────────┘
           │
    ┌──────┴──────┐
    v             v
┌─────────┐  ┌─────────┐
│Gradients│  │ Actions │
│ & Theme │  │  & Data │
└─────────┘  └─────────┘

Hotel Manager:
├── List Hotels
├── Manage Packages
├── Verification
└── Settings

Tour Operator:
├── Create Tours
├── Manage Packages
├── Calendar
├── Bookings
└── Verification
```

### Role-Based Theming

```dart
// Gradients per role
AppRoleGradients.hotelManager    // Blue gradient
AppRoleGradients.tourOperator    // Purple gradient
AppRoleGradients.traveller       // Pink gradient

// Used throughout partner workspace
Container(
  decoration: BoxDecoration(
    gradient: partnerGradient(role),
  ),
)
```

---

## 📱 Responsive Design Strategy

### Breakpoint System

```
┌─────────────────────────────────────┐
│       Mobile (< 600px)              │
│  • Single column                    │
│  • Full width components            │
│  • Vertical stacking                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     Tablet (600px - 1200px)         │
│  • Two column grids                 │
│  • Max width: 560px                 │
│  • Centered content                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Desktop (> 1200px)             │
│  • Multi-column layouts             │
│  • Max width: 560px (forms)         │
│  • Side navigation                  │
└─────────────────────────────────────┘
```

### Implementation

```dart
// Responsive padding
EdgeInsets.symmetric(
  horizontal: width * 0.08,  // 8% of screen width
)

// Responsive spacing
SizedBox(height: height * 0.02)  // 2% of screen height

// Max width constraint
ConstrainedBox(
  constraints: const BoxConstraints(maxWidth: 560),
  child: content,
)
```

---

## 🗃️ Data Flow Architecture

```
┌──────────────────────────────────────────────┐
│               User Interface                  │
│         (Screens & Widgets)                   │
└───────────────┬──────────────────────────────┘
                │
                ↓ User Actions
┌──────────────────────────────────────────────┐
│            GetX Controllers                   │
│      (Business Logic & State)                 │
└───────────────┬──────────────────────────────┘
                │
                ↓ API Calls / Storage
┌──────────────────────────────────────────────┐
│          Services & Storage                   │
│  • API Services                              │
│  • Local Storage (SharedPreferences)         │
│  • Location Service                          │
└───────────────┬──────────────────────────────┘
                │
                ↓ Data Models
┌──────────────────────────────────────────────┐
│               Models                          │
│         (Data Structures)                     │
└──────────────────────────────────────────────┘
```

---

## 🧩 Widget Architecture

### Widget Hierarchy

```
MaterialApp (GetMaterialApp)
└── Theme
    └── Scaffold
        ├── AppBar (PrimaryAppBar)
        ├── Drawer (AppDrawer)
        └── Body
            └── SafeArea
                └── ConstrainedBox (max-width)
                    └── Padding (responsive)
                        └── Content
                            ├── Custom Widgets
                            │   ├── PrimaryButton
                            │   ├── PrimaryTextField
                            │   └── Cards
                            └── Layout
                                ├── Column
                                ├── Row
                                └── GridView
```

### Reusable Widget Pattern

```dart
// Atomic Design Pattern
Atoms (Basic elements)
├── PrimaryButton
├── PrimaryTextField
└── Icons, Text

Molecules (Simple combinations)
├── FormField (Label + Input)
├── InfoItem (Icon + Text)
└── Card (Container + Shadow)

Organisms (Complex components)
├── ProfileHeaderCard
├── ContactInfoCard
└── AuthForm

Templates (Page layouts)
├── AuthLayout
├── DashboardLayout
└── FormLayout

Pages (Screens)
├── LoginScreen
├── ProfileScreen
└── PartnerWorkspaceScreen
```

---

## 🔄 Navigation Architecture

### Navigation Stack

```dart
// GetX Navigation
Get.to()      →  Push new screen (can go back)
Get.off()     →  Replace current screen
Get.offAll()  →  Clear stack, go to screen

// Example Navigation Flow
Splash → Onboarding → Login → Home
  ↓         ↓          ↓       ↓
offAll    offAll     offAll   Base
```

### Route Structure

```
Main Routes:
├── / (SplashScreen)
├── /onboarding
├── /login
├── /signup
├── /home (BottomNavBar)
│   ├── /profile
│   ├── /bookings
│   └── /explore
└── /partner
    ├── /hotel-manager
    └── /tour-operator
```

---

## 🎨 Design System Overview

```
Design System
├── Colors
│   ├── Primary: #E11D48 (Rose)
│   ├── Secondary: #3B82F6 (Blue)
│   ├── Accent: #8B5CF6 (Purple)
│   └── Neutral: Grays
│
├── Typography
│   ├── Headlines (32, 28, 24)
│   ├── Titles (20, 18, 16)
│   └── Body (14, 12)
│
├── Spacing Scale
│   ├── 4px  (Tight)
│   ├── 8px  (Small)
│   ├── 16px (Medium)
│   ├── 24px (Large)
│   └── 32px (XLarge)
│
├── Border Radius
│   ├── 8px  (Small)
│   ├── 12px (Medium)
│   ├── 20px (Large)
│   └── 999px (Pill)
│
└── Elevation (Shadows)
    ├── Level 1: 2dp
    ├── Level 2: 4dp
    ├── Level 3: 8dp
    └── Level 4: 16dp
```

---

## 📊 Performance Architecture

### Optimization Strategies

```
Performance Optimizations
├── Widget Rebuilds
│   ├── const constructors
│   ├── GetX selective rebuild
│   └── ValueListenableBuilder
│
├── Image Loading
│   ├── Cached network images
│   ├── Asset pre-caching
│   └── Lazy loading
│
├── List Performance
│   ├── ListView.builder
│   ├── Pagination
│   └── Item caching
│
└── State Management
    ├── GetX reactive
    ├── Minimal rebuilds
    └── Controller lifecycle
```

---

## 🔐 Security Architecture

```
Security Layers
├── Authentication
│   ├── OTP verification
│   ├── Token storage
│   └── Session management
│
├── Data Storage
│   ├── Encrypted preferences
│   ├── Secure token storage
│   └── Biometric auth (future)
│
└── API Communication
    ├── HTTPS only
    ├── Token headers
    └── Input validation
```

---

## 📝 Summary

### Key Architectural Decisions

1. **Feature-First** - Organize by feature, not type
2. **GetX** - State management and navigation
3. **Responsive** - Percentage-based layouts with constraints
4. **Theme System** - Light/dark with role-based extensions
5. **Reusable Widgets** - Atomic design pattern
6. **Clean Separation** - UI, Logic, Data layers

### Best Practices

✅ Keep features independent  
✅ Use GetX for state management  
✅ Follow responsive design patterns  
✅ Reuse widgets across features  
✅ Centralize constants and styles  
✅ Document architectural decisions  

---

**For more details, see:**
- [DIRECTORY_STRUCTURE.md](./DIRECTORY_STRUCTURE.md)
- [CODING_STANDARDS.md](./CODING_STANDARDS.md)
- [QUICK_START.md](./QUICK_START.md)
