# Use Case: Guest Checkout

**Description:** Guest places an order without creating a permanent account, with strict verification.

**Precondition:** Cart is not empty and all items are in stock.

**Postcondition:** Order record is created in the system with status 'Pending'. Guest information is stored associated with the Order ID.

## Actors
- **Guest**

## Data Entities
- **GuestUser**
- **Cart**
- **Order**

## Flows
### EXCEPTION: Rate Limit Exceeded
1. Guest attempts to checkout. 2. System checks the number of orders initiated from the current IP address in the last 24 hours. 3. If count >= 3, System denies the checkout attempt and displays a 'Rate limit exceeded' message.

### EXCEPTION: Invalid OTP Handling
1. Guest enters incorrect OTP. 2. System displays 'Invalid OTP' error. 3. System allows Guest to request a new OTP (max 3 retries). 4. If 3 retries are exceeded, System locks the checkout process for 15 minutes for that IP.

### MAIN
1. Guest clicks 'Checkout' on the cart page. 2. System prompts for Login or Guest Checkout. 3. Guest selects 'Guest Checkout'. 4. System presents form requiring Full Name, Phone Number, Email, and Delivery Address. 5. Guest submits the form. 6. System validates input data (all mandatory, valid phone format). 7. System sends OTP to the provided Phone Number. 8. Guest enters OTP. 9. System verifies OTP. 10. System creates the order, logs IP address, and returns 'Order Successful' with a tracking ID. 11. System displays prompt to register an account.

## Business Rules
- Guest checkout is restricted to pre-defined payment methods (e.g., COD or select Online gateways).
- Guest orders do not qualify for loyalty point accumulation.
- Full Name, Phone Number, and Delivery Address are mandatory fields for guest checkout.
- Maximum of 3 guest orders allowed per IP address per 24 hours.
- Guest must verify Phone Number via OTP for every order.

