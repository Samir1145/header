# Map Pin Purchase Flow

This feature implements a complete purchase flow for map pins with authentication and payment integration.

## Features

1. **Buy Now Button**: Added to all map pin popups
2. **Authentication Check**: Automatically detects if user is logged in
3. **Login/Register Flow**: Seamless authentication with enhanced registration form
4. **Razorpay Integration**: Secure payment processing

## Flow

1. User clicks on any map pin
2. Popup appears with item details and "Buy Now" button
3. User clicks "Buy Now"
4. System checks authentication:
   - **If logged in**: Proceeds directly to payment
   - **If not logged in**: Shows login modal with option to register
5. After successful login/registration: Proceeds to Razorpay payment
6. Payment completion closes the flow

## Registration Form Fields

- Full Name
- Email
- Phone Number (10 digits)
- Password
- Confirm Password

## Configuration

Add these environment variables to your `.env.local` file:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
VITE_RAZORPAY_KEY_SECRET=your_key_secret_here
```

## Components

- `BuyNowModal`: Main purchase flow coordinator
- `RazorpayModal`: Payment processing interface
- Enhanced `RegisterModal`: 5-field registration form
- Enhanced `LoginModal`: Login with register option

## Backend Integration

The RazorpayModal includes a mock API call to `/api/create-order`. In production, implement this endpoint to:

1. Create Razorpay order
2. Return order details
3. Handle payment verification

## Testing

1. Click any map pin
2. Click "Buy Now"
3. Test both login and registration flows
4. Verify payment modal appears after authentication

