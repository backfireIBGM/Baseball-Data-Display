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
          const vTeam = f[3], hTeam = f[6];
          const vR = parseInt(f[9], 10), hR = parseInt(f[10], 10);
          if (stats[vTeam] && stats[hTeam] && !isNaN(vR) && !isNaN(hR)) {
            if (vR > hR) { stats[vTeam].w++; stats[hTeam].l++; }
            else if (hR > vR) { stats[hTeam].w++; stats[vTeam].l++; }
          }
        }
        if (gameDate === selectedDateStr) dailyGames.push(f);
      });

      renderStandings(stats);
      renderDailyBoxScores(dailyGames);
      renderWildcard(stats);
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
        return pctB !== pctA ? pctB - pctA : parseInt(b.querySelector(".w").textContent) - parseInt(a.querySelector(".w").textContent);
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
      const vTeam = g[3], hTeam = g[6], vLine = g[19], hLine = g[20];
      const vR = g[9], vH = g[22], vE = g[46], vLOB = g[37];
      const hR = g[10], hH = g[50], hE = g[74], hLOB = g[65];
      const maxInnings = Math.max(vLine.length, hLine.length);

      html += `<table border="1" style="margin-bottom: 20px; margin-right: 20px; border-collapse: collapse; display: inline-table;">
        <thead><tr><th>Team</th>${Array.from({length: maxInnings}).map((_, i) => `<th>${i+1}</th>`).join('')}<th>R</th><th>H</th><th>E</th><th>LOB</th></tr></thead>
        <tbody>
          <tr><td>${vTeam}</td>${vLine.padEnd(maxInnings, ' ').split('').map(c => `<td>${c === ' ' ? '' : c}</td>`).join('')}<td><strong>${vR}</strong></td><td>${vH}</td><td>${vE}</td><td>${vLOB}</td></tr>
          <tr><td>${hTeam}</td>${hLine.padEnd(maxInnings, ' ').split('').map(c => `<td>${c === ' ' ? '' : c}</td>`).join('')}<td><strong>${hR}</strong></td><td>${hH}</td><td>${hE}</td><td>${hLOB}</td></tr>
        </tbody></table>`;
    });
    container.innerHTML = html;
  }

  function renderWildcard(stats) {
    const LEAGUE_MAP = {
      AL: { divs: ["AL_EAST", "AL_CENTRAL", "AL_WEST"], teams: ["BAL", "NYA", "BOS", "TBA", "TOR", "CLE", "KCA", "DET", "MIN", "CHA", "HOU", "SEA", "TEX", "ATH", "ANA"] },
      NL: { divs: ["NL_EAST", "NL_CENTRAL", "NL_WEST"], teams: ["PHI", "ATL", "NYN", "WAS", "MIA", "MIL", "CHN", "SLN", "CIN", "PIT", "LAN", "SDN", "ARI", "SFN", "COL"] }
    };

    ["AL", "NL"].forEach(lg => {
      const leaders = new Set();
      LEAGUE_MAP[lg].divs.forEach(divId => {
        const divRows = document.getElementById(divId).querySelectorAll("tr");
        if (divRows.length > 0) leaders.add(divRows[0].id);
      });

      const wcTeams = LEAGUE_MAP[lg].teams
        .filter(id => !leaders.has(id))
        .map(id => {
          const w = stats[id].w, l = stats[id].l;
          return { id, w, l, p: (w + l > 0) ? (w / (w + l)) : 0 };
        })
        .sort((a, b) => b.p - a.p || b.w - a.w);

      const tbody = document.getElementById(`${lg}_WILDCARD`);
      tbody.innerHTML = "";

      const baseW = wcTeams[2]?.w || 0, baseL = wcTeams[2]?.l || 0;

      wcTeams.forEach((team, i) => {
        const teamName = document.getElementById(team.id).cells[0].textContent;
        let gb = i <= 2 ? "—" : ((baseW - team.w) + (team.l - baseL)) / 2;
        tbody.innerHTML += `<tr><td>${teamName}</td><td>${team.w}</td><td>${team.l}</td><td>${team.p.toFixed(3)}</td><td>${gb}</td></tr>`;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const picker = document.getElementById("datePicker");
    if (picker) {
      picker.addEventListener("change", updatePage);
      updatePage();
    }
  });
})();