import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

const userId = "861334654366908466";
const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const activity = document.getElementById("activity");
const copyBtn = document.getElementById("copyBtn");

let presence = null;

const statusColors = {
  online: "status-online",
  idle: "status-idle",
  dnd: "status-dnd",
  offline: "status-offline",
};

copyBtn.addEventListener("click", () => {
  if (!presence || !presence.discord_user) return;

  const user = presence.discord_user;
  const textToCopy = user.username; // just username only

  navigator.clipboard.writeText(textToCopy).then(() => {
    copyBtn.textContent = "✅";
    setTimeout(() => (copyBtn.textContent = "📋"), 1500);
  });
});

const socket = new WebSocket("wss://api.lanyard.rest/socket");

socket.onopen = () => {
  socket.send(
    JSON.stringify({
      op: 2,
      d: {
        subscribe_to_ids: [userId],
      },
    })
  );
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (!data.t || !data.d) return;

  if (data.t === "INIT_STATE") {
    presence = data.d[userId];
  } else if (data.t === "PRESENCE_UPDATE") {
    presence = data.d;
  } else {
    return;
  }

  if (!presence || !presence.discord_user) {
    username.textContent = "No user data found.";
    statusIcon.className = "status-icon";
    statusText.textContent = "";
    activity.textContent = "";
    avatar.src = "https://via.placeholder.com/100?text=?";
    return;
  }

  const user = presence.discord_user;
  avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  username.textContent = user.username; // no discriminator

  // Set status icon
  let discStatus = presence.discord_status || "offline";

  // Remove all status classes
  statusIcon.className = "status-icon";

  // Add the correct class
  if (statusColors[discStatus]) {
    statusIcon.classList.add(statusColors[discStatus]);
  } else {
    statusIcon.style.backgroundColor = "gray"; // fallback
  }

  // Capitalize first letter for display
  statusText.textContent =
    discStatus.charAt(0).toUpperCase() + discStatus.slice(1);

  // Show activity
  if (presence.activities && presence.activities.length > 0) {
    const currentActivity = presence.activities.find(
      (act) => act.name && act.name !== "Custom Status"
    );
    activity.textContent = currentActivity
      ? `Activity: ${currentActivity.name}`
      : "No activity";
  } else {
    activity.textContent = "No activity";
  }

  const spotifyContainer = document.getElementById('spotifyContainer');
const spotifyInfo = document.getElementById('spotifyInfo');

if (presence.listening_to_spotify && presence.spotify) {
  const { song, artist, album_art_url, track_id } = presence.spotify;
  spotifyInfo.innerHTML = `
    <div class="spotify-track">
      <img src="${album_art_url}" alt="Album Art">
      <div class="track-name">${song}</div>
      <div class="track-artist">${artist}</div>
      <iframe class="spotify-embed"
        src="https://open.spotify.com/embed/track/${track_id}"
        width="100%" height="80" frameborder="0" allowtransparency="true"
        allow="encrypted-media"></iframe>
    </div>
  `;
} else {
  spotifyInfo.innerHTML = 'Not listening to Spotify right now.';
}

};

// Basic Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg'), antialias: true });
renderer.setSize(innerWidth, innerHeight);
camera.position.z = 2;

// Create a trippy animated shader material
const geometry = new THREE.PlaneGeometry(2, 2);

const material = new THREE.ShaderMaterial({
  fragmentShader: `
    uniform float time;
    void main() {
      vec2 uv = gl_FragCoord.xy / vec2(1920.0, 1080.0);
      uv = uv * 2.0 - 1.0;
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      float col = 0.5 + 0.5 * sin(10.0 * r - time * 5.0);
      gl_FragColor = vec4(vec3(col * sin(a * 3.0 + time), col * cos(a * 2.0 - time), col), 1.0);
    }
  `,
  uniforms: {
    time: { value: 0 }
  }
});

const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Animate the shader
function animate() {
  requestAnimationFrame(animate);
  material.uniforms.time.value += 0.01;
  renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

