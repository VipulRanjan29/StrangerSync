let localStream;
let username;
let remoteUser;
let peerConnection;
let remoteStream;
let sendChannel;
let receiveChannel;
let isAudioMuted = false;
let isVideoMuted = false;
let isChatStarted = false;

const msgInput = document.querySelector("#msg-input");
const msgSendBtn = document.querySelector(".msg-send-button");
const chatTextArea = document.querySelector(".chat-text-area");
const nextBtn = document.querySelector(".next-chat");
const startChatBtn = document.querySelector("#start-chat-btn");

let omeID = localStorage.getItem("omeID");

if (omeID) {
  $.ajax({
    url: "/new-user-update/" + omeID,
    type: "PUT",
    success: function (data) {
      username = data.omeID || omeID;
      if (data.omeID) localStorage.setItem("omeID", data.omeID);
      runUser();
    },
  });
} else {
  $.ajax({
    type: "POST",
    url: "/api/users",
    data: "Demo Data",
    success: function (response) {
      localStorage.setItem("omeID", response);
      username = response;
      runUser();
    },
  });
}

function scrollToBottom() {
  chatTextArea.scrollTop = chatTextArea.scrollHeight;
}

function runUser() {
  const socket = io.connect();

  let initLocalPreview = async () => {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      document.getElementById("user-1").srcObject = localStream;
    } catch (err) {
      console.error("Access denied for camera/mic:", err);
      alert("Please allow camera and microphone access to start video chat.");
    }
  };

  initLocalPreview();

  const startPairing = () => {
    isChatStarted = true;
    if (startChatBtn) {
      startChatBtn.innerHTML = 'Finding Stranger... <div class="dot" style="margin-left: 10px;"></div>';
      startChatBtn.style.opacity = "0.7";
      startChatBtn.style.pointerEvents = "none";
    }

    // Step 1: Tell the server we are now ready to be found
    $.ajax({
      url: "/update-on-otheruser-closing/" + username, // Reusing this endpoint to set active: yes, status: 0
      type: "PUT",
      success: function() {
        // Step 2: Try to find someone else who is also ready
        findStranger();
      }
    });
  };

  const findStranger = () => {
    $.post("/get-remote-users", { omeID: username }).done(function (data) {
      if (data[0] && data[0]._id !== username) {
        remoteUser = data[0]._id;
        createOffer(data[0]._id);
      } else {
        // Keep searching if no one found yet
        if (isChatStarted) setTimeout(findStranger, 3000);
      }
    });
  };

  if (startChatBtn) {
    startChatBtn.addEventListener("click", startPairing);
  }

  socket.on("connect", () => {
    socket.emit("userconnect", { displayName: username });
  });

  socket.on("remote_typing", (data) => {
    if (!isChatStarted) return;
    const indicator = document.getElementById("typing-indicator");
    if (data.typing) {
      if (!indicator) {
        const div = document.createElement("div");
        div.id = "typing-indicator";
        div.style.fontSize = "12px";
        div.style.color = "var(--text-dim)";
        div.innerText = "Stranger is typing...";
        chatTextArea.appendChild(div);
        scrollToBottom();
      }
    } else if (indicator) {
      indicator.remove();
    }
  });

  const servers = {
    iceServers: [{ urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"] }],
  };

  let createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(servers);
    remoteStream = new MediaStream();
    document.getElementById("user-2").srcObject = remoteStream;

    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => remoteStream.addTrack(track));
      if (startChatBtn) {
        startChatBtn.innerHTML = 'Connected <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
        startChatBtn.style.background = "var(--accent-purple)";
        startChatBtn.style.opacity = "1";
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidateSentToUser", {
          username,
          remoteUser,
          iceCandidateData: event.candidate,
        });
      }
    };

    sendChannel = peerConnection.createDataChannel("sendDataChannel");
    sendChannel.onopen = () => console.log("Data channel open");
    peerConnection.ondatachannel = (event) => {
      receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chatTextArea.innerHTML += `<div style='margin-bottom:8px;'><b>Stranger</b> <span style='font-size:10px; color:var(--text-dim)'>${time}</span><br>${e.data}</div>`;
        scrollToBottom();
      };
    };
  };

  let createOffer = async (remoteU) => {
    await createPeerConnection();
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offerSentToRemote", { username, remoteUser: remoteU, offer });
  };

  socket.on("ReceiveOffer", async (data) => {
    if (!isChatStarted) return; 
    remoteUser = data.username;
    await createPeerConnection();
    await peerConnection.setRemoteDescription(data.offer);
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answerSentToUser1", { answer, sender: data.remoteUser, receiver: data.username });
    $.ajax({ url: "/update-on-engagement/" + username, type: "PUT" });
  });

  socket.on("ReceiveAnswer", async (data) => {
    if (!isChatStarted) return;
    if (!peerConnection.currentRemoteDescription) {
      await peerConnection.setRemoteDescription(data.answer);
    }
    $.ajax({ url: "/update-on-engagement/" + username, type: "PUT" });
  });

  socket.on("closedRemoteUser", () => {
    if (remoteStream) remoteStream.getTracks().forEach(t => t.stop());
    if (peerConnection) peerConnection.close();
    chatTextArea.innerHTML += "<div style='color:var(--accent-pink); font-size:12px; margin:10px 0;'>Stranger has disconnected. Finding someone new...</div>";
    scrollToBottom();
    setTimeout(() => location.reload(), 2000);
  });

  socket.on("candidateReceiver", (data) => {
    if (peerConnection && isChatStarted) {
      peerConnection.addIceCandidate(data.iceCandidateData).catch(e => console.log("ICE Error:", e));
    }
  });

  // UI Control Logic
  const controlBtns = document.querySelectorAll(".control-btn");
  if (controlBtns.length >= 2) {
    controlBtns[0].addEventListener("click", () => {
      isAudioMuted = !isAudioMuted;
      localStream.getAudioTracks()[0].enabled = !isAudioMuted;
      controlBtns[0].style.background = isAudioMuted ? "rgba(255,73,73,0.4)" : "rgba(255,255,255,0.1)";
    });
    controlBtns[1].addEventListener("click", () => {
      isVideoMuted = !isVideoMuted;
      localStream.getVideoTracks()[0].enabled = !isVideoMuted;
      controlBtns[1].style.background = isVideoMuted ? "rgba(255,73,73,0.4)" : "rgba(255,255,255,0.1)";
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      socket.emit("remoteUserClosed", { username, remoteUser });
      location.reload();
    });
  }
}

window.addEventListener("beforeunload", () => {
  if (localStream) localStream.getTracks().forEach(t => t.stop());
});
