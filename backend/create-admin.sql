-- Create admin user with full permissions
INSERT INTO "User" (id, email, phone, role, "emailVerified", "phoneVerified", "createdAt", "updatedAt")
VALUES (
  'admin-user-001',
  'admin@tripavail.com',
  '+1234567890',
  'ADMIN',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET role = 'ADMIN',
    "emailVerified" = true,
    "phoneVerified" = true;

-- Show the created user
SELECT id, email, role FROM "User" WHERE email = 'admin@tripavail.com';
