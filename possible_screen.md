TripAvail - Complete Screen List
🔐 Authentication Screens
Screen Name	Purpose
SplashScreen	App loading animation with logo reveal
SignUpScreen	New user registration (email/password + social login)
SignInScreen	Existing user login
ForgotPasswordScreen	Password recovery flow
EmailVerificationScreen	Verify email address with OTP
👤 TRAVELER ROLE - Screens
Main Navigation (Bottom Nav)
Screen Name	Purpose
HomeScreen / DashboardScreen	Featured destinations, trending packages, quick actions
TripsScreen	Upcoming, past, and cancelled bookings
WishlistScreen	Saved properties, packages, and tours
MessagesScreen	In-app chat with hotels/tour operators
ProfileScreen	User profile overview with stats and verification badge
Search & Discovery
Screen Name	Purpose
SearchOverlay	Full-screen search with filters and category tabs
SearchResultsScreen	Filtered list of hotels/packages/tours
HotelDetailScreen	Complete hotel information with gallery and amenities
PackageDetailScreen	Package details with inclusions and pricing breakdown
TourDetailScreen	Tour itinerary, pricing, and availability
DestinationDetailScreen	City/location overview with top attractions
Booking Flow
Screen Name	Purpose
BookingScreen	Select dates, guests, and room configuration
BookingReviewScreen	Review booking details before payment
PaymentScreen	Payment method selection and processing
BookingConfirmationScreen	Success screen with booking reference
BookingDetailScreen	View booking details and manage reservation
CancellationScreen	Cancel booking with policy review
Profile & Settings
Screen Name	Purpose
AccountSettingsScreen	Hub for all settings categories
AccountInfoScreen	Personal information (name, email, phone, DOB)
SecuritySettingsScreen	Password, 2FA, biometric auth
PrivacySettingsScreen	Data sharing, visibility, cookie preferences
NotificationsSettingsScreen	Push, email, SMS notification preferences
AppPreferencesScreen	Language, currency, dark mode, units
PaymentMethodsScreen	Saved cards and payment options
PaymentCardsScreen	Manage credit/debit cards
MobileWalletsScreen	Digital wallets (Apple Pay, Google Pay)
TravelPreferencesScreen	Travel style, interests, accessibility needs
RewardsScreen	Loyalty points, badges, referral program
Social & Reviews
Screen Name	Purpose
ReviewsScreen	Write and manage reviews
WriteReviewScreen	Create review with rating and photos
MyReviewsScreen	Past reviews written by user
Support
Screen Name	Purpose
HelpScreen	Help center with FAQs and contact options
ContactSupportScreen	Submit support ticket or live chat
LegalScreen	Terms, privacy policy, licenses
🏨 HOTEL MANAGER ROLE - Screens
Main Navigation (Bottom Nav)
Screen Name	Purpose
HotelManagerDashboardScreen	Analytics, earnings, occupancy stats
PropertiesScreen	List all managed properties
BookingsScreen	Incoming and current reservations
CalendarScreen	Availability and pricing calendar
MessagesScreen	Guest communications
Property Management
Screen Name	Purpose
ListHotelScreen	Entry point for 10-step hotel listing flow
PropertyDetailScreen	View and edit existing property
PropertySettingsScreen	Property-specific settings and status
RoomsManagementScreen	View and manage all room types
Hotel Listing Flow (10 Steps)
Screen Name	Purpose
PropertyTypeStep	Select property type (hotel, resort, boutique, etc.)
HotelInfoStep	Basic info (name, star rating, description)
LocationStep	Address, map picker, coordinates
PhotosStep	Upload 8 categories of property photos
AmenitiesStep	Select from 86 amenities across 12 categories
ServicesStep	Additional services offered
RoomsStep	Configure room types (triggers 5-step sub-flow)
PoliciesStep	Check-in/out times, cancellation, house rules
CoverageStep	Set service radius on map
ReviewSubmitStep	Final review before publishing
Room Configuration Sub-Flow (5 Steps)
Screen Name	Purpose
RoomTypeSelectionStep	Choose room category (standard, deluxe, suite)
RoomBasicInfoStep	Room name, size, max guests
BedConfigurationStep	Bed types and quantities
RoomAmenitiesStep	Room-specific amenities
RoomSummaryStep	Review and confirm room setup
Package Management
Screen Name	Purpose
ListPackagesScreen	Entry point for 10-step package creation
MyPackagesScreen	View all created packages (active/paused/draft)
PackageDetailScreen	Edit existing package
Package Creation Flow (10 Steps)
Screen Name	Purpose
PackageSelectionStep	Choose package type (weekend, romantic, family, etc.)
BasicsStep	Title, tagline, package type
SmallDescriptionStep	Detailed package description
HighlightsStep	Free inclusions + exclusive discounts
PricingStep	Base price, discount percentage, value calculation
MediaStep	Package photos and videos
CalendarStep	Available dates and blackout periods
PolicyStep	Cancellation policy, booking rules, min stay
ExclusionsStep	What's not included
ConfirmationStep	Review and publish package
Verification & Onboarding
Screen Name	Purpose
HotelOnboardingScreen	First-time setup wizard
VerificationScreen	Submit property documents for verification
VerificationStatusScreen	Track verification progress
VerificationSuccessScreen	Celebration screen after approval
🚍 TOUR OPERATOR ROLE - Screens
Main Navigation (Bottom Nav)
Screen Name	Purpose
TourOperatorDashboardScreen	Bookings, revenue, popular tours
ToursScreen	List all created tours
BookingsScreen	Tour reservations and attendees
CalendarScreen	Tour schedules and availability
MessagesScreen	Communication with travelers
Tour Management
Screen Name	Purpose
PostTripPackagesScreen	Entry point for 7-step tour creation
TourDetailScreen	View and edit existing tour
TourSettingsScreen	Tour-specific settings
Tour Creation Flow (7 Steps)
Screen Name	Purpose
TourBasicsStep	Tour name, type, duration, difficulty
TourItineraryStep	Day-by-day schedule and activities
TourPricingStep	Per person/group pricing, min/max participants
TourMediaStep	Tour photos and videos
TourPoliciesStep	Cancellation, requirements, what to bring
TourCalendarStep	Tour dates and available slots
TourConfirmationStep	Review and publish tour
Onboarding
Screen Name	Purpose
TourOperatorOnboardingScreen	First-time operator setup
OperatorVerificationScreen	Submit credentials for verification
🔄 SHARED SCREENS (All Roles)
Screen Name	Purpose
PartnerSelectionScreen	Choose role: Hotel Manager or Tour Operator
RoleSwitchConfirmationScreen	Confirm role switch action
SettingsScreen	App-wide settings hub
NotificationsScreen	View all notifications
NotificationDetailScreen	Detailed notification with actions
ReviewsScreen	View reviews (as host or guest)
HelpScreen	Help and support
LegalScreen	Terms, privacy, licenses
🔔 Modal/Overlay Screens
Screen Name	Purpose
SearchOverlay	Full-screen search with filters
FilterSheet	Advanced filters bottom sheet
DatePickerSheet	Calendar for date selection
GuestPickerSheet	Select number of adults/children/infants
MapPickerSheet	Interactive map for location selection
PhotoGalleryOverlay	Full-screen photo viewer with swipe
ConfirmationDialog	Generic confirmation modal
SuccessAnimation	Success celebration (Lottie animation)
LoadingOverlay	Full-screen loading indicator
📊 Total Screen Count
Category	Count
Authentication	5
Traveler Screens	35+
Hotel Manager Screens	30+
Tour Operator Screens	15+
Shared Screens	10+
Modals/Overlays	10+
TOTAL	~105 screens
🎯 Priority Screens for MVP
Phase 1: Core (Must Have)
SplashScreen
SignUpScreen / SignInScreen
HomeScreen (Traveler Dashboard)
SearchOverlay
HotelDetailScreen
BookingScreen
ProfileScreen
PartnerSelectionScreen
HotelManagerDashboardScreen
ListHotelScreen (10-step flow)
Phase 2: Essential (Should Have)
PackageDetailScreen
ListPackagesScreen (10-step flow)
TripsScreen
WishlistScreen
PaymentScreen
BookingConfirmationScreen
ReviewsScreen
CalendarScreen
PropertiesScreen
MessagesScreen
Phase 3: Enhanced (Nice to Have)
TourDetailScreen
PostTripPackagesScreen (7-step flow)
RewardsScreen
NotificationsScreen
All Settings Screens
VerificationScreen
HelpScreen
