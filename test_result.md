#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Build Africa One Voice (AOV) - a pan-African digital talent show with paid voting. Features include contestant registration, admin approval, voting rounds, Paystack payment integration, leaderboards, and admin dashboard."

backend:
  - task: "User Registration API"
    implemented: true
    working: "NA"
    file: "/app/app/api/auth/register/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Implemented registration with email/password, phone, country, role selection (VOTER/CONTESTANT). Dev mode OTP."

  - task: "OTP Verification API"
    implemented: true
    working: "NA"
    file: "/app/app/api/auth/verify-otp/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Dev mode uses 123456 as OTP. Structured for future SMS integration."

  - task: "NextAuth Authentication"
    implemented: true
    working: "NA"
    file: "/app/app/api/auth/[...nextauth]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Credentials provider with email/password, role-based JWT tokens."

  - task: "Contestants CRUD API"
    implemented: true
    working: "NA"
    file: "/app/app/api/contestants/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "GET list, POST create, PUT update with filters, pagination, search."

  - task: "Rounds Management API"
    implemented: true
    working: "NA"
    file: "/app/app/api/rounds/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "CRUD for voting rounds. Only one active round at a time."

  - task: "Vote Initialization API"
    implemented: true
    working: "NA"
    file: "/app/app/api/votes/initialize/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Initializes Paystack payment, creates pending transaction, rate limiting."

  - task: "Vote Verification API"
    implemented: true
    working: "NA"
    file: "/app/app/api/votes/verify/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Verifies payment with Paystack, idempotent processing, updates vote count."

  - task: "Paystack Webhook"
    implemented: true
    working: "NA"
    file: "/app/app/api/webhooks/paystack/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Signature verification, idempotent vote processing, amount validation."

  - task: "Leaderboard API"
    implemented: true
    working: "NA"
    file: "/app/app/api/leaderboard/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Per-round and overall leaderboard with filters. Falls back to total votes."

  - task: "Admin Stats API"
    implemented: true
    working: "NA"
    file: "/app/app/api/admin/stats/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Dashboard stats: revenue, votes, pending approvals, flagged transactions."

  - task: "Admin Contestants API"
    implemented: true
    working: "NA"
    file: "/app/app/api/admin/contestants/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "List, approve, reject, freeze contestants with audit logging."

  - task: "Admin Settings API"
    implemented: true
    working: "NA"
    file: "/app/app/api/admin/settings/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Get/update vote price, currency, prize pool, site settings."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "User Registration API"
    - "NextAuth Authentication"
    - "Contestants CRUD API"
    - "Leaderboard API"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Completed initial MVP implementation of AOV talent show platform. Database seeded with 10 contestants, 1 admin, 1 voter, and 1 active round. Please test the core APIs: registration, auth, contestants, and leaderboard. Admin email: admin@africaonevoice.com, password: admin123. Voter email: voter@test.com, password: voter123."