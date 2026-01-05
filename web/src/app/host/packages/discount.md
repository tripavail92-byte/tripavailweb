# Discount Settings Step

## Overview
This step allows hotel managers and tour operators to configure promotional discounts for their packages. It supports toggling discounts, selecting a percentage, setting a date range, and previewing the final price.

## UI Features
- Enable/disable discount toggle
- Quick-pick percentage buttons (5–70%)
- Custom percentage input
- Start/end date pickers
- Pricing preview card
- Validation for percentage and date range

## API Integration
- PATCH `/v1/hotel-packages/:id/discount-settings`
- PATCH `/v1/tour-packages/:id/discount-settings`
- DTO: `{ discountEnabled, discountPercentage, discountStartDate?, discountEndDate? }`

## Validation
- Discount percentage must be between 5% and 70%
- End date must be after start date
- Dates required if discount is enabled

## Tests
- Unit tests for validation logic
- E2E tests for discount flow

## Usage
Add this step after pricing and before media upload in the package builder flow.

---
See DiscountSettings_Complete_Documentation.md for full design and backend details.
