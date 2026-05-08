# Contact Form Enhancements

This plan addresses the UI changes for the "Meet in Person" option and improves the submission feedback experience.

## Goal
1. Add dynamic fields and labels for the "Meet in Person" estimate style.
2. Implement detailed progress updates during form submission to keep the user informed.

## Proposed Changes

### app/contact/page.js
- **State**: Add `submissionStep` state.
- **UI - Estimate Style**:
    - If `meet_person` is selected:
        - Add a "Preferred Meeting Date" input field.
        - Add a notice: "Our team will contact you to confirm the exact time."
- **UI - Submit Button**:
    - Change label from "REQUEST PRIORITY QUOTE" to "REQUEST IN-PERSON APPOINTMENT" when `meet_person` is selected.
    - Implement a dynamic loading message using `submissionStep` (e.g., "UPLOADING VISUALS...", "SENDING LEAD DOSSIER...").
- **Logic**: 
    - Update `handleSubmit` to set `submissionStep` at key points in the process (Start, Media Upload, Email Send, API Call).

## Verification
- Test selecting "Meet In Person" and verify the new date field appears.
- Test form submission and verify that the status messages update sequentially.
