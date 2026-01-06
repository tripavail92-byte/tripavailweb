-- Creates smoke-test traveler and admin users if they do not already exist
-- IDs are deterministic strings (not uuids) since Prisma uses cuid() in app code

INSERT INTO "User" (id, email, role, "emailVerified", "phoneVerified", "createdAt", "updatedAt")
VALUES ('traveler_smoke_1', 'traveler.smoke@test.com', 'TRAVELER', true, true, now(), now())
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, "emailVerified" = true, "phoneVerified" = true, "updatedAt" = now();

INSERT INTO "User" (id, email, role, "emailVerified", "phoneVerified", "createdAt", "updatedAt")
VALUES ('admin_smoke_1', 'admin.smoke@test.com', 'ADMIN', true, true, now(), now())
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role, "emailVerified" = true, "phoneVerified" = true, "updatedAt" = now();
