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
        const gameDate = f[0];

        if (gameDate <= selectedDateStr) {
          const vTeam = f[3], hTeam = f[6], vR = parseInt(f[9]), hR = parseInt(f[10]);
          if (stats[vTeam] && stats[hTeam] && !isNaN(vR) && !isNaN(hR)) {
            vR > hR ? (stats[vTeam].w++, stats[hTeam].l++) : (stats[hTeam].w++, stats[vTeam].l++);
          }
        }
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
      rows.sort((a, b) => parseFloat(b.querySelector(".p").textContent) - parseFloat(a.querySelector(".p").textContent));
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
      
      // Visitor Stats (Corrected Indices)
      const vR = g[9];
      const vH = g[21]; 
      const vE = g[22]; 
      const vLOB = g[30];

      // Home Stats (Corrected Indices)
      const hR = g[10];
      const hH = g[48]; 
      const hE = g[49]; 
      const hLOB = g[57];

      const maxInnings = Math.max(vLine.length, hLine.length);

      html += `<table border="1" style="margin-bottom: 20px; border-collapse: collapse;">
        <thead>
          <tr bgcolor="#eeeeee">
            <th>Team</th>
            ${Array.from({length: maxInnings}).map((_, i) => `<th>${i+1}</th>`).join('')}
            <th>R</th><th>H</th><th>E</th><th>LOB</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${vTeam}</td>
            ${vLine.padEnd(maxInnings, ' ').split('').map(c => `<td>${c === ' ' ? '' : c}</td>`).join('')}
            <td><strong>${vR}</strong></td><td>${vH}</td><td>${vE}</td><td>${vLOB}</td>
          </tr>
          <tr>
            <td>${hTeam}</td>
            ${hLine.padEnd(maxInnings, ' ').split('').map(c => `<td>${c === ' ' ? '' : c}</td>`).join('')}
            <td><strong>${hR}</strong></td><td>${hH}</td><td>${hE}</td><td>${hLOB}</td>
          </tr>
        </tbody>
      </table>`;
    });
    container.innerHTML = html;
  }

  // Ensure DOM is ready before adding listeners
  document.addEventListener("DOMContentLoaded", () => {
    const picker = document.getElementById("datePicker");
    if (picker) {
      picker.addEventListener("change", updatePage);
      updatePage();
    }
  });
})();