'use strict';
// import DID_API from '../api.json' assert { type: 'json' };

const RTCPeerConnection =(
  window.RTCPeerConnection ||
  window.webkitRTCPeerConnection ||
  window.mozRTCPeerConnection
).bind(window);

let peerConnection;
let streamId;
let sessionId;
let sessionClientAnswer;
let statsIntervalId;
let videoIsPlaying;
let lastBytesReceived;

// DOM elements
const videoSelect = document.getElementById("video-select");
const avatarImages = document.querySelectorAll(".img-fluid");
const talkVideo = document.getElementById("talking-video");
const talkingVid = document.getElementById("talking-vid");
const iceStatusLabel = document.getElementById('ice-status-label');
const iceGatheringStatusLabel = document.getElementById('ice-gathering-status-label');
const peerStatusLabel = document.getElementById('peer-status-label');
const signalingStatusLabel = document.getElementById('signaling-status-label');
const streamingStatusLabel = document.getElementById('streaming-status-label');

let apiKey; 
// get input did api key
function getValueOfHiddenInput() {
  const hiddenInput = document.getElementById('did-api-key');
  const apiKey = hiddenInput.value;
  return apiKey;
}
// store key
const getDIDApiKey = document.getElementById('did-api-key');
getDIDApiKey.addEventListener('input', () => {
  if (apiKey !== '' || apiKey !== undefined) {
    apiKey = getValueOfHiddenInput();
    console.log(apiKey);
  }
});

// https source urls for avatar images
const sourceUrlMap = {
  Jaward: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/jaward.png',
  Aquilla: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/aquilla.png',
  Amira: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/amira.png',
  Joker: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/joker.png',
  Sonia: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/sonia.png',
  Dong: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/dong.png',
  Sully: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/sully.png',
  Neytiri: 'https://raw.githubusercontent.com/Jaykef/gradio-practice/main/neytiri.png'
};

const voiceUrlMap = {
  Jaward: 'en-US-JasonNeural',
  Aquilla: 'zh-CN-XiaoyiNeural',
  Amira: 'en-ZA-LeahNeural',
  Joker: 'en-US-DavisNeural',
  Sonia: 'en-IN-NeerjaNeural',
  Dong: 'zh-CN-YunjianNeural',
  Sully: 'en-US-DavisNeural',
  Neytiri: 'en-US-JennyNeural'
};

// Helper functions
function updateAvatar() {
  avatarImages.forEach((avatarImage) => {
    avatarImage.addEventListener("click", () => {
      const selectedVideo = avatarImage.alt;
      const selectedImage = avatarImage;

      const prevSelectedImage = document.querySelector(".img-fluid[selected]");
      if (prevSelectedImage) {
        prevSelectedImage.style.border = "none";
        prevSelectedImage.removeAttribute("selected");
      }
      selectedImage.style.border = "5px solid #02a3ff91";
      selectedImage.setAttribute("selected", "true");

      updateSelectedAvatar(selectedVideo);
      const video = document.getElementById("talking-video");
      video.style.zIndex = 40;
      video.src = `app/videos/${selectedVideo}.mp4`;
      video.pause();
    });
  });
}
function updateSelectedAvatar(selectedVideo) {
  const video = document.getElementById("talking-video");
  video.style.zIndex = 40;
  video.src = `app/videos/${selectedVideo}.mp4`;
  video.pause();
}
function updateVoice() {
  avatarImages.forEach((avatarImage) => {
    avatarImage.addEventListener("click", () => {
      const selectedVideo = avatarImage.alt;
      const updatedVoiceUrl = voiceUrlMap[selectedVideo];
      console.log(updatedVoiceUrl);
      updateSelectedAvatar(selectedVideo);
    });
  });
}

function setVideoElement(stream) {
  if (!stream) return;
  talkVideo.srcObject = stream;
  talkVideo.loop = false;

  // Safari hotfix
  if (talkVideo.paused) {
    talkVideo.play()
      .then((_) => {})
      .catch((e) => {});
  }
  // setTimeout(() => {
  //   talkVideo.style.opacity = 0.5;
  // }, 50);
}

function playIdleVideo() {
  talkVideo.srcObject = undefined;
  talkVideo.loop = true;
}

function stopAllStreams() {
  if (talkVideo.srcObject) {
    console.log('stopping video streams');
    talkVideo.srcObject.getTracks().forEach((track) => track.stop());
    talkVideo.srcObject = null;
  }
}

function closePC(pc = peerConnection) {
  if (!pc) return;
  console.log('stopping peer connection');
  pc.close();
  pc.removeEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
  pc.removeEventListener('icecandidate', onIceCandidate, true);
  pc.removeEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
  pc.removeEventListener('connectionstatechange', onConnectionStateChange, true);
  pc.removeEventListener('signalingstatechange', onSignalingStateChange, true);
  pc.removeEventListener('track', onTrack, true);
  clearInterval(statsIntervalId);
  iceGatheringStatusLabel.innerText = '';
  signalingStatusLabel.innerText = '';
  iceStatusLabel.innerText = '';
  peerStatusLabel.innerText = '';
  console.log('stopped peer connection');
  if (pc === peerConnection) {
    peerConnection = null;
  }
}

const maxRetryCount = 3;
const maxDelaySec = 4;

async function fetchWithRetries(url, options, retries = 1) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries <= maxRetryCount) {
      const delay = Math.min(Math.pow(2, retries) / 4 + Math.random(), maxDelaySec) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(`Request failed, retrying ${retries}/${maxRetryCount}. Error ${err}`);
      return fetchWithRetries(url, options, retries + 1);
    } else {
      throw new Error(`Max retries exceeded. error: ${err}`);
    }
  }
}

async function createPeerConnection(offer, iceServers) {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection({ iceServers });
    peerConnection.addEventListener('icegatheringstatechange', onIceGatheringStateChange, true);
    peerConnection.addEventListener('icecandidate', onIceCandidate, true);
    peerConnection.addEventListener('iceconnectionstatechange', onIceConnectionStateChange, true);
    peerConnection.addEventListener('connectionstatechange', onConnectionStateChange, true);
    peerConnection.addEventListener('signalingstatechange', onSignalingStateChange, true);
    peerConnection.addEventListener('track', onTrack, true);
  }

  await peerConnection.setRemoteDescription(offer);
  console.log('set remote sdp OK');

  const sessionClientAnswer = await peerConnection.createAnswer();
  console.log('create local sdp OK');

  await peerConnection.setLocalDescription(sessionClientAnswer);
  console.log('set local sdp OK');

  return sessionClientAnswer;
}


// Peer connection to D-ID
export async function sendConnectionRequest() {
  
  if (peerConnection && peerConnection.connectionState === 'connected') {
    return;
  }

  stopAllStreams();
  closePC();
  if (apiKey === '' || apiKey === undefined) {
    alert('Please enter your D-ID API key');
  } else {
    const videoElement = document.getElementById('talking-video');
    const videoSource = videoElement.src;
    const videoName = videoSource.split('/').pop().split('.').slice(0, -1).join('.');
    const selectedVideo = videoName;
    talkVideo.src = `app/videos/${selectedVideo}.mp4`;
    const updatedSourceUrl = sourceUrlMap[selectedVideo];
    console.log(updatedSourceUrl);
    const sessionResponse = await fetchWithRetries(`https://api.d-id.com/talks/streams`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_url: updatedSourceUrl,
      }),
    });

    const { id: newStreamId, offer, ice_servers: iceServers, session_id: newSessionId } = await sessionResponse.json();
    streamId = newStreamId;
    sessionId = newSessionId;

    try {
      sessionClientAnswer = await createPeerConnection(offer, iceServers);
    } catch (e) {
      console.log('error during streaming setup', e);
      stopAllStreams();
      closePC();
      return;
    }

    const sdpResponse = await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answer: sessionClientAnswer,
        session_id: sessionId,
      }),
    });

  }
};

// send stream request to D-ID
export async function sendRenderRequest(textForRendering) {
  // Check the peer connection's signaling and ice connection states
  if (peerConnection?.signalingState === 'stable' || peerConnection?.iceConnectionState === 'connected') {
    
    
    const videoElement = document.getElementById('talking-video');
    const videoSource = videoElement.src;
    const videoName = videoSource.split('/').pop().split('.').slice(0, -1).join('.');
    const selectedVideo = videoName;
    const updatedVoiceUrl = voiceUrlMap[selectedVideo];
    console.log(updatedVoiceUrl);
    
    const talkResponse = await fetchWithRetries(`https://api.d-id.com/talks/streams/${streamId}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: {
            type: 'text',
              subtitles: 'false',
              provider: { type: 'microsoft', voice_id: updatedVoiceUrl },
              ssml: true,
              input: textForRendering
          },
          driver_url: 'bank://lively/',
          config: {
            stitch: true,
          },
          session_id: sessionId,
        }),
      });
  }
};

// send disconnect request to D-ID
export async function sendDisconnectRequest(){
  await fetch(`https://api.d-id.com/talks/streams/${streamId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  stopAllStreams();
  talkVideo.pause();
  closePC();
};

updateAvatar();
updateVoice();

// ICE and peer connection status changes
function onIceGatheringStateChange() {
  iceGatheringStatusLabel.innerText = peerConnection.iceGatheringState;
  iceGatheringStatusLabel.className = 'iceGatheringState-' + peerConnection.iceGatheringState;
}

// ICE candidate
function onIceCandidate(event) {
    console.log('onIceCandidate', event);
    if (event.candidate) {
      const { candidate, sdpMid, sdpMLineIndex } = event.candidate;
  
      fetch(`https://api.d-id.com/talks/streams/${streamId}/ice`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate,
          sdpMid,
          sdpMLineIndex,
          session_id: sessionId,
        }),
      });
    }
}

// Listeners for ICE and peer connection status changes
function onIceConnectionStateChange() {
    iceStatusLabel.innerText = peerConnection.iceConnectionState;
    iceStatusLabel.className = 'iceConnectionState-' + peerConnection.iceConnectionState;
    if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'closed') {
      stopAllStreams();
      closePC();
    }
}

function onConnectionStateChange() {
  // not supported in firefox
  peerStatusLabel.innerText = peerConnection.connectionState;
  peerStatusLabel.className = 'peerConnectionState-' + peerConnection.connectionState;
}

function onSignalingStateChange() {
    signalingStatusLabel.innerText = peerConnection.signalingState;
    signalingStatusLabel.className = 'signalingState-' + peerConnection.signalingState;
}

// Listener for video status change
function onVideoStatusChange(videoIsPlaying, stream) {
    let status;
    if (videoIsPlaying) {
      status = 'streaming';
      const remoteStream = stream;
      setVideoElement(remoteStream);
    } else {
      status = 'empty';
      playIdleVideo();
    }
    streamingStatusLabel.innerText = status;
    streamingStatusLabel.className = 'streamingState-' + status;
}

// Event listener for track event
function onTrack(event) {
    if (!event.track) return;

    statsIntervalId = setInterval(async () => {
      const stats = await peerConnection.getStats(event.track);
      stats.forEach((report) => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const videoStatusChanged = videoIsPlaying !== report.bytesReceived > lastBytesReceived;
  
          if (videoStatusChanged) {
            videoIsPlaying = report.bytesReceived > lastBytesReceived;
            onVideoStatusChange(videoIsPlaying, event.streams[0]);
          }
          lastBytesReceived = report.bytesReceived;
        }
      });
    }, 500);
}
