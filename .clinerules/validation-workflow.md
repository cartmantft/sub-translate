## Brief overview

This rule establishes the validation workflow requirement for code modifications, ensuring that tasks are only marked complete after user confirmation that changes are working properly.

## Task completion workflow

- Never use attempt_completion immediately after making code changes
- Always wait for user confirmation that modifications are working as expected
- User must explicitly verify that there are no issues before task can be considered complete
- Ask for user testing and feedback before attempting task completion

## Code modification validation

- After implementing fixes or changes, request user to test the functionality
- Wait for explicit user confirmation that the changes resolve the intended issues
- Do not assume success based on code logic alone - real-world testing is required
- Only proceed to attempt_completion after receiving positive user feedback

## Error handling approach

- When user reports that fixes didn't work, acknowledge the feedback immediately
- Re-investigate the actual issues rather than assuming previous analysis was correct
- Ask for specific error details and current problem state
- Focus on user-reported symptoms rather than theoretical solutions
