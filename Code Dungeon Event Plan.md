## **CODE DUNGEON** 

## **Escape Through Logic** 

## **Event Category** 

Gamified Programming Competition 

## **Theme** 

"You are trapped inside an ancient dungeon. Every locked chamber contains a programming challenge. Solve the challenge to unlock the next room and escape before the other teams." 

## **Event Objective** 

Code Dungeon is a story-driven programming competition that transforms a traditional coding contest into an adventure. 

Instead of solving unrelated questions, teams progress through a dungeon by unlocking rooms. Every solved challenge opens a new chamber, awards points, and moves the team closer to the Treasure Room. 

The event emphasizes: 

- Programming logic 

- Team collaboration 

- Problem solving 

- Time management 

- Competitive gameplay 

## **Target Participants** 

- Second Year Engineering Students 

- Team Size: 2 to 3 Members 

- Programming Language: C++ Only 

Restricting the competition to one language keeps judging reliable and ensures a level playing field. 

1 

## **Competition Structure** 

## **Round 1** 

## **Dungeon Qualification** 

Duration: 30 Minutes 

Purpose: Shortlist teams for the final round. 

Format: Paper-based or web-based quiz. 

Topics: 

- Output Prediction • Syntax Identification 

- Debugging • Basic Arrays • Loops • Functions • Time Complexity • Basic STL 

- Simple Logic Questions 

Questions: 25 

Marking: +1 for every correct answer 

No negative marking. 

Top 8 or Top 10 teams qualify. 

## **Round 2** 

## **Code Dungeon** 

Duration: 60 to 90 Minutes 

2 

Teams receive login credentials for the Code Dungeon platform. 

Each team enters the dungeon. 

The dungeon consists of multiple rooms. 

Example progression: 

Entrance 

↓ Room 1 ↓ Room 2 ↓ Room 3 ↓ Room 4 ↓ Boss Chamber 

↓ 

Treasure Room 

A room remains locked until the previous room is cleared. 

## **Dungeon Room Design** 

Every room has its own identity. 

Example: 

3 

Room 1 The Forgotten Gate 

Topic: Basic Loops 

Difficulty: Easy 

Room 2 Crystal Cavern 

Topic: Strings 

Difficulty: Easy 

Room 3 Forest of Arrays 

Topic: Arrays 

Difficulty: Medium 

Room 4 The Ancient Library 

Topic: Functions 

Difficulty: Medium 

Boss Chamber 

Topic: 

Comprehensive Programming Problem 

4 

Difficulty: Hard 

Treasure Room 

Completion screen. 

Final score displayed. 

## **Scoring** 

Easy Room 20 Points 

Medium Room 40 Points 

Hard Room 60 Points 

Boss Room 100 Points 

Tie Breaker: Least completion time. 

## **Competition Flow** 

Team Login 

↓ 

Dungeon Map 

↓ 

Room Opens 

↓ 

5 

Read Question 

## ↓ 

Write Solution 

↓ 

Submit 

## ↓ 

Verification 

## ↓ 

Correct 

↓ 

Door Unlocks 

↓ 

Leaderboard Updates 

↓ 

Next Room Opens 

↓ 

Repeat Until Treasure Room 

## **Technical Architecture** 

Frontend: 

- React 

- Tailwind CSS 

- Monaco Editor 

6 

Backend: 

- Node.js 

- Express 

Database: 

- Supabase (PostgreSQL-based backend with built-in authentication and real-time support) 

Realtime: 

- Socket.IO 

Compiler: 

- g++ 

Deployment: 

- Can be hosted using platforms like Render or Vercel for simplicity and faster setup 

- Docker Compose is optional and mainly useful if you want full control over services (backend, database, judge system) in a local or self-hosted environment 

## **Database Design** 

Tables 

TEAM 

- Team ID 

- Team Name 

- Members 

ROOM 

- Room ID 

- Title 

- Difficulty 

- Points 

## SUBMISSION 

- Submission ID 

- Team ID 

- Room ID 

- Status 

7 

- Execution Time 

- Submitted Time 

The leaderboard is generated from submission data rather than storing scores directly. 

## **Leaderboard** 

Displays: 

Rank 

Team Name 

Rooms Cleared 

Points 

Completion Time 

Updates automatically after every successful room completion. 

## **Verification System** 

The platform supports three interchangeable verification methods. 

PLAN A 

Automatic Judge 

Participant submits code. 

System: 

Compile 

↓ 

Execute Hidden Test Cases 

↓ 

8 

Compare Output 

## ↓ 

Accept or Reject 

↓ 

Unlock Room 

PLAN B 

File Upload Judge 

Participant writes code locally. 

Uploads .cpp file. 

System stores submission. 

Organizer compiles and verifies. 

Click Accept. 

Room unlocks automatically. 

## PLAN C 

Manual Verification 

Participant writes code locally. 

Runs the program. 

Shows the working solution to the judge. 

Judge reviews: 

- Code • Correct output 

- Logic 

Organizer clicks "Accept" on the admin panel. 

9 

The platform immediately: 

• Unlocks the next room • Updates the leaderboard • Records the completion time 

The participant experience remains unchanged because room progression is still handled by the platform. 

## **Why Three Verification Plans?** 

The competition should never fail because of one technical component. 

The dungeon platform and the judging mechanism are separate modules. 

If the automatic judge is unavailable, the event continues using file upload or manual approval without changing the competition format. 

## **Admin Dashboard** 

Features: 

Current Leaderboard 

Active Teams 

Current Room 

Submission Queue 

Accept Submission 

Reject Submission 

Pause Timer (Emergency) 

Resume Event 

Export Results 

10 

## **User Interface** 

Login Screen 

Dungeon Map 

Current Room 

Problem Statement 

Code Editor 

Submit Button 

Leaderboard 

Countdown Timer 

Progress Bar 

## **Boss Chamber** 

The final room contains the highest value programming challenge. 

Example topics: 

- Student Record Management 

- Matrix Operations 

- String Processing 

- Menu Driven Console Program 

The Boss Chamber is worth the highest points and often determines the winner. 

## **Event Rules** 

- Only C++ is permitted. 

- Internet access is prohibited unless explicitly allowed. 

- Teams may discuss only within their own members. 

- Plagiarism results in disqualification. 

- The organizer's decision is final. 

- Teams must not tamper with the competition system. 

11 

## **Failure Recovery Plan** 

If the automatic judge fails: Switch to File Upload Verification. 

If file upload cannot be completed: Switch to Manual Verification. 

If the server fails: 

Continue using printed problem statements and manual judging while recording times manually. 

At no stage should the competition be cancelled. 

## **Development Priority** 

Phase 1 

- Login • Database • Team Management 

Phase 2 

- Dungeon Map • Room Progression • Timer 

Phase 3 

- Leaderboard 

- Admin Panel 

Phase 4 

- Automatic Judge 

Phase 5 

- Animations • Sound Effects 

- Visual Polish 

This order ensures the competition remains usable even if the final technical features are not completed. 

12 

## **Expected Outcome** 

Participants experience a coding competition that feels like an adventure rather than an examination. 

The platform is reusable for future symposiums by simply replacing the question set. 

Future versions may include: 

- Multiple dungeons 

- Difficulty levels 

- Individual mode 

- Team tournaments 

- Seasonal leaderboards 

- College-wide championships 

Code Dungeon is designed to become a signature event rather than a one-time coding contest. 

13 

