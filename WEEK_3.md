# WEEK 3: Provider Onboarding & RBAC Enhancement (Days 11-15)

**Dates:** Jan 6-10, 2026  
**Status:** 🟢 READY TO START  
**Team:** 2 Backend Devs + 1 Frontend Dev  
**Critical Path:** YES (required for hotel/tour package creation)

---

## 📌 Week Overview

**Goal:** Build provider onboarding flow with KYC verification gates, RBAC middleware, and basic property/operator setup screens.

**Deliverables:**

✅ **Backend:**

- Provider onboarding API (step tracking, validation)
- KYC document upload + verification workflow
- RBAC guards for protected routes (Admin, Provider, Traveler)
- Property profile creation (hotel operators) - **7-step hotel listing flow**
- Operator profile creation (tour operators)
- Admin verification endpoints
- Hotel package creation API - **10-step package builder**

✅ **Frontend:**

- Provider dashboard shell
- Onboarding wizard UI (multi-step form)
- KYC document upload component
- Admin verification panel
- **Hotel listing wizard (7 steps)** - See `hotel_manager_list_hotel_flow (1).md`
- **Package creation wizard (10 steps)** - See `hotel_manager_package_creation_10_steps.md`

**Completion:** 🎯 Providers can complete onboarding (pending verification); admins can approve/reject; Hotel managers can list properties and create packages

**📚 Reference Documents:**

- [Hotel Listing Flow](<./hotel_manager_list_hotel_flow%20(1).md>) - 7-step property onboarding
- [Package Creation Flow](./hotel_manager_package_creation_10_steps.md) - 10-step package builder

---

## 📅 Daily Breakdown

### Day 11 (Mon, Jan 6): RBAC Guards & Middleware

**Morning Standup:**

- Review completed Week 2 auth (OTP start/verify working)
- Set up branch: `feature/week3-rbac-onboarding`
- Pair assignments: Backend lead + Mid-level, Frontend dev

**Frontend Tasks (2-3 hours):**

1.  **Set up OpenAPI Client Generation**
    - [ ] Configure `openapi-typescript-codegen` or similar tool in the `web` package.
    - [ ] Add a script to `web/package.json` (e.g., `pnpm gen:api`) to generate the client from `backend/openapi.json`.
    - [ ] Replace any manual `fetch` calls in `web/src/lib/api-client.ts` with the newly generated client.
    - [ ] This ensures all frontend API calls are type-safe and in sync with the backend specification.

**Backend Tasks (3-4 hours):**

1. **Create RBAC guard infrastructure**

```bash
cd backend/src
mkdir -p rbac/{guards,decorators}
```

2. **Role-based guard implementation**

```typescript
// src/rbac/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// src/rbac/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

3. **JWT Auth Guard (reusable)**

```typescript
// src/rbac/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

4. **Apply guards to existing endpoints**

```typescript
// src/partners/partners.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { Roles } from '../rbac/decorators/roles.decorator';
import { RolesGuard } from '../rbac/guards/roles.guard';

@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController {
  @Post('start')
  @Roles('TRAVELER') // Can become provider
  async startOnboarding(@CurrentUser() user) {
    /* ... */
  }

  @Get('me')
  @Roles('TRAVELER', 'ADMIN')
  async getProviderProfiles(@CurrentUser() user) {
    /* ... */
  }
}
```

**Tests (1 hour):**

- Test protected routes return 401 without token
- Test role mismatch returns 403
- Test correct role allows access

**End of Day Checklist:**

- [ ] All existing endpoints protected with guards
- [ ] Tests passing
- [ ] Commit: `feat(rbac): add role guards and auth middleware`

---

### Day 12 (Tue, Jan 7): Provider Onboarding Module

**Backend Tasks (4-5 hours):**

1. **Create provider onboarding module**

```bash
cd backend/src
nest g module provider_onboarding
nest g service provider_onboarding
nest g controller provider_onboarding
```

2. **Onboarding service with step tracking**

```typescript
// src/provider_onboarding/provider_onboarding.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ProviderOnboardingService {
  constructor(private prisma: PrismaService) {}

  async startOnboarding(userId: string, providerType: 'HOTEL_MANAGER' | 'TOUR_OPERATOR') {
    // Create provider profile if doesn't exist
    const profile = await this.prisma.providerProfile.upsert({
      where: { userId_providerType: { userId, providerType } },
      create: {
        userId,
        providerType,
        verificationStatus: 'NOT_STARTED',
        onboardingStep: 1,
      },
      update: {},
    });

    // Create onboarding tracker
    const onboarding = await this.prisma.providerOnboarding.upsert({
      where: { providerId: profile.id },
      create: {
        providerId: profile.id,
        currentStep: 1,
        completedSteps: [],
      },
      update: {},
    });

    return { profile, onboarding };
  }

  async updateStep(providerId: string, step: number, data: any) {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
    });

    if (!onboarding) {
      throw new BadRequestException('Onboarding not found');
    }

    // Validate step sequence
    if (step > onboarding.currentStep + 1) {
      throw new BadRequestException('Complete previous steps first');
    }

    // Update completed steps
    const completedSteps = [...onboarding.completedSteps, step].filter(
      (v, i, a) => a.indexOf(v) === i,
    );

    return this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        currentStep: Math.max(step, onboarding.currentStep),
        completedSteps,
        updatedAt: new Date(),
      },
    });
  }

  async submitForReview(providerId: string) {
    const onboarding = await this.prisma.providerOnboarding.findUnique({
      where: { providerId },
    });

    const totalSteps = 5; // Hotel: 5 steps, Tour: will be 14 steps in week 4
    if (onboarding.completedSteps.length < totalSteps) {
      throw new BadRequestException('Complete all steps before submitting');
    }

    await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: { verificationStatus: 'SUBMITTED' },
    });

    await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: { submittedAt: new Date() },
    });

    return { message: 'Submitted for admin review' };
  }

  async getOnboardingStatus(providerId: string) {
    return this.prisma.providerOnboarding.findUnique({
      where: { providerId },
      include: {
        profile: true,
      },
    });
  }
}
```

3. **Controller endpoints**

```typescript
// src/provider_onboarding/provider_onboarding.controller.ts
import { Controller, Post, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../rbac/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProviderOnboardingService } from './provider_onboarding.service';

@ApiTags('provider-onboarding')
@Controller('provider-onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProviderOnboardingController {
  constructor(private readonly service: ProviderOnboardingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start provider onboarding' })
  async start(@CurrentUser() user, @Body() dto: { providerType: string }) {
    return this.service.startOnboarding(user.id, dto.providerType);
  }

  @Patch(':providerId/step')
  @ApiOperation({ summary: 'Update onboarding step' })
  async updateStep(
    @Param('providerId') providerId: string,
    @Body() dto: { step: number; data: any },
  ) {
    return this.service.updateStep(providerId, dto.step, dto.data);
  }

  @Post(':providerId/submit')
  @ApiOperation({ summary: 'Submit onboarding for review' })
  async submit(@Param('providerId') providerId: string) {
    return this.service.submitForReview(providerId);
  }

  @Get(':providerId/status')
  @ApiOperation({ summary: 'Get onboarding status' })
  async getStatus(@Param('providerId') providerId: string) {
    return this.service.getOnboardingStatus(providerId);
  }
}
```

**End of Day Checklist:**

- [ ] Onboarding module created
- [ ] Step tracking service working
- [ ] Endpoints tested in Swagger
- [ ] Commit: `feat(onboarding): add provider onboarding step tracker`

---

### Day 13 (Wed, Jan 8): KYC & Document Upload

**Backend Tasks (4 hours):**

1. **Create KYC module**

```bash
nest g module kyc
nest g service kyc
nest g controller kyc
```

2. **Signed URL generation for S3/MinIO**

```typescript
// src/kyc/kyc.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async generateUploadUrl(providerId: string, documentType: string) {
    // For Week 3: Return mock signed URL (MinIO integration in Phase 2)
    const key = `kyc/${providerId}/${documentType}_${Date.now()}.pdf`;
    const signedUrl = `http://localhost:9000/uploads/${key}?expires=3600`;

    // Store document record
    await this.prisma.kycDocument.create({
      data: {
        providerId,
        documentType,
        status: 'PENDING_UPLOAD',
        s3Key: key,
      },
    });

    return { uploadUrl: signedUrl, key };
  }

  async markUploaded(providerId: string, key: string) {
    return this.prisma.kycDocument.updateMany({
      where: { providerId, s3Key: key },
      data: { status: 'UPLOADED', uploadedAt: new Date() },
    });
  }

  async listDocuments(providerId: string) {
    return this.prisma.kycDocument.findMany({
      where: { providerId },
      orderBy: { uploadedAt: 'desc' },
    });
  }
}
```

3. **KYC endpoints**

```typescript
// src/kyc/kyc.controller.ts
@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('upload-url')
  @ApiOperation({ summary: 'Generate signed upload URL' })
  async generateUploadUrl(@Body() dto: { providerId: string; documentType: string }) {
    return this.kycService.generateUploadUrl(dto.providerId, dto.documentType);
  }

  @Post('confirm-upload')
  @ApiOperation({ summary: 'Confirm document uploaded' })
  async confirmUpload(@Body() dto: { providerId: string; key: string }) {
    return this.kycService.markUploaded(dto.providerId, dto.key);
  }

  @Get('documents/:providerId')
  @ApiOperation({ summary: 'List KYC documents' })
  async listDocuments(@Param('providerId') providerId: string) {
    return this.kycService.listDocuments(providerId);
  }
}
```

**Frontend Tasks (2 hours):**

1. **Create file upload component**

```tsx
// web/components/kyc/document-upload.tsx
'use client';
import { useState } from 'react';

export function DocumentUpload({ providerId, documentType }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);

    // 1. Get signed URL
    const { uploadUrl, key } = await fetch('/api/kyc/upload-url', {
      method: 'POST',
      body: JSON.stringify({ providerId, documentType }),
    }).then((r) => r.json());

    // 2. Upload to S3/MinIO
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
    });

    // 3. Confirm upload
    await fetch('/api/kyc/confirm-upload', {
      method: 'POST',
      body: JSON.stringify({ providerId, key }),
    });

    setUploading(false);
  };

  return (
    <div className="border-2 border-dashed p-8">
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

**End of Day Checklist:**

- [ ] KYC module endpoints working
- [ ] Document upload component tested
- [ ] Commit: `feat(kyc): add document upload with signed URLs`

---

### Day 14 (Thu, Jan 9): Admin Verification Panel

**Backend Tasks (3 hours):**

1. **Admin verification endpoints**

```typescript
// src/providers/providers.controller.ts (add admin routes)
@Post('verify/:providerId')
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiOperation({ summary: 'Admin: Approve or reject provider' })
async verifyProvider(
  @Param('providerId') providerId: string,
  @Body() dto: { action: 'APPROVE' | 'REJECT'; reason?: string },
  @CurrentUser() admin,
) {
  // Audit log
  await this.auditService.log({
    userId: admin.id,
    action: 'PROVIDER_VERIFICATION',
    resource: providerId,
    details: dto,
  });

  if (dto.action === 'APPROVE') {
    await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        verificationStatus: 'APPROVED',
      },
    });
    await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: { approvedAt: new Date() },
    });
  } else {
    await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        verificationStatus: 'REJECTED',
      },
    });
    await this.prisma.providerOnboarding.update({
      where: { providerId },
      data: {
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });
  }

  return { success: true };
}

@Get('pending-verification')
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiOperation({ summary: 'Admin: List providers pending verification' })
async getPendingProviders() {
  return this.prisma.providerProfile.findMany({
    where: {
      verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
    },
    include: {
      user: true,
      onboarding: true,
      kycDocuments: true,
    },
  });
}
```

**Frontend Tasks (3 hours):**

1. **Admin verification table**

```tsx
// web/app/(admin)/admin/verification/page.tsx
export default async function VerificationPage() {
  const providers = await fetch('/api/providers/pending-verification').then((r) => r.json());

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Provider Verification</h1>
      <table className="w-full">
        <thead>
          <tr>
            <th>Provider ID</th>
            <th>Type</th>
            <th>Submitted</th>
            <th>Documents</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.providerType}</td>
              <td>{p.onboarding.submittedAt}</td>
              <td>{p.kycDocuments.length} docs</td>
              <td>
                <button onClick={() => approve(p.id)}>Approve</button>
                <button onClick={() => reject(p.id)}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**End of Day Checklist:**

- [ ] Admin verification endpoints working
- [ ] Admin panel displaying pending providers
- [ ] Approve/Reject actions functional
- [ ] Commit: `feat(admin): add provider verification panel`

---

### Day 15 (Fri, Jan 10): Property/Operator Profile Setup

**Backend Tasks (4 hours):**

1. **Property profile module (hotel operators)**

```typescript
// src/properties/properties.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class PropertiesService {
  async createProperty(providerId: string, data: CreatePropertyDto) {
    // Only APPROVED providers can create properties
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (profile.verificationStatus !== 'APPROVED') {
      throw new BadRequestException('Provider must be verified first');
    }

    return this.prisma.property.create({
      data: {
        providerId,
        name: data.name,
        type: data.type,
        address: data.address,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        status: 'DRAFT', // Can publish after property is complete
      },
    });
  }

  async getProperties(providerId: string) {
    return this.prisma.property.findMany({
      where: { providerId },
    });
  }
}
```

2. **Operator profile module (tour operators)**

```typescript
// src/operators/operators.service.ts
@Injectable()
export class OperatorsService {
  async createOperatorProfile(providerId: string, data: CreateOperatorDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (profile.verificationStatus !== 'APPROVED') {
      throw new BadRequestException('Provider must be verified first');
    }

    return this.prisma.operatorProfile.create({
      data: {
        providerId,
        companyName: data.companyName,
        operatingRegions: data.operatingRegions,
        specializations: data.specializations,
        // ... other fields
      },
    });
  }
}
```

**Frontend Tasks (2 hours):**

1. **Property setup wizard (5 steps)**

```tsx
// web/app/(provider)/provider/property/new/page.tsx
'use client';
import { useState } from 'react';

export default function NewPropertyPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add New Property</h1>

      {/* Step indicator */}
      <div className="flex mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={step >= s ? 'text-blue-600' : 'text-gray-400'}>
            Step {s}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && <PropertyBasicInfo onNext={() => setStep(2)} />}

      {/* Step 2: Location */}
      {step === 2 && <PropertyLocation onNext={() => setStep(3)} />}

      {/* Step 3: Amenities */}
      {step === 3 && <PropertyAmenities onNext={() => setStep(4)} />}

      {/* Step 4: Policies */}
      {step === 4 && <PropertyPolicies onNext={() => setStep(5)} />}

      {/* Step 5: Review & Submit */}
      {step === 5 && <PropertyReview onSubmit={handleSubmit} />}
    </div>
  );
}
```

**End of Day Checklist:**

- [ ] Property profile creation working
- [ ] Operator profile creation working
- [ ] Verification gate enforced (only APPROVED can create)
- [ ] Frontend wizard functional
- [ ] Week 3 complete!
- [ ] Commit: `feat(properties): add property/operator profile setup`

---

## ✅ Week 3 Success Criteria

By end of week, you should have:

1. **RBAC Infrastructure:**
   - ✅ JWT auth guard working on all protected routes
   - ✅ Role-based guards (ADMIN, TRAVELER roles)
   - ✅ 401 for missing token, 403 for wrong role

2. **Provider Onboarding:**
   - ✅ Multi-step onboarding tracker
   - ✅ Step validation (can't skip steps)
   - ✅ Submit for review endpoint

3. **KYC System:**
   - ✅ Signed URL generation for uploads
   - ✅ Document status tracking
   - ✅ Frontend upload component

4. **Admin Verification:**
   - ✅ Admin panel listing pending providers
   - ✅ Approve/Reject actions with audit logs
   - ✅ Verification status updates

5. **Property/Operator Setup:**
   - ✅ Property profile creation (hotel managers)
   - ✅ Operator profile creation (tour operators)
   - ✅ Verification gate enforced
   - ✅ Basic wizard UI

---

## 🚀 Week 4 Preview

**Focus:** Hotel Packages (14 templates) + Room Inventory Management

- Hotel package templates (Weekend Getaway, Honeymoon, etc.)
- Room type configuration
- Availability calendar
- Pricing rules
- Package publishing gate (requires APPROVED provider)

---

## 📊 Testing Checklist5. **Create auth controller**

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  async register(@Body() body: { email: string; password: string; role?: string }) {
    return this.authService.register(body.email, body.password, body.role);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
```

6. **Update User model** (in Prisma schema - if not done in Week 2)

   ```prisma
   model User {
     id        String    @id @default(uuid())
     email     String    @unique
     password  String
     roles     String[]  @default(["TRAVELER"]) // TRAVELER, PROVIDER, ADMIN, SUPPORT
     status    String    @default("ACTIVE") // ACTIVE, SUSPENDED, VERIFIED_PENDING
     profile   Json?
     createdAt DateTime  @default(now())
     updatedAt DateTime  @updatedAt

     @@index([email])
   }
   ```

**Testing:**

```bash
# Create test file
touch backend/src/auth/auth.controller.spec.ts

# In spec file:
# - Test register: valid email/password → tokens returned
# - Test register: duplicate email → BadRequestException
# - Test login: valid credentials → tokens returned
# - Test login: invalid password → UnauthorizedException
```

**EOD Checklist:**

- [ ] `pnpm test -- src/auth/auth.controller.spec.ts` passing
- [ ] JWT strategy compiles
- [ ] Auth service has password hashing
- [ ] Swagger docs visible
- [ ] Commit: `feat: add JWT authentication`

---

### Day 12 (Tue, Jan 7): Token Refresh & Password Reset

**Morning Task:**

- Review Day 11 code
- All tests still passing?
- Branch: `feature/auth-jwt` (continue)

**Tasks:**

1. **Create refresh token endpoint**

   ```typescript
   // Add to auth.service.ts
   async refreshTokens(refreshToken: string) {
     try {
       const payload = this.jwtService.verify(refreshToken, {
         secret: process.env.REFRESH_TOKEN_SECRET,
       });
       return this.generateTokens(payload);
     } catch {
       throw new UnauthorizedException('Invalid refresh token');
     }
   }
   ```

   ```typescript
   // Add to auth.controller.ts
   @Post('refresh')
   @HttpCode(HttpStatus.OK)
   @ApiOperation({ summary: 'Refresh access token' })
   async refresh(@Body() body: { refreshToken: string }) {
     return this.authService.refreshTokens(body.refreshToken);
   }
   ```

2. **Create password reset flow**

   ```typescript
   // Add to auth.service.ts
   async requestPasswordReset(email: string) {
     const user = await this.prisma.user.findUnique({ where: { email } });
     if (!user) {
       // Don't leak if email exists
       return { message: 'If user exists, reset email sent' };
     }

     // Generate reset token (1 hour expiry)
     const resetToken = this.jwtService.sign(
       { sub: user.id, type: 'password-reset' },
       { expiresIn: '1h', secret: process.env.RESET_TOKEN_SECRET },
     );

     // TODO: Send email with reset link (Week 12)
     console.log(`Reset token: ${resetToken}`);

     return { message: 'Reset email sent' };
   }

   async resetPassword(resetToken: string, newPassword: string) {
     const payload = this.jwtService.verify(resetToken, {
       secret: process.env.RESET_TOKEN_SECRET,
     });

     const hashedPassword = await bcrypt.hash(newPassword, 10);
     await this.prisma.user.update({
       where: { id: payload.sub },
       data: { password: hashedPassword },
     });

     return { message: 'Password reset successful' };
   }
   ```

   ```typescript
   // Add to auth.controller.ts
   @Post('password-reset/request')
   @HttpCode(HttpStatus.OK)
   @ApiOperation({ summary: 'Request password reset' })
   async requestReset(@Body() body: { email: string }) {
     return this.authService.requestPasswordReset(body.email);
   }

   @Post('password-reset/confirm')
   @HttpCode(HttpStatus.OK)
   @ApiOperation({ summary: 'Confirm password reset' })
   async confirmReset(
     @Body() body: { resetToken: string; newPassword: string },
   ) {
     return this.authService.resetPassword(body.resetToken, body.newPassword);
   }
   ```

3. **Create password validation DTO**

   ```typescript
   // src/shared/dtos/password.dto.ts
   import { IsString, MinLength, Matches } from 'class-validator';

   export class PasswordDto {
     @IsString()
     @MinLength(12)
     @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
       message: 'Password must contain uppercase, lowercase, number, and special character',
     })
     password: string;
   }
   ```

4. **Add tests for refresh & reset**
   ```typescript
   // In auth.controller.spec.ts, add:
   // - Test refresh: valid token → new tokens
   // - Test refresh: expired token → UnauthorizedException
   // - Test password reset request: valid email → success message
   // - Test password reset confirm: valid token → password updated
   ```

**EOD Checklist:**

- [ ] Refresh endpoint working
- [ ] Password reset flow tests passing
- [ ] All auth tests passing (`pnpm test -- src/auth`)
- [ ] Commit: `feat: add refresh token and password reset`

---

### Day 13 (Wed, Jan 8): RBAC Guards & Decorators

**Morning Task:**

- Verify all auth tests passing
- Branch: `feature/rbac-guards`

**Tasks:**

1. **Create RBAC guard**

   ```typescript
   // src/auth/guards/roles.guard.ts
   import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
   import { Reflector } from '@nestjs/core';

   @Injectable()
   export class RolesGuard implements CanActivate {
     constructor(private reflector: Reflector) {}

     canActivate(context: ExecutionContext): boolean {
       const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
       if (!requiredRoles) {
         return true; // No role required, allow all authenticated
       }

       const request = context.switchToHttp().getRequest();
       const user = request.user;

       if (!user || !user.roles) {
         throw new ForbiddenException('Access denied');
       }

       const hasRole = requiredRoles.some((role) => user.roles.includes(role));
       if (!hasRole) {
         throw new ForbiddenException('Insufficient permissions');
       }

       return true;
     }
   }
   ```

2. **Create Roles decorator**

   ```typescript
   // src/auth/decorators/roles.decorator.ts
   import { SetMetadata } from '@nestjs/common';

   export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
   ```

3. **Create Auth guard (JWT validation)**

   ```typescript
   // src/auth/guards/auth.guard.ts
   import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
   import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

   @Injectable()
   export class AuthGuard extends PassportAuthGuard('jwt') {
     canActivate(context: ExecutionContext) {
       return super.canActivate(context);
     }

     handleRequest(err, user) {
       if (err || !user) {
         throw new UnauthorizedException('Invalid or missing token');
       }
       return user;
     }
   }
   ```

4. **Create example protected route**

   ```typescript
   // src/users/users.controller.ts
   import { Controller, Get, UseGuards } from '@nestjs/common';
   import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
   import { AuthGuard } from '../auth/guards/auth.guard';
   import { Roles } from '../auth/decorators/roles.decorator';
   import { RolesGuard } from '../auth/guards/roles.guard';

   @ApiTags('users')
   @Controller('v1/users')
   export class UsersController {
     @Get('me')
     @UseGuards(AuthGuard)
     @ApiBearerAuth()
     async getMe(@Request() req) {
       return {
         id: req.user.userId,
         email: req.user.email,
         roles: req.user.roles,
       };
     }

     @Get('admin-only')
     @UseGuards(AuthGuard, RolesGuard)
     @Roles('ADMIN')
     @ApiBearerAuth()
     async adminEndpoint() {
       return { message: 'Admin access granted' };
     }

     @Get('provider-only')
     @UseGuards(AuthGuard, RolesGuard)
     @Roles('PROVIDER', 'ADMIN')
     @ApiBearerAuth()
     async providerEndpoint() {
       return { message: 'Provider access granted' };
     }
   }
   ```

5. **Add tests for guards**
   ```typescript
   // src/auth/guards/roles.guard.spec.ts
   // - Test: User without required role → ForbiddenException
   // - Test: User with required role → access granted
   // - Test: No role requirement → all authenticated users allowed
   ```

**EOD Checklist:**

- [ ] AuthGuard working on `/v1/users/me`
- [ ] RolesGuard blocking unauthorized roles
- [ ] Swagger docs show @ApiBearerAuth()
- [ ] All guard tests passing
- [ ] Commit: `feat: add RBAC guards and decorators`

---

### Day 14 (Thu, Jan 9): Rate Limiting & Email Verification Setup

**Morning Task:**

- All guards working?
- Branch: `feature/rate-limiting`

**Tasks:**

1. **Install rate limiting package**

   ```bash
   cd backend
   pnpm add @nestjs/throttler
   ```

2. **Configure rate limiting in AppModule**

   ```typescript
   // src/app.module.ts
   import { Module } from '@nestjs/common';
   import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
   import { APP_GUARD } from '@nestjs/core';

   @Module({
     imports: [
       ThrottlerModule.forRoot([
         {
           ttl: 60000, // 1 minute
           limit: 100, // 100 requests per minute (default authenticated)
         },
       ]),
       // ... other imports
     ],
     providers: [
       {
         provide: APP_GUARD,
         useClass: ThrottlerGuard,
       },
     ],
   })
   export class AppModule {}
   ```

3. **Create custom rate limit decorators**

   ```typescript
   // src/common/decorators/rate-limit.decorator.ts
   import { SetMetadata } from '@nestjs/common';

   export const RateLimit = (limit: number) => SetMetadata('throttle-limit', limit);
   export const SkipThrottle = () => SetMetadata('skip-throttle', true);

   // Usage:
   // @RateLimit(3) // 3 requests per minute
   // @Post('login')
   // async login(...) { }
   ```

4. **Apply stricter limits to auth endpoints**

   ```typescript
   // Update auth.controller.ts
   import { RateLimit } from '../common/decorators/rate-limit.decorator';

   @Post('login')
   @RateLimit(3) // 3 login attempts per minute
   @HttpCode(HttpStatus.OK)
   async login(@Body() body: { email: string; password: string }) {
     return this.authService.login(body.email, body.password);
   }

   @Post('register')
   @RateLimit(5) // 5 registrations per minute
   async register(@Body() body: { email: string; password: string }) {
     return this.authService.register(body.email, body.password);
   }
   ```

5. **Setup email verification (stub for Week 12)**

   ```typescript
   // src/auth/auth.service.ts - add to register method:
   async register(email: string, password: string, role: string = 'TRAVELER') {
     // ... existing code ...

     const user = await this.prisma.user.create({
       data: {
         email,
         password: hashedPassword,
         roles: [role],
         status: 'EMAIL_VERIFICATION_PENDING', // Changed
       },
     });

     // TODO: Queue email verification job (Week 12)
     // this.notificationQueue.add('send-verification-email', { userId: user.id });

     return {
       message: 'Registration successful. Check your email to verify.',
     };
   }
   ```

6. **Add email verification endpoint (stub)**

   ```typescript
   // Add to auth.controller.ts
   @Post('email-verify')
   @HttpCode(HttpStatus.OK)
   @ApiOperation({ summary: 'Verify email' })
   async verifyEmail(@Body() body: { verificationToken: string }) {
     return this.authService.verifyEmail(body.verificationToken);
   }
   ```

7. **Tests for rate limiting**
   ```bash
   # In spec files:
   # - Test: Login endpoint accepts 3 requests then throttles
   # - Test: Register endpoint accepts 5 requests then throttles
   # - Test: Subsequent request returns 429 Too Many Requests
   ```

**EOD Checklist:**

- [ ] Rate limiting working (test by calling endpoint 5+ times)
- [ ] Auth endpoints have stricter limits
- [ ] Tests passing
- [ ] Commit: `feat: add rate limiting and email verification stub`

---

### Day 15 (Fri, Jan 10): Testing, Documentation & Review

**Morning Task:**

- Verify all auth endpoints working
- Branch: `feature/auth-jwt` (merge PR today)

**Tasks:**

1. **Complete integration tests**

   ```bash
   cd backend
   pnpm test -- src/auth --coverage
   ```

   Target: **70% coverage minimum**

2. **Create auth documentation**

   ````markdown
   # Authentication Guide

   ## Endpoints

   ### Register

   POST /v1/auth/register

   ```json
   {
     "email": "user@example.com",
     "password": "SecurePass123!@#",
     "role": "TRAVELER" // optional
   }
   ```
   ````

   ### Login

   POST /v1/auth/login

   ```json
   {
     "email": "user@example.com",
     "password": "SecurePass123!@#"
   }
   ```

   Response:

   ```json
   {
     "accessToken": "eyJhbGc...",
     "refreshToken": "eyJhbGc..."
   }
   ```

   ### Refresh Token

   POST /v1/auth/refresh

   ```json
   {
     "refreshToken": "eyJhbGc..."
   }
   ```

   ### Protected Routes

   Include token in header:

   ```
   Authorization: Bearer <accessToken>
   ```

   ## Roles
   - **TRAVELER**: Book stays and tours
   - **PROVIDER**: Create and manage listings/packages
   - **ADMIN**: Manage platform and users
   - **SUPPORT**: Handle disputes and tickets

   ```

   ```

3. **Update Swagger documentation**
   - Add @ApiBearerAuth() to all protected endpoints
   - Add @ApiUnauthorizedResponse()
   - Add @ApiForbiddenResponse()
   - Run: `pnpm run swagger:generate`

4. **Create test data script**

   ```typescript
   // scripts/seed-auth.ts
   import { PrismaClient } from '@prisma/client';
   import * as bcrypt from 'bcrypt';

   const prisma = new PrismaClient();

   async function main() {
     // Create test users
     const testPassword = await bcrypt.hash('TestPass123!@#', 10);

     await prisma.user.createMany({
       data: [
         { email: 'traveler@test.com', password: testPassword, roles: ['TRAVELER'] },
         { email: 'provider@test.com', password: testPassword, roles: ['PROVIDER'] },
         { email: 'admin@test.com', password: testPassword, roles: ['ADMIN'] },
       ],
     });

     console.log('Seed complete');
   }

   main()
     .catch(console.error)
     .finally(() => prisma.$disconnect());
   ```

   ```bash
   # Run seed
   npx ts-node scripts/seed-auth.ts
   ```

5. **Performance testing**

   ```bash
   # Load test login endpoint (via k6 or Artillery)
   # Verify response time < 200ms with 10 concurrent users
   ```

6. **Security review checklist**
   - [ ] Passwords hashed with bcrypt (10+ rounds)
   - [ ] Tokens have expiration (15m access, 7d refresh)
   - [ ] Reset tokens 1 hour TTL
   - [ ] Rate limits on auth endpoints
   - [ ] No sensitive data in logs
   - [ ] SQL injection protected (Prisma parameterization)
   - [ ] CORS whitelist applied

7. **Create PR & request review**
   ```bash
   git push origin feature/auth-jwt
   # Open PR to main
   # Link WEEK_3 Day 15 checklist
   ```

**Week Completion Checklist:**

- [ ] All auth tests passing (>70% coverage)
- [ ] Swagger docs complete with examples
- [ ] Rate limiting verified (manual test)
- [ ] PR approved and merged
- [ ] Zero security warnings
- [ ] Documentation updated
- [ ] Commit: `feat: complete authentication and RBAC`

---

## 🎯 Success Criteria

**By EOW (Jan 10):**
✅ User can register with email/password  
✅ User can login and receive JWT tokens  
✅ Refresh token generates new access token  
✅ Password reset flow implemented  
✅ Protected routes require valid JWT  
✅ RBAC guards enforce role requirements  
✅ Rate limiting active on auth endpoints  
✅ All tests passing (70%+ coverage)  
✅ Swagger docs complete  
✅ PR merged to main

**Unblocks:** Week 4 (Provider Onboarding)

---

## 📊 Week 3 Metrics

| Metric               | Target | Status |
| -------------------- | ------ | ------ |
| Test Coverage        | 70%+   | ⬜     |
| API Response Time    | <200ms | ⬜     |
| All Tests Passing    | 100%   | ⬜     |
| Swagger Completion   | 100%   | ⬜     |
| Code Review Approval | ✅     | ⬜     |

---

## 🚀 Week 3 → Week 4 Transition

**Deliverables to Week 4:**

- ✅ Users can login/register
- ✅ RBAC guards active
- ✅ JWT tokens working
- ✅ Rate limiting in place

**Week 4 assumes:**

- Auth module is production-ready
- Can call `/v1/auth/login` reliably
- Protected routes work correctly
- Ready to build provider onboarding on top

---

**Last Updated:** 26 Dec 2025  
**Owner:** Senior Dev  
**Status:** 🟢 In Progress - Day 12 Complete

---

## 🏨 Extended Implementation Notes: Hotel Manager Flows

### Architecture Overview

```
Provider Journey (Post-Week 3):
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Provider Verification (Week 3)                     │
├─────────────────────────────────────────────────────────────┤
│ Step 1-5: Provider Onboarding ✅ (Day 12 COMPLETE)         │
│ - Business info, KYC, banking details                       │
│ - Submit for review → verificationStatus: SUBMITTED         │
│                                                              │
│ Day 13-14: Admin Verification                               │
│ - Admin reviews documents                                   │
│ - Approve → verificationStatus: APPROVED                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Property Setup (Day 15 - Week 4)                  │
├─────────────────────────────────────────────────────────────┤
│ 🏨 Hotel Listing Flow (7 steps)                            │
│ [hotel_manager_list_hotel_flow (1).md]                     │
│                                                              │
│ Step 1: Welcome & Overview                                  │
│ Step 2: Basic Hotel Information                            │
│ Step 3: Location & Address                                 │
│ Step 4: Room Configuration                                 │
│ Step 5: Amenities & Services                               │
│ Step 6: Policies & Rules                                   │
│ Step 7: Review & Submit                                    │
│                                                              │
│ Creates: Listing + Room[] records                          │
│ Gated by: verificationStatus === 'APPROVED'                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Package Creation (Week 4-5)                       │
├─────────────────────────────────────────────────────────────┤
│ 📦 Package Builder Flow (10 steps)                         │
│ [hotel_manager_package_creation_10_steps.md]               │
│                                                              │
│ Step 1: Choose Package Type                                │
│ Step 2: Package Basics                                     │
│ Step 3: Media Upload                                       │
│ Step 4: Highlights                                         │
│ Step 5: Inclusions                                         │
│ Step 6: Exclusions                                         │
│ Step 7: Pricing                                            │
│ Step 8: Calendar & Availability                            │
│ Step 9: Policies                                           │
│ Step 10: Review & Publish                                  │
│                                                              │
│ Creates: HotelPackage records                              │
│ Requires: Listing record exists (property setup done)      │
│ Gated by: verificationStatus === 'APPROVED'                │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Integration

The two flows map to existing schema:

**Hotel Listing Flow (7 steps) → Database:**

```sql
-- Steps 2-3: Basic Info & Location
INSERT INTO "Listing" (
  name, address, city, latitude, longitude,
  description, checkInTime, checkOutTime, status
) VALUES (...);

-- Step 4: Room Configuration
INSERT INTO "Room" (
  listingId, name, capacity, bedConfig, basePrice
) VALUES (...);

-- Step 5: Amenities (NEW TABLE NEEDED)
CREATE TABLE listing_amenities (
  id TEXT PRIMARY KEY,
  listing_id TEXT REFERENCES listings(id),
  amenity TEXT,
  category TEXT -- 'basic', 'technology', 'recreation'
);

-- Step 6: Policies (use existing Listing columns)
UPDATE "Listing" SET
  cancellation_policy = '...',
  house_rules = '...'
WHERE id = :listingId;
```

**Package Creation Flow (10 steps) → Database:**

```sql
-- Steps 1-2: Package Type & Basics
INSERT INTO "HotelPackage" (
  providerId, listingId, packageType,
  name, description, duration, status, basePrice
) VALUES (...);

-- Step 3: Media (use existing media handling)
-- Step 4-6: Package content (stored in JSON fields)
UPDATE "HotelPackage" SET
  highlights = :highlightsJson,
  inclusions = :inclusionsJson,
  exclusions = :exclusionsJson
WHERE id = :packageId;

-- Step 7-8: Pricing & Availability
-- Uses inventory_nights or custom availability table
```

### Implementation Phases

**Week 3 (Current):**

- ✅ Days 11-12: Provider onboarding backend (COMPLETE)
- 🔄 Days 13-14: KYC + Admin verification
- ⏸️ Day 15: Property/Package scaffolding only

**Week 4 (Next):**

- Hotel Listing Flow frontend implementation
- Room configuration builder
- Amenities selection interface
- Policy template system

**Week 5:**

- Package Creation Flow frontend
- Package type templates (8 types defined)
- Media upload + preview
- Pricing calculator

### Key Technical Decisions

1. **Step Validation Pattern (Reuse from Day 12)**

   ```typescript
   // Same pattern used in provider_onboarding.service.ts
   if (step > currentStep + 1) {
     throw new BadRequestException('Cannot skip steps');
   }
   ```

2. **Progress Tracking**

   ```typescript
   // Hotel Listing: 7 steps
   const progress = (completedSteps.length / 7) * 100;

   // Package Creation: 10 steps
   const progress = (completedSteps.length / 10) * 100;
   ```

3. **Verification Gate**

   ```typescript
   // Before allowing property/package creation
   const provider = await prisma.providerProfile.findUnique({
     where: { userId },
   });

   if (provider.verificationStatus !== 'APPROVED') {
     throw new ForbiddenException('Complete provider verification before listing properties');
   }
   ```

### API Endpoints Roadmap

**Week 3 (Provider Verification):**

```
POST   /v1/provider-onboarding/start          ✅ DONE
PATCH  /v1/provider-onboarding/:id/step       ✅ DONE
POST   /v1/provider-onboarding/:id/submit     ✅ DONE
GET    /v1/provider-onboarding/:id/status     ✅ DONE
```

**Week 4 (Hotel Listing):**

```
POST   /v1/listings/start                     🔜 Week 4
PATCH  /v1/listings/:id/step                  🔜 Week 4
POST   /v1/listings/:id/rooms                 🔜 Week 4
POST   /v1/listings/:id/amenities             🔜 Week 4
POST   /v1/listings/:id/publish               🔜 Week 4
```

**Week 5 (Package Creation):**

```
POST   /v1/hotel-packages/start               🔜 Week 5
PATCH  /v1/hotel-packages/:id/step            🔜 Week 5
POST   /v1/hotel-packages/:id/media           🔜 Week 5
POST   /v1/hotel-packages/:id/publish         🔜 Week 5
```

### UI Component Reuse

Both flows share common patterns established in provider onboarding:

```typescript
// Shared components from provider onboarding
<StepProgress currentStep={n} totalSteps={total} />
<StepNavigation onNext={handleNext} onBack={handleBack} />
<AutoSaveIndicator lastSaved={timestamp} />
<ValidationErrors errors={stepErrors} />
<SubmitReviewModal onConfirm={handleSubmit} />

// New flow-specific components
<RoomConfigurationBuilder />      // Hotel listing
<AmenitySelector categories={...} /> // Hotel listing
<PackageTypeGrid types={8} />      // Package creation
<InclusionsEditor />               // Package creation
<PricingCalculator />              // Package creation
```

### Success Metrics

**Week 3 Completion Criteria:**

- ✅ Provider can complete 5-step onboarding
- ✅ Step validation prevents skipping
- ✅ Submit-for-review changes status to SUBMITTED
- 🔜 Admin can approve/reject providers
- 🔜 Approved providers can access property/package creation

**Week 4 Goals (Hotel Listing):**

- Hotel manager can complete 7-step property setup
- Room types configurable with pricing
- Amenities selected from categorized list
- Policy templates applied (Flexible/Moderate/Strict)
- Published listings appear in search

**Week 5 Goals (Package Creation):**

- Hotel manager can create packages (8 types available)
- Package references existing hotel listing
- Media upload with preview
- Pricing calculator shows revenue projections
- Published packages bookable by travelers

---

## 📋 Implementation Checklist

### Week 3 Remaining Work:

- [ ] Day 13: KYC document upload with signed URLs
- [ ] Day 13: Document metadata storage
- [ ] Day 14: Admin verification endpoints
- [ ] Day 14: Audit logging for admin actions
- [ ] Day 15: Listings module scaffolding
- [ ] Day 15: Packages module scaffolding
- [ ] Day 15: Verification gate middleware

### Week 4 Preparation:

- [ ] Add `listing_amenities` table migration
- [ ] Add policy fields to Listing model
- [ ] Create room type templates (Single, Double, Suite, etc.)
- [ ] Design amenity categorization (Basic, Technology, Recreation)
- [ ] Implement Google Maps integration for location picker

### Week 5 Preparation:

- [ ] Define 8 package type templates (Weekend, Romantic, Family, etc.)
- [ ] Create media upload service (S3/MinIO integration)
- [ ] Build pricing calculator logic
- [ ] Design availability calendar component
- [ ] Implement package preview generator

---

**Last Updated:** 26 Dec 2025  
**Owner:** Senior Dev  
**Status:** 🟢 In Progress - Day 12 Complete
