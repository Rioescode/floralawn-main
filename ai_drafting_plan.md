# AI Message Drafting Implementation

This plan details how to integrate an AI-powered drafting assistant into the contact form message details section.

## Goal
Allow users to generate a professional summary of their project needs using AI, based on their selected service, address, and assessment data.

## Proposed Changes

### [NEW] [route.js](file:///e:/floralawn-main-main/app/api/ai/draft-message/route.js)
Create an endpoint that uses Claude to draft a customer message.
- **Inputs**: `service`, `address`, `city`, `assessmentData` (cleanup/mulch), `estimatePreference`.
- **System Prompt**: Act as a helpful lawn care assistant drafting a project description for a customer.
- **Output**: A professional, structured description of the work needed.

### [MODIFY] [page.js](file:///e:/floralawn-main-main/app/contact/page.js)
1. **State**: Add `isGeneratingAI` (boolean).
2. **Logic**: Add `generateAIDraft` function:
    - Call `/api/ai/draft-message`.
    - Update `formData.message` with the result.
3. **UI**: 
    - Update the "Need help writing?" section.
    - Add an "✨ AI Draft Project Details" button.
    - Show a loading spinner when generating.

## Verification
- Test selecting a service (e.g., "Fall Cleanup") and clicking "AI Draft".
- Verify that the generated message includes the property city and assessment details (e.g., "Heavy leaves").
- Ensure the user can still edit the message after it is inserted.
