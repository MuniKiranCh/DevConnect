# Video Calling System Testing Guide

## Prerequisites
1. Make sure both backend and frontend servers are running
2. Backend should be on `http://localhost:3000`
3. Frontend should be on `http://localhost:5173`

## Testing Steps

### 1. Socket Connection Test
- Open the Calls page in your browser
- Look for the connection status indicator (green dot = connected, red dot = disconnected)
- You should see "Connected" status

### 2. User Connection Test
- Open two different browser windows/tabs
- Login with different user accounts in each window
- Both users should show "Connected" status on the Calls page
- Check browser console for socket connection logs

### 3. Global Incoming Call Test (NEW!)
- **Important:** Incoming calls work from ANY page in the app!
- In Window 1: Go to any page (Dashboard, Profile, Connections, etc.)
- In Window 2: Go to Calls page → Quick Call tab
- Click the video call button for a connection
- In Window 1: You should see a prominent incoming call modal with ringtone
- The modal should show caller's name, photo, and call type
- You can accept/decline from any page - it will redirect to Calls page

### 4. Call Initiation Test
- In Window 1: Go to Calls page → Quick Call tab
- Click the video call button for a connection
- You should see a toast message "Initiating video call..."
- Check browser console for call initiation logs

### 5. Incoming Call Test (from any page)
- In Window 2: Navigate to any page (Dashboard, Profile, etc.)
- You should see an incoming call modal with ringtone
- The modal should show the caller's name and photo
- You should hear the ringtone (make sure browser allows audio)
- Click "Accept" to join the call (will redirect to Calls page)

### 6. Video Call Test
- After accepting, both users should see video streams
- Local video should appear as a small PiP
- Remote video should appear as the main video
- Test mute/unmute and camera on/off buttons

### 7. Group Call Test
- Select multiple participants in the group call section
- Start a group call
- All participants should receive incoming call notifications (from any page)
- All should be able to join and see each other's video

## New Features

### 🌐 Global Incoming Calls
- **Works from any page:** Dashboard, Profile, Connections, Messages, etc.
- **Prominent modal:** Large, animated incoming call interface
- **Multiple notifications:** Ringtone, vibration (mobile), browser notifications
- **Seamless navigation:** Accepting redirects to Calls page automatically

### 📱 Mobile Support
- **Vibration alerts** on mobile devices
- **Browser notifications** (if permission granted)
- **Responsive design** for all screen sizes

### 🔔 Enhanced Notifications
- **Visual:** Animated phone icon and prominent modal
- **Audio:** Ringtone with volume control
- **Haptic:** Vibration on mobile devices
- **Browser:** Desktop notifications

## Troubleshooting

### If ringtone doesn't play:
1. Check browser console for audio errors
2. Make sure browser allows autoplay
3. Try clicking somewhere on the page first (user interaction required)
4. Check if browser notifications are enabled

### If other user doesn't receive calls:
1. Check if they're logged in and have the app open (any page)
2. Verify socket connection status for both users
3. Check browser console for connection logs
4. Make sure they're not on the login/register page

### If video doesn't appear:
1. Check browser permissions for camera/microphone
2. Look for WebRTC errors in console
3. Verify STUN server connectivity

### If calls fail to connect:
1. Check network connectivity
2. Verify both users are online
3. Look for signaling errors in console

## Expected Console Logs

### Successful Global Call Flow:
```
User 68605157fcfb92041821be10 joined socket room globally
Socket connected globally
Call initiated by 68605157fcfb92041821be10 to participants: [ '68605157fcfb92041821be10', '686057f99a199508b128b583' ]
Incoming call sent to 686057f99a199508b128b583
Received incoming call: {callerId: "68605157fcfb92041821be10", ...}
Accepting incoming call from global handler...
Notifying others of call acceptance from global handler...
Found pending call from other page: {accepted: true, ...}
Accepting incoming call...
Creating peer connection for 68605157fcfb92041821be10
Sending offer to 68605157fcfb92041821be10
WebRTC offer from 686057f99a199508b128b583 to participants: [...]
Receiving remote stream from 68605157fcfb92041821be10
```

## Common Issues and Solutions

### Issue: "User not connected"
**Solution:** Make sure the other user is logged in and has the app open (any page)

### Issue: No ringtone
**Solution:** Check browser audio permissions and try clicking on the page first

### Issue: Video not showing
**Solution:** Grant camera/microphone permissions when prompted

### Issue: Call doesn't connect
**Solution:** Check network and ensure both users are online

### Issue: No incoming call modal
**Solution:** Make sure you're not on login/register page, check socket connection status 