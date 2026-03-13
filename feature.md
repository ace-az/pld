You are building a student group matching algorithm for a peer learning management system.

## Core Logic — Always Active
- Every session, form groups of [group_size] students
- Prioritize pairing students who have NOT been grouped together before
- Track pairing history across sessions and use it to minimize repeated pairings
- Use weighted randomization: unseen pairs get highest priority, 
  repeated pairs get lowest
- If student count doesn't divide evenly, distribute remainders into 
  existing groups — this is acceptable

## Feature: Score-Based Mixing (Toggle)
- This is an OPTIONAL feature controlled by a toggle switch (on/off)
- When OFF: ignore scores completely, use variety logic only
- When ON: additionally try to pair high-scoring students with 
  low-scoring students so stronger students can support weaker ones
- Score mixing is a soft constraint — if it conflicts with variety, 
  variety always wins
- Never let the score mixing override the core randomization logic; 
  it is a secondary layer on top of it

## Rules
- Variety across sessions is the primary goal
- Score mixing is a secondary, optional feature — not the base logic
- Handle small or uneven cohorts gracefully without errors