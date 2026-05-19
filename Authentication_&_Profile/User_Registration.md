# Use Case: User Registration

**Description:** Use case for new users to register and verify their accounts.

**Precondition:** Guest is not logged in.

**Postcondition:** User Account is created and set to 'Active', and a user profile is created.

## Actors
- **Guest**

## Data Entities
- **Audit Log**
- **OTP Record**
- **User Account**
- **User Profile**

## Flows
### EXCEPTION: Invalid/Expired OTP
1. Guest enters the OTP.
2. System checks the OTP validity and time (must be within 5 minutes).
3. If the OTP is incorrect or expired, System displays an error message.
4. System allows the Guest to request a new OTP (maximum 3 times).
5. If max retries are reached, System blocks further attempts from this IP for 1 hour.

### ALT: Account Already Exists
1. Guest submits registration details.
2. System identifies that the Email or Phone is already registered.
3. System rejects the registration attempt and prompts the Guest to log in or recover their password.

### ALT: Invalid Input/Weak Password
1. Guest submits registration details.
2. System detects that the Password does not meet complexity requirements or input is invalid.
3. System rejects the submission and displays a specific error message explaining the requirement.
4. Guest is prompted to correct the input.

### MAIN: Main Flow
1. Guest submits registration details (Full Name, Email/Phone, Password).
2. System performs server-side validation on all fields.
3. System checks if the Email/Phone already exists in the database.
4. If valid, System generates a 6-digit OTP and saves it to the OTP Record with a 5-minute expiry.
5. System sends the OTP to the Guest's Email/Phone.
6. Guest enters the received OTP.
7. System validates the OTP against the stored record.
8. If valid, System updates User Account status to 'Active', creates User Profile, and logs the action in the Audit Log.
9. System informs the Guest that registration is successful.

## Business Rules
- Every registration action (success or failure) must be logged in the Audit Log with Timestamp, IP Address, and Action type.
- All user input must be sanitized to prevent SQL Injection and XSS attacks.
- System must implement rate limiting on registration attempts (e.g., maximum 5 attempts per hour per IP).
- Email must be verified via OTP sent to the user within 5 minutes.
- Password must be at least 8 characters long, including at least one uppercase letter, one lowercase letter, one digit, and one special character.

