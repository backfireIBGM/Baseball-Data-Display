(function () {
  const TEAM_IDS = [
    "BAL", "NYA", "BOS", "TBA", "TOR", "CLE", "KCA", "DET", "MIN", "CHA",
    "HOU", "SEA", "TEX", "ATH", "ANA", "PHI", "ATL", "NYN", "WAS", "MIA",
    "MIL", "CHN", "SLN", "CIN", "PIT", "LAN", "SDN", "ARI", "SFN", "COL"
  ];
  const DIV_IDS = ["AL_EAST", "AL_CENTRAL", "AL_WEST", "NL_EAST", "NL_CENTRAL", "NL_WEST"];

  async function updatePage() {
    const picker = document.getElementById("datePicker");
    const display = document.getElementById("displayDate");
    if (!picker) return;

    const selectedDateStr = picker.value.replace(/-/g, "");
    if (display) display.textContent = picker.value;

    try {
      const response = await fetch("data2025.txt");
      const text = await response.text();
      const lines = text.split("\n").filter((line) => line.trim() !== "");

      const stats = {};
      TEAM_IDS.forEach(id => stats[id] = { w: 0, l: 0 });
      let dailyGames = [];

      lines.forEach((line) => {
        const f = line.split(",").map((val) => val.replace(/"/g, ""));
        const gameDate = f[0]; // Field 1

        // Cumulative Standings Logic
        if (gameDate <= selectedDateStr) {
          const vTeam = f[3]; // Field 4
          const hTeam = f[6]; // Field 7
          const vR = parseInt(f[9], 10);  // Field 10
          const hR = parseInt(f[10], 10); // Field 11

          if (stats[vTeam] && stats[hTeam] && !isNaN(vR) && !isNaN(hR)) {
            if (vR > hR) {
              stats[vTeam].w++;
              stats[hTeam].l++;
            } else if (hR > vR) {
              stats[hTeam].w++;
              stats[vTeam].l++;
            }
          }
        }

        // Daily Box Score Logic
        if (gameDate === selectedDateStr) dailyGames.push(f);
      });

      renderStandings(stats);
      renderDailyBoxScores(dailyGames);
    } catch (err) {
      console.error("Data error:", err);
    }
  }

  function renderStandings(stats) {
    TEAM_IDS.forEach((abbr) => {
      const row = document.getElementById(abbr);
      if (row) {
        const w = stats[abbr].w, l = stats[abbr].l;
        const pct = (w + l > 0) ? (w / (w + l)).toFixed(3) : ".000";
        row.querySelector(".w").textContent = w;
        row.querySelector(".l").textContent = l;
        row.querySelector(".p").textContent = pct;
      }
    });

    DIV_IDS.forEach((id) => {
      const tbody = document.getElementById(id);
      if (!tbody) return;
      const rows = Array.from(tbody.querySelectorAll("tr"));
      rows.sort((a, b) => {
        const pctA = parseFloat(a.querySelector(".p").textContent);
        const pctB = parseFloat(b.querySelector(".p").textContent);
        if (pctB !== pctA) return pctB - pctA;
        return parseInt(b.querySelector(".w").textContent) - parseInt(a.querySelector(".w").textContent);
      });
      rows.forEach((row) => tbody.appendChild(row));
    });
  }

  function renderDailyBoxScores(games) {
    const container = document.getElementById("game-scores-container");
    if (!container) return;
    if (games.length === 0) {
      container.innerHTML = "<p>No games played on this date.</p>";
      return;
    }

    let html = "";
    games.forEach(g => {
      const vTeam = g[3], hTeam = g[6];
      const vLine = g[19], hLine = g[20];
      const vR = g[9], vH = g[22], vE = g[46], vLOB = g[37];
      const hR = g[10], hH = g[50], hE = g[74], hLOB = g[65];
      const maxInnings = Math.max(vLine.length, hLine.length);

      html += `<table border="1" style="margin-bottom: 20px; border-collapse: collapse;">
        <thead><tr><th>Team</th>${Array.from({length: maxInnings}).map((_, i) => `<th>${i+1}</th>`).join('')}<th>R</th><th>H</th><th>E</th><th>LOB</th></tr></thead>
        <tbody>
          <tr><td>${vTeam}</td>${vLine.padEnd(maxInnings, ' ').split('').map(c => `<td>${c === ' ' ? '' : c}</td>`).join('')}<td><strong>${vR}</strong></td><td>${vH}</td><td>${vE}</td><td>${vLOB}</td></tr>
          <tr><td>${hTeam}</td>${hLine.padEnd(maxInnings, ' ').split('').map(c => `<td>${c === ' ' ? '' : c}</td>`).join('')}<td><strong>${hR}</strong></td><td>${hH}</td><td>${hE}</td><td>${hLOB}</td></tr>
        </tbody></table>`;
    });
    container.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const picker = document.getElementById("datePicker");
    if (picker) {
      picker.addEventListener("change", updatePage);
      updatePage();
    }
  });
})();