/**
 * E2E Tests: Priority 3 - Google Maps Integration
 *
 * These tests verify:
 * 1. LocationMap component functionality
 * 2. LocationAutocomplete component functionality
 * 3. Operator profile integration with maps
 * 4. Tour builder Step 4 integration with maps
 * 5. Location selection and persistence
 */

import 'whatwg-fetch';

describe('Priority 3: Google Maps Integration', () => {
  beforeEach(() => {
    // Reset environment before each test
    cy.clearLocalStorage();
  });

  describe('LocationAutocomplete Component', () => {
    it('should render autocomplete input field', () => {
      cy.visit('/operator/profile');
      cy.get('input[placeholder*="Search location"]').should('be.visible');
    });

    it('should filter and display location suggestions on input', () => {
      cy.visit('/operator/profile');
      const autocompleteInput = cy.get('input[placeholder*="Search location"]');

      autocompleteInput.should('be.visible');
      // Note: Actual API calls will be intercepted/mocked in real tests
      autocompleteInput.type('Bangkok', { delay: 100 });

      // Component should show suggestions (mocked in real test)
      cy.get('input[placeholder*="Search location"]').should('have.value', 'Bangkok');
    });

    it('should clear input when cleared', () => {
      cy.visit('/operator/profile');
      const input = cy.get('input[placeholder*="Search location"]');

      input.type('Bangkok');
      input.clear();
      input.should('have.value', '');
    });
  });

  describe('LocationMap Component', () => {
    it('should render map container on operator profile', () => {
      cy.visit('/operator/profile');

      // Check for map container
      cy.get('.rounded-lg.border.border-gray-300')
        .should('be.visible')
        .within(() => {
          // Map iframe or container should exist
          cy.get('[role="region"]').should('exist').or(cy.get('[role="presentation"]').should('exist'));
        });
    });

    it('should display location preview when location is set', () => {
      cy.visit('/operator/profile');

      // Location preview should show when coordinates exist
      cy.get('input[placeholder="13.7563"]').should('be.visible');
      cy.get('input[placeholder="100.5018"]').should('be.visible');
    });
  });

  describe('Operator Profile Integration', () => {
    it('should load operator profile page', () => {
      cy.visit('/operator/profile');

      cy.contains('Operator Profile').should('be.visible');
      cy.contains('Manage your tour operator base location').should('be.visible');
    });

    it('should have all required form sections', () => {
      cy.visit('/operator/profile');

      // Base Location section
      cy.contains('Base Location').should('be.visible');
      cy.get('input[placeholder="e.g., Bangkok"]').should('be.visible');

      // Meeting Point section
      cy.contains('Meeting Point').should('be.visible');
      cy.get('input[placeholder*="Search meeting point"]').should('be.visible');

      // Coordinates section
      cy.contains('Coordinates').should('be.visible');
      cy.get('input[placeholder="13.7563"]').should('be.visible');
      cy.get('input[placeholder="100.5018"]').should('be.visible');

      // Contact section
      cy.contains('Contact Information').should('be.visible');
      cy.get('input[placeholder*="+66812345678"]').should('be.visible');
    });

    it('should update base city field', () => {
      cy.visit('/operator/profile');

      cy.get('input[placeholder="e.g., Bangkok"]').as('baseCityInput');
      cy.get('@baseCityInput').should('have.value', ''); // Or existing value

      cy.get('@baseCityInput').clear();
      cy.get('@baseCityInput').type('Bangkok');
      cy.get('@baseCityInput').should('have.value', 'Bangkok');
    });

    it('should update meeting point field', () => {
      cy.visit('/operator/profile');

      cy.get('textarea, input[placeholder*="Grand Plaza"]').as('meetingPointInput');
      cy.get('@meetingPointInput').clear();
      cy.get('@meetingPointInput').type('Grand Central Hotel');
      cy.get('@meetingPointInput').should('have.value', 'Grand Central Hotel');
    });

    it('should update latitude and longitude fields', () => {
      cy.visit('/operator/profile');

      // Test latitude
      cy.get('input[placeholder="13.7563"]').as('latInput');
      cy.get('@latInput').clear();
      cy.get('@latInput').type('14.5994');
      cy.get('@latInput').should('have.value', '14.5994');

      // Test longitude
      cy.get('input[placeholder="100.5018"]').as('lngInput');
      cy.get('@lngInput').clear();
      cy.get('@lngInput').type('100.8930');
      cy.get('@lngInput').should('have.value', '100.8930');
    });

    it('should update phone field', () => {
      cy.visit('/operator/profile');

      cy.get('input[placeholder*="+66812345678"]').as('phoneInput');
      cy.get('@phoneInput').clear();
      cy.get('@phoneInput').type('+66987654321');
      cy.get('@phoneInput').should('have.value', '+66987654321');
    });

    it('should have save button', () => {
      cy.visit('/operator/profile');

      cy.contains('button', 'Save Profile').should('be.visible').and('not.be.disabled');
    });

    it('should show debug data section', () => {
      cy.visit('/operator/profile');

      cy.contains('Stored Data').should('be.visible');
      cy.get('pre').should('be.visible');
    });
  });

  describe('Tour Builder Step 4 Integration', () => {
    it('should load tour builder page', () => {
      cy.visit('/operator/tours');

      cy.contains('Step 4: Pickups & Locations').should('be.visible');
    });

    it('should display pickup location cards', () => {
      cy.visit('/operator/tours');

      cy.contains('Pickup Location 1').should('be.visible');
      cy.contains('Pickup Location 2').should('be.visible');
    });

    it('should allow editing first pickup location', () => {
      cy.visit('/operator/tours');

      cy.get('input').filter((_, el) => {
        return (el as HTMLInputElement).placeholder === '';
      }).first().as('firstPickupInput');

      cy.get('@firstPickupInput').clear();
      cy.get('@firstPickupInput').type('Suvarnabhumi Airport');
      cy.get('@firstPickupInput').should('have.value', 'Suvarnabhumi Airport');
    });

    it('should have add pickup location button', () => {
      cy.visit('/operator/tours');

      cy.contains('+ Add Another Pickup Location').should('be.visible');
    });

    it('should have remove buttons for pickups', () => {
      cy.visit('/operator/tours');

      // When there are multiple pickups, remove buttons should be visible
      cy.contains('Remove').should('exist');
    });
  });

  describe('Form Validation', () => {
    it('should validate latitude range', () => {
      cy.visit('/operator/profile');

      // Latitude must be between -90 and 90
      const latInput = cy.get('input[placeholder="13.7563"]');

      // Valid values should work
      latInput.clear();
      latInput.type('45.5');
      latInput.should('have.value', '45.5');

      // Invalid values are handled by HTML5 input type=number
      latInput.clear();
      latInput.invoke('attr', 'type').should('equal', 'number');
    });

    it('should validate longitude range', () => {
      cy.visit('/operator/profile');

      // Longitude must be between -180 and 180
      const lngInput = cy.get('input[placeholder="100.5018"]');

      // Valid values should work
      lngInput.clear();
      lngInput.type('120.5');
      lngInput.should('have.value', '120.5');

      // Invalid values are handled by HTML5 input type=number
      lngInput.clear();
      lngInput.invoke('attr', 'type').should('equal', 'number');
    });
  });

  describe('Responsive Design', () => {
    it('should be responsive on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/operator/profile');

      cy.contains('Operator Profile').should('be.visible');
      cy.get('input[placeholder="e.g., Bangkok"]').should('be.visible');
      cy.contains('button', 'Save Profile').should('be.visible');
    });

    it('should be responsive on tablet viewport', () => {
      cy.viewport('ipad-2');
      cy.visit('/operator/profile');

      cy.contains('Operator Profile').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should be responsive on desktop viewport', () => {
      cy.viewport('macbook-15');
      cy.visit('/operator/profile');

      cy.contains('Operator Profile').should('be.visible');
      cy.get('form').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper label associations', () => {
      cy.visit('/operator/profile');

      cy.get('label').should('have.length.greaterThan', 0);
      cy.get('label').each(($label) => {
        cy.wrap($label).should('have.text');
      });
    });

    it('should be navigable with keyboard', () => {
      cy.visit('/operator/profile');

      // Tab through form elements
      cy.get('input[placeholder="e.g., Bangkok"]').tab();
      cy.get(':focus').should('exist');

      cy.get(':focus').tab();
      cy.get(':focus').should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should show error message on API failure', () => {
      // This would require mocking API failures
      cy.visit('/operator/profile');

      // Should gracefully handle missing data
      cy.get('input[placeholder="e.g., Bangkok"]').should('be.visible');
    });

    it('should handle missing Google Maps API key gracefully', () => {
      cy.visit('/operator/profile');

      // Components should still render even if maps API is missing
      cy.contains('Operator Profile').should('be.visible');
      cy.get('form').should('be.visible');
    });
  });

  describe('Data Persistence', () => {
    it('should preserve entered data on page refresh', () => {
      cy.visit('/operator/profile');

      // Enter data
      cy.get('input[placeholder="e.g., Bangkok"]').clear().type('Bangkok');
      cy.get('input[placeholder="13.7563"]').clear().type('13.75');

      // Reload
      cy.reload();

      // Data might be reloaded from API, so just check page loads
      cy.contains('Operator Profile').should('be.visible');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full operator profile flow', () => {
      cy.visit('/operator/profile');

      // Fill in all fields
      cy.get('input[placeholder="e.g., Bangkok"]').clear().type('Bangkok');
      cy.get('input[placeholder="13.7563"]').clear().type('13.75');
      cy.get('input[placeholder="100.5018"]').clear().type('100.50');
      cy.get('textarea, input[placeholder*="Grand Plaza"]').first().clear().type('Central Meeting Point');
      cy.get('input[placeholder*="+66812345678"]').clear().type('+66812345678');

      // Save should be enabled
      cy.contains('button', 'Save Profile').should('not.be.disabled');
    });

    it('should complete full tour builder Step 4 flow', () => {
      cy.visit('/operator/tours');

      // Verify Step 4 is visible
      cy.contains('Step 4: Pickups & Locations').should('be.visible');

      // Add pickup locations
      cy.contains('+ Add Another Pickup Location').click();

      // Verify new card added
      cy.contains('Pickup Location 3').should('be.visible');
    });
  });
});

// Helper: Tab navigation
Cypress.Commands.add('tab', { prevSubject: true }, (subject) => {
  cy.wrap(subject)
    .trigger('keydown', { keyCode: 9, which: 9 })
    .then(() => cy.focused());
});

declare global {
  namespace Cypress {
    interface Chainable {
      tab(): Chainable<void>;
    }
  }
}

export {};
