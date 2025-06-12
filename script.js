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
};
