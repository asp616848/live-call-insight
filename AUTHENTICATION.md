# Google Authentication Setup

This project now includes Google OAuth authentication with a beautiful UI integrated into the sidebar.

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API or Google Identity API
4. Go to "Credentials" and create an OAuth 2.0 client ID
5. Configure the OAuth consent screen
6. Add authorized JavaScript origins:
   - For development: `http://localhost:5173`
   - For production: your domain (e.g., `https://yourdomain.com`)
7. Copy the client ID

### 2. Environment Configuration

1. Update the `.env` file with your Google Client ID:
   ```
   GOOGLE_CLIENT_ID=your_actual_google_client_id_here
   ```

### 3. Features

- **Beautiful Login Page**: Accessible at `/login` with animated UI
- **Sidebar Integration**: Google login button integrated in the left sidebar
- **User Profile Display**: Shows user avatar, name, and email when logged in
- **Protected Routes**: All main pages require authentication
- **Persistent Sessions**: User sessions are stored in localStorage
- **Responsive Design**: Works in both collapsed and expanded sidebar states

### 4. Components Added

- `AuthContext.tsx`: Authentication state management
- `GoogleLoginButton.tsx`: Reusable Google login component
- `Login.tsx`: Dedicated login page
- `ProtectedRoute.tsx`: Route protection wrapper
- Updated `Sidebar.tsx`: Integrated login/logout functionality
- Updated `Layout.tsx`: Added route protection

### 5. User Flow

1. Unauthenticated users are redirected to `/login`
2. Users can sign in with Google OAuth
3. After successful login, users are redirected to the dashboard
4. User info is displayed in the sidebar
5. Users can logout using the logout button in the sidebar

### 6. Development

To test the authentication:

1. Set up your Google OAuth credentials
2. Update the `.env` file with your client ID
3. Run the development server: `npm run dev`
4. Navigate to `http://localhost:5173`
5. You'll be redirected to the login page if not authenticated

### 7. Styling

The login components use:
- Framer Motion for animations
- Tailwind CSS for styling
- Glass morphism effects
- Gradient accents matching the app theme
- Responsive design for different screen sizes

### 8. Security Notes

- Client ID is safe to expose (it's designed to be public)
- User data is stored in localStorage (consider upgrading to secure storage for production)
- Always use HTTPS in production
- Consider implementing token refresh for longer sessions
