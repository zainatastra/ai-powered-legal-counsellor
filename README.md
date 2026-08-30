AI-Powered Legal Counsellor
Version 2.0 — Enterprise-Grade Application Evolution

AI-Powered Legal Counsellor is an AI-assisted legal information and guidance platform developed to provide users with an accessible, secure, and professional conversational legal assistance experience.

Version 2.0 represents a substantial evolution from Version 1.0. Rather than simply adding new functionality, Version 2.0 addresses security weaknesses, usability limitations, inconsistent interface behavior, authentication requirements, data-management needs, performance perception, and maintainability issues identified during the application's development and review.

The following comparison documents what changed, why it was required, and how Version 2.0 improves upon Version 1.0.

| Area                                 | Version 1.0                                                                 | Version 2.0                                                                                              | Why the Change Was Needed                                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overall Architecture**             | Functional prototype-oriented application                                   | More structured, security-conscious and production-oriented application                                  | Version 1.0 established the core functionality, while Version 2.0 focuses on reliability, security, maintainability and professional deployment readiness |
| **Authentication**                   | Basic Firebase authentication                                               | Firebase authentication with stronger authentication flows and MFA support                               | Stronger identity verification is required for protecting user accounts and sensitive legal conversations                                                 |
| **Email Verification**               | Basic account verification flow                                             | OTP-based email verification with expiry, limits, hashing and protected verification records             | Prevents unverified accounts from freely accessing protected functionality and strengthens account ownership verification                                 |
| **Multi-Factor Authentication**      | No functional authenticator MFA                                             | Authenticator application / TOTP MFA                                                                     | Adds an additional security layer beyond passwords                                                                                                        |
| **MFA Login Handling**               | Standard authentication flow                                                | Handles Firebase `multi-factor-auth-required` state and presents the appropriate verification experience | MFA cannot be considered complete unless the login flow can actually complete the second authentication factor                                            |
| **AI Chat API Security**             | AI endpoint could be accessed without sufficient authentication protection  | Firebase ID-token authentication required before accessing the legal-chat endpoint                       | Prevents unauthorized users from directly consuming the AI service and potentially generating uncontrolled API costs                                      |
| **API Rate Limiting**                | No comprehensive request protection                                         | IP-level and authenticated-user request limiting                                                         | Reduces automated abuse, request floods, retry loops and unnecessary AI API consumption                                                                   |
| **Free AI Usage**                    | No persistent product-level usage allowance                                 | Persistent 10-message free allowance per user                                                            | Provides controlled access to the AI service and establishes a predictable usage model                                                                    |
| **Usage Persistence**                | Usage state was not protected as a persistent product-level quota           | Usage is persisted against the authenticated user                                                        | Prevents users from bypassing the allowance simply by refreshing, logging out or changing devices                                                         |
| **Usage Cooldown**                   | No five-hour product cooldown                                               | Five-hour cooldown begins at the exact time the user's allowance is exhausted                            | Provides a clear and predictable free-usage policy                                                                                                        |
| **Limit Notification**               | No dedicated exhausted-limit experience                                     | Immediate authenticated modal with exact reset time                                                      | Users receive clear feedback instead of being left wondering why their requests are no longer processing                                                  |
| **Composer During Limit**            | Chat interaction could continue attempting requests                         | Composer access is restricted once the allowance is exhausted                                            | Prevents unnecessary requests and makes the usage policy explicit                                                                                         |
| **Email Sending Endpoint**           | Test email functionality presented unnecessary exposure                     | Protected email functionality with authentication restrictions                                           | Prevents unauthorized use of the application's email infrastructure                                                                                       |
| **Firebase Credentials**             | Service-account credential handling required improvement                    | Firebase Admin credentials moved toward environment-based configuration                                  | Sensitive credentials should not be embedded in application source or committed to repositories                                                           |
| **Git Security**                     | Sensitive service-account file required explicit repository protection      | Firebase service-account credentials excluded through `.gitignore`                                       | Reduces the risk of accidentally publishing administrative Firebase credentials                                                                           |
| **Health Endpoint**                  | Configuration information could be exposed                                  | Public health response reduced to minimal health information                                             | Prevents unnecessary disclosure of backend configuration state                                                                                            |
| **OTP Storage**                      | Required stronger protection                                                | OTP values are hashed before storage                                                                     | Protects OTP secrets if stored data is exposed                                                                                                            |
| **OTP Verification**                 | Standard comparison                                                         | Timing-safe comparison                                                                                   | Adds additional cryptographic hardening to verification                                                                                                   |
| **OTP Abuse Protection**             | Limited protection                                                          | Send and verification limits with expiry and blocking behavior                                           | Reduces brute-force and automated OTP abuse                                                                                                               |
| **Chat Deletion**                    | Individual conversation deletion                                            | Individual deletion plus Delete All Chats functionality                                                  | Users require meaningful control over their stored conversations                                                                                          |
| **Delete All Chats**                 | Not available                                                               | Permanently deletes the user's saved conversations after explicit consent                                | Provides a complete user-controlled conversation deletion mechanism                                                                                       |
| **Deletion Confirmation**            | Destructive actions lacked complete confirmation presentation               | Centralized consent modal before destructive actions                                                     | Prevents accidental permanent deletion                                                                                                                    |
| **Data Controls**                    | No dedicated data-management section                                        | Dedicated Data Controls section in Settings                                                              | Makes privacy and conversation-management functionality easier to discover and understand                                                                 |
| **Chat Export**                      | Not available                                                               | Export Chats functionality                                                                               | Gives users a portable copy of their saved conversations                                                                                                  |
| **Settings Structure**               | Less organized settings experience                                          | Account, Security, Authentication, Sessions and Data Controls sections                                   | Separates responsibilities and provides a scalable settings architecture                                                                                  |
| **Session Management**               | Basic session functionality                                                 | Dedicated Sessions interface with device/session information and logout controls                         | Gives users greater visibility and control over authenticated sessions                                                                                    |
| **Logout Confirmation**              | Confirmation workflow was incomplete                                        | Consent confirmation before logout                                                                       | Prevents accidental session termination                                                                                                                   |
| **Delete Conversation Confirmation** | Handler existed but confirmation UI was incomplete                          | Fully presented consent workflow                                                                         | Makes destructive actions safer and more consistent                                                                                                       |
| **UI Design**                        | Multiple areas used independent styling approaches                          | Unified application-wide design system                                                                   | Version 1.0 had visual inconsistencies between screens                                                                                                    |
| **Typography**                       | Multiple font systems/styles                                                | Consistent `Titillium Web, Geneva, Tahoma, sans-serif` typography                                        | Creates a consistent visual identity across the application                                                                                               |
| **Color System**                     | Multiple independent palettes                                               | Shared design tokens and unified brand palette                                                           | Prevents screens from appearing visually disconnected                                                                                                     |
| **Spacing**                          | Screen-specific spacing decisions                                           | Shared spacing and layout principles                                                                     | Creates consistent proportions and composition throughout the platform                                                                                    |
| **Buttons**                          | Different screens could use different button styles                         | Shared button primitives and variants                                                                    | Establishes consistent interaction patterns                                                                                                               |
| **Modals**                           | Different modal implementations and styling                                 | Shared modal surfaces, overlays and feedback patterns                                                    | Creates a consistent application-wide modal experience                                                                                                    |
| **Feedback System**                  | Feedback behavior varied between screens                                    | Centralized success, error and consent modals plus toasts                                                | Users receive consistent responses to actions throughout the application                                                                                  |
| **Loading Experience**               | Content could appear abruptly                                               | Structure-accurate skeleton loading                                                                      | Reduces perceived latency and visual layout shifts                                                                                                        |
| **Skeleton Accuracy**                | Skeletons were not consistently aligned with actual layouts                 | Skeletons redesigned to match the real screen structures                                                 | Prevents noticeable jumps between loading and loaded states                                                                                               |
| **Skeleton Persistence**             | Loading state could be visually incomplete                                  | Skeleton remains until the corresponding content has loaded                                              | Creates a smoother transition into the actual interface                                                                                                   |
| **Chat Animation**                   | Basic response presentation                                                 | Smooth thinking and typewriter response experience                                                       | Makes AI interaction feel more natural and responsive                                                                                                     |
| **Typewriter Effect**                | First-character rendering issue                                             | Corrected full-string/index-based rendering                                                              | Prevents the first character of AI responses from disappearing                                                                                            |
| **Thinking State**                   | No dedicated waiting indicator                                              | “Thinking…” indicator before AI response generation                                                      | Clearly communicates that the system is processing the request                                                                                            |
| **Composer State**                   | Multiple submissions could occur while AI was responding                    | Composer locks while a response is pending                                                               | Prevents duplicate or conflicting requests                                                                                                                |
| **Input Focus**                      | Focus could occur before the input existed                                  | Improved focus handling after the interface is ready                                                     | Creates a smoother chat experience after loading and refresh                                                                                              |
| **Chat Titles**                      | Conversations could remain “New Chat”                                       | Automatically generated titles from the first message                                                    | Makes conversation history easier to understand and navigate                                                                                              |
| **Chat Title Animation**             | Titles appeared immediately                                                 | Titles animate character-by-character                                                                    | Improves perceived responsiveness and visual polish                                                                                                       |
| **Chat History**                     | More spacing and loading inconsistencies                                    | Compact, structured history with appropriate loading states                                              | Improves navigation and information density                                                                                                               |
| **Authentication Loading**           | Authentication state could briefly produce incorrect UI                     | Loading skeleton used while authentication state resolves                                                | Prevents misleading login-required flashes                                                                                                                |
| **Authentication State**             | Redundant authentication checks could produce UI flashes                    | Authentication state handling streamlined                                                                | Improves stability during refresh and session restoration                                                                                                 |
| **Responsive CSS**                   | Several responsive/hover classes existed without being attached to elements | Systemic class attachment issue corrected                                                                | Previously written responsive behavior was not always being applied                                                                                       |
| **Mobile Experience**                | Inconsistent responsive behavior                                            | Responsive behavior reviewed and corrected                                                               | Provides a more consistent experience across viewport sizes                                                                                               |
| **Lawyers Interface**                | External preview imagery and independent card styling                       | Shared card system and client-side initials avatars                                                      | Removes unnecessary external image dependencies and improves consistency                                                                                  |
| **Page Layouts**                     | Screen-specific layout approaches                                           | Reusable page and header primitives                                                                      | Makes the application easier to maintain and extend                                                                                                       |
| **Password UI**                      | Independent password styling                                                | Shared password strength and rule primitives                                                             | Provides consistent authentication UX                                                                                                                     |
| **OTP UI**                           | Independent verification styling                                            | Shared OTP input and authentication primitives                                                           | Aligns verification screens with the broader authentication system                                                                                        |
| **Error Messages**                   | Error handling was inconsistent                                             | Generic, controlled authentication and system error messaging                                            | Reduces unnecessary information disclosure and improves UX consistency                                                                                    |
| **Backend Identity**                 | Client-side identity could not be considered sufficient protection          | Server derives authenticated identity from verified Firebase tokens                                      | Establishes the backend as the security boundary                                                                                                          |
| **Firestore User Isolation**         | Required stronger enforcement                                               | User-specific Firestore access and server-side UID handling                                              | Prevents users from accessing another user's conversations                                                                                                |
| **Firestore Deletion**               | Basic deletion capability                                                   | Batch deletion using safe batch sizes                                                                    | Supports deletion of larger conversation collections reliably                                                                                             |
| **Repository Hygiene**               | Backup and OS files could remain in repository                              | `.save`, `.orig` and `.DS_Store` patterns addressed                                                      | Keeps the repository cleaner and reduces accidental exposure of outdated code                                                                             |
| **Maintainability**                  | More duplicated styling and component behavior                              | Shared primitives and centralized design tokens                                                          | Reduces duplication and makes future changes easier                                                                                                       |
| **Overall UX**                       | Functional but prototype-oriented                                           | Compact, composed, consistent and professional interface                                                 | Version 2.0 moves the application toward a mature product experience                                                                                      |

Major Version 2.0 Improvements
1. Enterprise-Oriented Security

Version 1.0 established the basic application functionality.

Version 2.0 introduces a much stronger security model around:

Firebase Authentication
Firebase Admin token verification
Authenticator MFA
Email OTP verification
OTP hashing
Timing-safe OTP comparison
API authentication
IP rate limiting
User-level rate limiting
Persistent usage enforcement
Firestore user isolation
Environment-based secrets
Repository credential protection

The objective was to ensure that security is enforced at the backend and infrastructure level rather than relying exclusively on frontend controls.

2. Controlled AI Usage

One of the most important Version 2.0 changes is the introduction of controlled AI consumption.

Each authenticated user receives:

10 free AI messages

After the tenth message is consumed, a five-hour cooldown begins.

For example:

Limit reached: 5:10 PM
Access restored: 10:10 PM

The reset is calculated from the actual exhaustion time rather than resetting at midnight or according to a fixed daily schedule.

The user receives an authenticated limit notification:

You are out of Free Messages until {time}

This prevents unnecessary requests while clearly communicating when access will return.

3. Privacy & Data Controls

Version 2.0 introduces a dedicated Data Controls section.

Users can now manage their stored conversations through:

Export Chats
Delete All Chats

Destructive actions require explicit consent.

Delete All Chats permanently removes the user's saved conversations through authenticated backend operations.

This functionality was introduced to provide stronger user control over stored conversational data and support privacy-oriented product design.

4. Professional Authentication Experience

The authentication system was substantially enhanced.

Version 2.0 provides:

Login
Registration
Email verification
OTP verification
Password reset
Authenticator MFA
MFA-required login handling
Authentication loading states
Controlled authentication errors
Session management

The authenticator flow allows a user to scan a QR code, obtain a six-digit code from an authenticator application and verify the code before enabling MFA.

5. Unified Design Language

Version 1.0 contained several independently styled interfaces.

Version 2.0 introduces a shared visual language covering:

Typography
Colors
Spacing
Shadows
Borders
Radii
Buttons
Forms
Modals
Toasts
Cards
Chat components
Authentication screens
Settings
Loading states

The goal is that the application should feel like one product, rather than a collection of independently developed screens.

6. Smoothness & Interaction Design

Version 2.0 places significant emphasis on perceived performance.

The interface now uses:

Skeleton loading
Smooth transitions
Thinking indicators
Typewriter responses
Animated chat titles
Controlled input states
Auto-focus
Modal transitions
Toast feedback
Consistent action states

The objective is to make every interaction feel deliberate rather than abrupt.

7. Chat Reliability

Several issues discovered during live testing were corrected.

Fixed:
First character disappearing from AI responses
Duplicate message submission during AI processing
Authentication flash during refresh
Incorrect authentication state timing
Sidebar loading behavior
Chat title generation
Chat title rendering
Message bubble proportions
Composer/message alignment
Input focus timing

These fixes improve both functional reliability and perceived quality.

8. Loading Architecture

The Loading system was significantly improved.

Instead of displaying generic loading indicators, Version 2.0 uses skeletons that correspond to the actual structures being loaded.

Examples include:

Authentication skeletons
Chat skeletons
Sidebar history skeletons
Lawyers page skeletons
Message structures
Composer structures

The objective is to maintain the screen's structure while data is being retrieved.

9. Centralized Feedback

GlobalFeedback.jsx provides a common feedback architecture for the application.

It supports:

Success

Used for successful operations.

Error

Used for failures and unexpected conditions.

Consent

Used before destructive or consequential actions.

Toasts

Used for lightweight status information.

This prevents individual modules from creating unrelated feedback styles and behaviors.

10. Responsive & UI Defect Resolution

A recurring implementation issue was identified across several files where CSS classes had been defined but were not attached to the corresponding elements.

This affected areas including:

Loading
Login
Signup
Lawyers
Settings

The affected elements were corrected so that their intended responsive, hover and interaction styles actually execute.

11. Settings Evolution

The Version 2.0 Settings interface is organized into:

Account
Security
Authentication
Sessions
Data Controls

This structure provides clear separation between identity management, security, authentication methods, active sessions and personal data management.

It also provides a scalable foundation for future account functionality.

12. Backend Protection

Version 2.0 changes the backend security model from relying primarily on the application's frontend to requiring authenticated backend access.

Sensitive operations use the authenticated Firebase identity.

The backend does not simply trust a UID supplied by the browser.

Instead:

Client → Firebase Authentication → ID Token → Backend Verification → Authenticated UID → Authorized Operation

This establishes a much stronger security boundary.

Version 1.0 → Version 2.0: Product Evolution
Version 1.0

Functional Foundation

Version 1.0 established:

AI legal chat
User authentication
Registration
Login
Conversation storage
Chat interface
Settings
Lawyer interface
Basic backend services

It successfully established the foundation of the platform.

However, as the system evolved, several areas required additional engineering attention.

Version 2.0

Security, Reliability, Privacy & Professionalization

Version 2.0 builds upon that foundation by introducing:

Stronger authentication
MFA
Email OTP verification
Protected AI APIs
Rate limiting
Persistent AI usage limits
Five-hour cooldowns
Data Controls
Chat export
Permanent bulk deletion
Consent workflows
Centralized feedback
Unified design system
Skeleton loading
Responsive corrections
Chat reliability improvements
Better session handling
Improved error handling
Repository security improvements

The result is a platform that is substantially more mature in terms of security, user control, reliability, maintainability and overall product experience.

Version 2.0 Security Model

The platform now follows a layered security approach:

                    USER
                     │
                     ▼
          Firebase Authentication
                     │
                     ▼
            ID Token Generation
                     │
                     ▼
             Backend Verification
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Rate Limiting        User Identity
          │                     │
          └──────────┬──────────┘
                     ▼
              Authorized API
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
       OpenAI API            Firestore
                              │
                              ▼
                    User-Owned Data

This layered approach ensures that authentication, authorization, abuse prevention and data isolation are treated as separate security responsibilities.

Version 2.0 Quality Objectives

Version 2.0 was developed around the following quality objectives:

Security

Protect accounts, APIs, conversations and infrastructure from unauthorized access and abuse.

Privacy

Give users meaningful control over their stored conversational data.

Reliability

Ensure authentication, chat, deletion, loading and interaction flows behave predictably.

Consistency

Ensure every major screen follows the same design language.

Performance Perception

Use appropriate loading states and animations to make interactions feel smooth and responsive.

Maintainability

Reduce duplicated styling and establish reusable UI primitives.

Scalability

Create a stronger foundation for future functionality without compromising the existing system.

Current Product Status
Version 2.0 — Finalized

Version 2.0 represents the finalized development milestone of the AI-Powered Legal Counsellor.

The release combines the original Version 1.0 functional foundation with substantial improvements in:

Authentication
Security
AI usage protection
Privacy controls
Conversation management
Data management
Responsive design
Loading experience
Error handling
UI consistency
Application reliability
Maintainability

Technology Stack
Frontend
React
JavaScript
JSX
CSS
Firebase Authentication
Cloud Firestore
Backend
Node.js
Express
Firebase Admin SDK
Cloud Firestore
OpenAI API
Resend
express-rate-limit
Infrastructure & Services
Firebase
Firebase Identity Platform
Firebase Authentication
Cloud Firestore
GitHub
OpenAI
Resend
Development Philosophy

Version 2.0 was developed around the principle:

Build a secure foundation, provide meaningful user control, maintain consistency, and make every interaction feel intentional.

The platform follows four core principles:

Secure by design.
Private by default.
Consistent by interface.
Reliable by architecture.

Disclaimer

The AI-Powered Legal Counsellor is an AI-assisted legal information platform.

Information generated by the system is intended for informational and educational purposes and should not be considered a substitute for professional legal advice.

AI-generated responses may not accurately reflect the law applicable to every jurisdiction, situation or individual circumstance.

Users should consult a qualified legal professional for advice concerning their specific legal circumstances.

Copyright & Intellectual Property

© 2026 Zain Ul Abideen. All Rights Reserved.

The AI-Powered Legal Counsellor, including its original source code, application architecture, user interface, visual design, custom components, documentation, workflows and associated project materials, is an original software project designed and developed by Zain Ul Abideen.

Unless otherwise stated, no portion of the original project may be:

Reproduced
Redistributed
Republished
Modified for commercial redistribution
Resold
Rebranded
Used as the basis of a competing commercial product

without prior written permission from the copyright holder.

Third-party libraries, frameworks, APIs, services, trademarks and other external materials remain the property of their respective owners and are subject to their respective licenses and terms.

DESIGN & DEVELOPMENT

Zain Ul Abideen
Software Engineer
zain@astrasoftdigital.com

AI-Powered Legal Counsellor
Version 2.0.0 — Final Release

© 2026 Zain Ul Abideen — All Rights Reserved.