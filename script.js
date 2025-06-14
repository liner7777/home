const userId = "861334654366908466";
const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusIcon = document.getElementById("status-icon");
const statusText = document.getElementById("status-text");
const activity = document.getElementById("activity");
const copyBtn = document.getElementById("copyBtn");

let presence = null;


function updateStatus(status) {
  const statusIcon = document.getElementById("status-icon");
  const statusText = document.getElementById("status-text");

  const svgs = {
    online: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#43b581" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
      </svg>`,
    idle: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#faa61a" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    dnd: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#f04747" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
        <rect x="7" y="11" width="10" height="2" fill="#000"/>
      </svg>`,
    offline: `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#747f8d" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" />
      </svg>`
  };

  // Insert the appropriate SVG or fallback to offline
  statusIcon.innerHTML = svgs[status] || svgs.offline;

  // Set readable text
}


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

  // Capitalize first letter for display

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

updateStatus(discStatus)

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


