When a student or mentor edits a line of code in worksops session, show an inline animated badge positioned beside the edited line. The badge must display the editor's full name (first name + last name), use a unique persistent background color for that user, animate into view, remain visible for 3 seconds, and then disappear.

Requirements:

1. SCAN FIRST:
   - Find my code editor component and which editor library I use
   - Find where user data (firstName, lastName, id) is available
   - Find my styling approach
   - Find if I have WebSocket/real-time setup
   - Show me what you find before making changes

2. BADGE POSITION:
   - Inline, beside the edited line (right side of the line or next to cursor)
   - Must not overlap or block code content
   - If multiple users edit different lines, show separate badges on each line

3. USER COLOR:
   - Each user gets a unique background color based on their user ID
   - Same user always gets the same color (deterministic hash)
   - Provide at least 20 distinct colors
   - Text color should contrast with background for readability

4. ANIMATION:
   - Appear: fade-in + slight slide (0.2s ease-out)
   - Stay visible: 3 seconds
   - Disappear: fade-out + slight slide (0.3s ease-in)
   - If the same user edits again before 3 seconds, reset the timer (don't stack badges)

5. BADGE DESIGN:
   - Rounded corners (6px)
   - Small font (12px, bold)
   - Padding: 4px 10px
   - Subtle box shadow
   - Non-interactive (pointer-events: none)

6. LOGIC:
   - Listen to editor content change events
   - Get the line number where edit happened
   - Get current user's full name from auth/context
   - Show badge at that line
   - After 3 seconds, animate out and remove
   - If user keeps typing on same line, reset timer
   - If user edits a different line, move badge to new line

7. MULTI-USER (if WebSocket exists):
   - Broadcast edit events to other users
   - Show badges for remote users at their edit positions
   - Each user's badge has their unique color
   - If no WebSocket, just show badge for current user only

8. DO NOT:
   - Do not create new component files
   - Do not change my existing UI layout
   - Modify my existing editor component directly
   - Use my existing styling approach

Start by scanning my codebase and showing me what you find.