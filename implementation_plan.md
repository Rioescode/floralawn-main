# Address Search Integration for Contact Form

This plan details the transition from manual text input to a verified Google Places Autocomplete search for property addresses in the contact form.

## Goal
Replace the standard "Street Address" input in `app/contact/page.js` with a Google Places search bar that auto-fills city, state, and zip.

## Proposed Changes

### app/contact/page.js
- **State**: Add `state` and `zipCode` to `formData`.
- **Autocomplete**: 
    - Add Rhode Island bounds bias.
    - Capture state and postal code.
    - Set the input value to the `formatted_address` upon selection.
- **UI**: 
    - Update the address input to look like a search bar with a MagnifyingGlassIcon.
    - Add a "Verified Address" indicator.
- **Submission**: 
    - Use the captured state instead of hardcoded "RI".
    - Pass complete location data to the database and email API.

## Verification
- Test address lookup for local cities.
- Verify auto-fill of city/state/zip.
- Confirm submission payload in network tab.
