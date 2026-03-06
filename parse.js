(function () {
  const TEAM_IDS = [
    "BAL", "NYA", "BOS", "TBA", "TOR", "CLE", "KCA", "DET", "MIN", "CHA",
    "HOU", "SEA", "TEX", "ATH", "ANA", "PHI", "ATL", "NYN", "WAS", "MIA",
    "MIL", "CHN", "SLN", "CIN", "PIT", "LAN", "SDN", "ARI", "SFN", "COL"
  ];

  const TEAM_NAMES = {
    "BAL": "Baltimore Orioles", "NYA": "New York Yankees", "BOS": "Boston Red Sox",
    "TBA": "Tampa Bay Rays", "TOR": "Toronto Blue Jays", "CLE": "Cleveland Guardians",
    "KCA": "Kansas City Royals", "DET": "Detroit Tigers", "MIN": "Minnesota Twins",
    "CHA": "Chicago White Sox", "HOU": "Houston Astros", "SEA": "Seattle Mariners",
    "TEX": "Texas Rangers", "ATH": "Sacramento Athletics", "ANA": "L.A. Angels",
    "PHI": "Philadelphia Phillies", "ATL": "Atlanta Braves", "NYN": "New York Mets",
    "WAS": "Washington Nationals", "MIA": "Miami Marlins", "MIL": "Milwaukee Brewers",
    "CHN": "Chicago Cubs", "SLN": "St. Louis Cardinals", "CIN": "Cincinnati Reds",
    "PIT": "Pittsburgh Pirates", "LAN": "L.A. Dodgers", "SDN": "San Diego Padres",
    "ARI": "Arizona Diamondbacks", "SFN": "San Francisco Giants", "COL": "Colorado Rockies"
  };

  const DIV_IDS = ["AL_EAST", "AL_CENTRAL", "AL_WEST", "NL_EAST", "NL_CENTRAL", "NL_WEST"];

  async function updatePage() {
    const picker = document.getElementById("datePicker");
    if (!picker) return;
    const selectedDateStr = picker.value.replace(/-/g, "");

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
    const template = document.getElementById("game-score-template");
    if (!container || !template) return;

    container.innerHTML = "";
    if (games.length === 0) {
      container.innerHTML = "<p>No games played on this date.</p>";
      return;
    }

    games.forEach(g => {
      const clone = template.content.cloneNode(true);
      const vAbbr = g[3], hAbbr = g[6];
      const vName = TEAM_NAMES[vAbbr] || vAbbr;
      const hName = TEAM_NAMES[hAbbr] || hAbbr;
      const vLine = g[19], hLine = g[20];
      const maxInnings = Math.max(vLine.length, hLine.length);

      // Set paragraph header
      clone.querySelector(".teams-names-display").textContent = `${vName} at ${hName}`;

      // Set cell names
      clone.querySelector(".v-row .name").textContent = vAbbr;
      clone.querySelector(".h-row .name").textContent = hAbbr;

      const fill = (rowCls, R, H, E, LOB) => {
        const row = clone.querySelector(rowCls);
        row.querySelector(".r strong").textContent = R;
        row.querySelector(".h").textContent = H;
        row.querySelector(".e").textContent = E;
        row.querySelector(".lob").textContent = LOB;
        return row;
      };

      const vRow = fill(".v-row", g[9], g[22], g[46], g[37]);
      const hRow = fill(".h-row", g[10], g[50], g[74], g[65]);

      const head = clone.querySelector(".header-row");
      const vNameCell = vRow.querySelector(".name");
      const hNameCell = hRow.querySelector(".name");

      for (let i = 0; i < maxInnings; i++) {
        head.children[0].insertAdjacentHTML('afterend', `<th>${maxInnings - i}</th>`);
        vNameCell.insertAdjacentHTML('afterend', `<td>${vLine[maxInnings - 1 - i] || ''}</td>`);
        hNameCell.insertAdjacentHTML('afterend', `<td>${hLine[maxInnings - 1 - i] || ''}</td>`);
      }

      container.appendChild(clone);
    });
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
      if (!tbody) return;
      tbody.innerHTML = "";

      const baseW = wcTeams[2]?.w || 0, baseL = wcTeams[2]?.l || 0;

      wcTeams.forEach((team, i) => {
        const teamName = TEAM_NAMES[team.id] || team.id;
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