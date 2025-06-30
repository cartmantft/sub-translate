## Brief overview

These guidelines cover the testing and validation workflow preferences specific to this project, emphasizing the importance of testing changes before committing to version control and updating documentation.

## Testing workflow

- Always test functionality before committing changes to git
- Run development server to verify changes work as expected in real environment
- Test critical user flows end-to-end before considering work complete
- Validate bug fixes by reproducing the original issue and confirming resolution

## Git and documentation workflow

- Test first, commit only after confirming normal operation
- Update memory bank documentation to reflect actual implementation state after successful testing
- Commit changes to git only after both testing and memory bank updates are complete
- Ensure documentation accuracy matches the real codebase state

## Bug fixing approach

- Prioritize critical bugs that affect user experience over feature enhancements
- Focus on issues that block core functionality or create user confusion
- Address navigation, timing, and UX flow issues as high priority items
- Implement solutions that use actual API data rather than hardcoded fallbacks

## Communication style

- Communicate primarily in Korean
- Provide clear explanations of what changes were made and why
- Document technical decisions and implementation patterns in memory bank
- Be direct about testing requirements and validation steps needed
