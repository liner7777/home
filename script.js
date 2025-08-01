const userId = "861334654366908466";
const avatar = document.getElementById("avatar");
const username = document.getElementById("username");
const statusIcon = document.getElementById("status-icon");
const activity = document.getElementById("activity");
const copyBtn = document.getElementById("copyBtn");
const spotifyContainer = document.getElementById("spotifyContainer");
const spotifyInfo = document.getElementById("spotifyInfo");
const cardBox = document.querySelector(".card");

let presence = null;

function getContrastYIQ(hexcolor) {
  hexcolor = hexcolor.replace("#", "");
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
}

function colorDifference(c1, c2) {
  function hexToRgb(hex) {
    let bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  }
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

function getDominantColor(imageUrl, callback) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageUrl;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += 4 * 10) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);
    callback(`rgb(${r}, ${g}, ${b})`);
  };
}

function applyDominantColor(imageUrl) {
  if (!imageUrl) return;
  getDominantColor(imageUrl, (bgColor) => {
    if (!bgColor) return;

    function rgbToHex(rgb) {
      const result = rgb.match(/\d+/g);
      if (!result) return "#000000";
      return (
        "#" +
        result
          .map((x) => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("")
      );
    }

    const bgHex = rgbToHex(bgColor);
    const black = "#000000";
    const white = "#ffffff";
    const distBlack = colorDifference(bgHex, black);
    const distWhite = colorDifference(bgHex, white);

    let textColor = distBlack > distWhite ? black : white;
    if (colorDifference(bgHex, textColor) < 50) {
      textColor = textColor === black ? white : black;
    }

    if (spotifyContainer) {
      spotifyContainer.style.backgroundColor = bgColor;
      spotifyContainer.style.color = textColor;
      const trackName = spotifyContainer.querySelector(".track-name");
      const trackArtist = spotifyContainer.querySelector(".track-artist");
      if (trackName) trackName.style.color = textColor;
      if (trackArtist) trackArtist.style.color = textColor;
    }

    if (cardBox) {
      cardBox.style.backgroundColor = bgColor;
      cardBox.style.color = textColor;
    }
  });
}

function updateStatus(status) {
  const svgs = {
    online: `<svg width="16" height="16" viewBox="0 0 24 24" fill="#43b581" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /></svg>`,
    idle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="#faa61a" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    dnd: `<svg width="16" height="16" viewBox="0 0 24 24" fill="#f04747" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /><rect x="7" y="11" width="10" height="2" fill="#000"/></svg>`,
    offline: `<svg width="16" height="16" viewBox="0 0 24 24" fill="#747f8d" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /></svg>`,
  };

  statusIcon.innerHTML = svgs[status] || svgs.offline;
}

copyBtn.addEventListener("click", () => {
  if (!presence || !presence.discord_user) return;
  const user = presence.discord_user;
  navigator.clipboard.writeText(user.username).then(() => {
    copyBtn.textContent = "✅";
    setTimeout(() => (copyBtn.textContent = "📋"), 1500);
  });
});

const socket = new WebSocket("wss://api.lanyard.rest/socket");

socket.onopen = () => {
  socket.send(JSON.stringify({ op: 2, d: { subscribe_to_ids: [userId] } }));
  setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ op: 3 }));
    }
  }, 30000);
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (!data.t || !data.d) return;

  presence = data.t === "INIT_STATE" ? data.d[userId] : data.t === "PRESENCE_UPDATE" ? data.d : null;
  if (!presence || !presence.discord_user) {
    username.textContent = "No user data found.";
    statusIcon.innerHTML = "";
    activity.textContent = "";
    avatar.src = "https://via.placeholder.com/100?text=?";
    return;
  }

  const user = presence.discord_user;
  avatar.src = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  username.textContent = user.username;
  updateStatus(presence.discord_status || "offline");

  const currentActivity = presence.activities?.find(
    (act) => act.name && act.name !== "Custom Status"
  );
  activity.textContent = currentActivity ? `Activity: ${currentActivity.name}` : "No activity";

  // Handle Spotify
  if (presence.listening_to_spotify && presence.spotify) {
    const { song, artist, album_art_url, track_id } = presence.spotify;
    window.updateThreeWithSpotifyArt?.(album_art_url);
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
    applyDominantColor(album_art_url);
  } else {
    // Handle TIDAL via Music Presence
    const tidalActivity = presence.activities?.find((act) => act.name === "TIDAL");
    if (tidalActivity) {
      const { state: artist, details: song, assets } = tidalActivity;
      const rawImg = assets?.large_image;
      const albumArt = rawImg?.startsWith("mp:external/")
        ? `https://media.discordapp.net/external/${rawImg.split("mp:external/")[1].split("/")[0]}/https/${rawImg.split("https/")[1]}`
        : "";
          spotifyInfo.innerHTML = `
        <div class="spotify-track">
          <img src="${albumArt}" alt="Album Art">
          <div class="track-name">${song}</div>
          <div class="tidal-label">TIDAL</div>
        </div>
      `;
      applyDominantColor(albumArt);
      window.updateThreeWithSpotifyArt?.(albumArt);
    } else {
      // No music currently playing
      spotifyInfo.innerHTML = "Not listening to music right now.";
      if (spotifyContainer) {
        spotifyContainer.style.backgroundColor = "";
        spotifyContainer.style.color = "";
        const trackName = spotifyContainer.querySelector(".track-name");
        const trackArtist = spotifyContainer.querySelector(".track-artist");
        if (trackName) trackName.style.color = "";
        if (trackArtist) trackArtist.style.color = "";
      }
      if (cardBox) {
        cardBox.style.backgroundColor = "";
        cardBox.style.color = "";
      }
    }
  }
};
