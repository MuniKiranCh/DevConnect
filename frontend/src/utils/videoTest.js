// Video call testing and debugging utilities

export const testMediaDevices = async () => {
  const results = {
    audio: false,
    video: false,
    permissions: {
      microphone: false,
      camera: false
    },
    devices: {
      audioInputs: [],
      videoInputs: []
    }
  };

  try {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia not supported');
    }

    // Test audio permission
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      results.audio = true;
      results.permissions.microphone = true;
      audioStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Audio permission test failed:', error);
    }

    // Test video permission
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      results.video = true;
      results.permissions.camera = true;
      videoStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Video permission test failed:', error);
    }

    // Get available devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      results.devices.audioInputs = devices.filter(device => device.kind === 'audioinput');
      results.devices.videoInputs = devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Device enumeration failed:', error);
    }

  } catch (error) {
    console.error('Media devices test failed:', error);
  }

  return results;
};

export const testWebRTCConnection = async () => {
  const results = {
    rtcPeerConnection: false,
    iceServers: false,
    connectionTest: false
  };

  try {
    // Test RTCPeerConnection
    if (typeof RTCPeerConnection !== 'undefined') {
      results.rtcPeerConnection = true;
    } else {
      throw new Error('RTCPeerConnection not supported');
    }

    // Test ICE servers
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' }
    ];

    const pc = new RTCPeerConnection({ iceServers });
    results.iceServers = true;

    // Test connection creation
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      results.connectionTest = true;
    } catch (error) {
      console.error('Connection test failed:', error);
    }

    pc.close();

  } catch (error) {
    console.error('WebRTC test failed:', error);
  }

  return results;
};

export const getMediaConstraints = (callType = 'video') => {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2
    },
    video: callType === 'video' ? {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      aspectRatio: { ideal: 16/9 }
    } : false
  };
};

export const createPeerConnection = (iceServers) => {
  return new RTCPeerConnection({
    iceServers,
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  });
};

export const logConnectionState = (pc, label = 'PeerConnection') => {
  console.log(`${label} - Connection State:`, pc.connectionState);
  console.log(`${label} - ICE Connection State:`, pc.iceConnectionState);
  console.log(`${label} - ICE Gathering State:`, pc.iceGatheringState);
  console.log(`${label} - Signaling State:`, pc.signalingState);
};

export const handleMediaStreamError = (error, context = '') => {
  console.error(`Media stream error ${context}:`, error);
  
  let userMessage = 'Failed to access media devices';
  
  if (error.name === 'NotAllowedError') {
    userMessage = 'Camera/microphone access denied. Please allow permissions and try again.';
  } else if (error.name === 'NotFoundError') {
    userMessage = 'No camera or microphone found. Please check your devices.';
  } else if (error.name === 'NotReadableError') {
    userMessage = 'Camera or microphone is already in use by another application.';
  } else if (error.name === 'OverconstrainedError') {
    userMessage = 'Camera does not meet the required constraints.';
  } else if (error.name === 'TypeError') {
    userMessage = 'Invalid media constraints provided.';
  }
  
  return userMessage;
};

export const validateVideoElement = (videoRef) => {
  if (!videoRef || !videoRef.current) {
    console.error('Video element reference is null');
    return false;
  }

  const video = videoRef.current;
  
  // Check if video element is properly set up
  if (!video.srcObject && !video.src) {
    console.error('Video element has no source');
    return false;
  }

  // Check video element properties
  console.log('Video element properties:', {
    readyState: video.readyState,
    networkState: video.networkState,
    paused: video.paused,
    ended: video.ended,
    error: video.error,
    currentTime: video.currentTime,
    duration: video.duration,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight
  });

  return true;
}; 