/* =========================================
   SUPABASE
========================================= */

const SUPABASE_URL =
    "https://pnuxrcqsxcvioxfnysos.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_sFTGk1jlOD7b6ZsaHA2wmw_b1oavWQ_";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================
   APP DATEN
========================================= */

let matches = [];
let currentMatchId = null;
let currentGameIndex = 0;

const roles = [
    "Top",
    "Jungle",
    "Mid",
    "ADC",
    "Support"
];

const defaultKoiPlayers = [
    "Dietrich Aden#48268",
    "KOI eraZer#kat",
    "SlimShady#Bazed",
    "Shinki Hiiro#EUW",
    "BrokenPromises#1887"
];

const defaultEnemyPlayers = [
    "ENEMY TOP",
    "ENEMY JUNGLE",
    "ENEMY MID",
    "ENEMY ADC",
    "ENEMY SUPPORT"
];

/* =========================================
   CHAMPION FUNKTIONEN
========================================= */

/* =========================================
   CHAMPION FUNKTIONEN
========================================= */

function getChampion(championName) {

    if (!championName) {
        return null;
    }

    return champions.find(
        champion =>
            champion.name.toLowerCase() ===
            championName.toLowerCase()
    ) || null;

}


function getChampionImage(championName) {

    const champion =
        getChampion(championName);

    if (!champion) {
        return null;
    }

    return `${champion.image}`;

}


function createChampionDatalist() {

    let datalist =
        document.getElementById("champion-list");

    if (!datalist) {

        datalist =
            document.createElement("datalist");

        datalist.id =
            "champion-list";

        document.body.appendChild(datalist);

    }

    datalist.innerHTML =
        champions.map(champion => `
            <option value="${escapeHtml(champion.name)}">
        `).join("");

}

createChampionDatalist();
/* =========================================
   INITIALISIERUNG
========================================= */

async function initializeApp() {

    await loadMatches();

    renderOverview();
    renderMatches();

}

initializeApp();


document.addEventListener("championsLoaded", () => {
    console.log("Champions sind bereit.");

    /*
     * Falls gerade der Game-Editor geöffnet ist,
     * Champion-Anzeigen aktualisieren.
     */
    if (
        document
            .getElementById("match-editor-page")
            ?.classList.contains("active")
    ) {
        document
            .querySelectorAll(".koi-champion, .enemy-champion")
            .forEach(input => {
                updateChampionPreview(input);
            });
    }
});

/* =========================================
   DATEN LADEN
========================================= */

/* =========================================
   DATEN AUS SUPABASE LADEN
========================================= */

async function loadMatches() {

    const {
        data: matchRows,
        error: matchError
    } = await supabaseClient
        .from("matches")
        .select("*")
        .order("date", {
            ascending: false
        });

    if (matchError) {

        console.error(
            "Fehler beim Laden der Matches:",
            matchError
        );

        alert(
            "Die Matchdaten konnten nicht geladen werden."
        );

        matches = [];

        return;
    }


    if (!matchRows || matchRows.length === 0) {

        matches = [];

        return;
    }


    const matchIds =
        matchRows.map(match => match.id);


    const {
        data: gameRows,
        error: gameError
    } = await supabaseClient
        .from("games")
        .select("*")
        .in("match_id", matchIds)
        .order("game_number", {
            ascending: true
        });


    if (gameError) {

        console.error(
            "Fehler beim Laden der Games:",
            gameError
        );

        alert(
            "Die Games konnten nicht geladen werden."
        );

        matches = [];

        return;
    }


    const gameIds =
        (gameRows || []).map(game => game.id);


    let playerRows = [];


    if (gameIds.length > 0) {

        const {
            data,
            error: playerError
        } = await supabaseClient
            .from("game_players")
            .select("*")
            .in("game_id", gameIds);


        if (playerError) {

            console.error(
                "Fehler beim Laden der Spielerdaten:",
                playerError
            );

            alert(
                "Die Spielerdaten konnten nicht geladen werden."
            );

            matches = [];

            return;
        }


        playerRows = data || [];
    }


    /*
        Supabase-Daten wieder in die bisherige
        Match-Struktur umwandeln.

        Dadurch müssen wir den großen Rest
        deiner App nicht umbauen.
    */

    matches = matchRows.map(matchRow => {

        const matchGames =
            (gameRows || [])
                .filter(
                    game =>
                        game.match_id === matchRow.id
                )
                .sort(
                    (a, b) =>
                        a.game_number -
                        b.game_number
                );


        const games = [];


        matchGames.forEach(gameRow => {

            const players =
                playerRows.filter(
                    player =>
                        player.game_id === gameRow.id
                );


            const koi =
                players
                    .filter(
                        player =>
                            player.team === "koi"
                    )
                    .sort(
                        (a, b) =>
                            a.id.localeCompare(b.id)
                    )
                    .map(player => ({
                        name: player.player_name,
                        champion: player.champion || "",
                        kills: Number(player.kills) || 0,
                        deaths: Number(player.deaths) || 0,
                        assists: Number(player.assists) || 0,
                        damage: Number(player.damage) || 0,
                        cs: Number(player.cs) || 0
                    }));


            const enemy =
                players
                    .filter(
                        player =>
                            player.team === "enemy"
                    )
                    .sort(
                        (a, b) =>
                            a.id.localeCompare(b.id)
                    )
                    .map(player => ({
                        name: player.player_name,
                        champion: player.champion || "",
                        kills: Number(player.kills) || 0,
                        deaths: Number(player.deaths) || 0,
                        assists: Number(player.assists) || 0,
                        damage: Number(player.damage) || 0,
                        cs: Number(player.cs) || 0
                    }));


            games[gameRow.game_number - 1] = {
    result: gameRow.result,
    gametime: gameRow.gametime || "",
    koi: koi,
    enemy: enemy
};

        });


        return {
            id: matchRow.id,
            date: matchRow.date,
            opponent: matchRow.opponent,
            type: matchRow.type,
            mode: matchRow.mode,
            games: games
        };

    });

}

/* =========================================
   NAVIGATION
========================================= */

document.querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener("click", () => {

            showPage(button.dataset.page);

        });

    });


function showPage(page) {

    document.querySelectorAll(".page")
        .forEach(element => {

            element.classList.remove("active");

        });


    const pageElement =
        document.getElementById(`${page}-page`);

    if (pageElement) {
        pageElement.classList.add("active");
    }


    document.querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    if (page === "overview") {
        renderOverview();
    }

    if (page === "matches") {
        renderMatches();
    }

}


/* =========================================
   NEUES MATCH
========================================= */

document.getElementById("new-match-btn")
    .addEventListener("click", () => {

        startNewMatch();

    });


function startNewMatch() {

    /*
        Sicherstellen, dass wir wirklich ein
        komplett neues Match erstellen.
    */
    currentMatchId = null;
    currentGameIndex = 0;


    /*
        Überschrift zurücksetzen
    */
    document.getElementById("editor-title")
        .textContent = "Match hinzufügen";

    document.getElementById("editor-subtitle")
        .textContent =
        "Erstelle einen neuen Scrim- oder Prime-League-Eintrag";


    /*
        Match-Grunddaten komplett leeren
    */
    document.getElementById("match-date")
        .value =
        new Date()
            .toISOString()
            .split("T")[0];

    document.getElementById("match-opponent")
        .value = "";

    document.getElementById("match-type")
        .value = "scrim";

    document.getElementById("match-mode")
        .value = "bo5";


    /*
        Game-Tabs neu aufbauen.
        Da currentMatchId null ist,
        darf updateGameTabs() kein gespeichertes
        Game laden.
    */
    updateGameTabs();


    /*
        Game-Editor komplett neu aufbauen.
        Dadurch werden die Standardspieler
        mit leeren Stats erzeugt.
    */
    renderGameEditor();


    /*
        Match hinzufügen anzeigen
    */
    showPage("match-editor");

}


/* =========================================
   SPIELANZAHL
========================================= */

function getGameCount(mode) {

    switch (mode) {

        case "bo3":
        case "fearless3":
            return 3;

        case "bo5":
        case "fearless5":
            return 5;

        default:
            return 5;
    }

}


/* =========================================
   MODE ÄNDERN
========================================= */

document.getElementById("match-mode")
    .addEventListener("change", () => {

        const count =
            getGameCount(
                document.getElementById("match-mode").value
            );


        if (currentGameIndex >= count) {
            currentGameIndex = count - 1;
        }


        updateGameTabs();
        renderGameEditor();

    });


/* =========================================
   MATCH EDITIEREN
========================================= */

function editMatch(id) {

    const match =
        matches.find(match => match.id === id);

    if (!match) {
        return;
    }


    currentMatchId = id;

    currentGameIndex = 0;


    document.getElementById("editor-title")
        .textContent = "Match bearbeiten";

    document.getElementById("editor-subtitle")
        .textContent =
        `KOI vs ${match.opponent}`;


    document.getElementById("match-date").value =
        match.date;

    document.getElementById("match-opponent").value =
        match.opponent;

    document.getElementById("match-type").value =
        match.type;

    document.getElementById("match-mode").value =
        match.mode;


    updateGameTabs();
    renderGameEditor();

    closeAllMenus();

    showPage("match-editor");
}


/* =========================================
   GAME TABS EDITOR
========================================= */

function updateGameTabs() {

    const container =
        document.getElementById("editor-game-tabs");

    const mode =
        document.getElementById("match-mode").value;

    const count =
        getGameCount(mode);


    document.getElementById("game-count-text")
        .textContent =
        `${count} Games`;


    container.innerHTML = "";


    for (let i = 0; i < count; i++) {

        let game = null;


        if (currentMatchId) {

            const match =
                matches.find(
                    match => match.id === currentMatchId
                );

            if (match && match.games) {
                game = match.games[i];
            }

        }


        const button =
            document.createElement("button");

        button.type = "button";

        button.className = "game-tab";

        if (i === currentGameIndex) {
            button.classList.add("active");
        }


        if (game) {

            if (game.result === "win") {
                button.classList.add("win");
            }

            if (game.result === "loss") {
                button.classList.add("loss");
            }

        } else {

            button.classList.add("not-played");

        }


        button.innerHTML = `
            G${i + 1}
            <span class="game-tab-result">
                ${
                    game
                        ? game.result === "win"
                            ? "WIN"
                            : "LOSS"
                        : "—"
                }
            </span>
        `;


        button.addEventListener("click", () => {

            currentGameIndex = i;

            updateGameTabs();

            renderGameEditor();

        });


        container.appendChild(button);
    }

}


/* =========================================
   GAME EDITOR
========================================= */

/* =========================================
   GAME EDITOR
========================================= */

function renderGameEditor() {

    const container =
        document.getElementById("game-editor");


    let game = null;


    /*
        Nur bei einem bestehenden Match
        ein bereits gespeichertes Game laden.

        Bei einem neuen Match bleibt game = null,
        damit immer ein komplett leerer Editor
        mit den Standard-Spielern erzeugt wird.
    */
    if (currentMatchId !== null) {

        const match =
            matches.find(
                match => match.id === currentMatchId
            );

        if (match && match.games) {

            game =
                match.games[currentGameIndex];

        }

    }


    const koiPlayers =
        game?.koi ||
        createDefaultPlayers(
            defaultKoiPlayers
        );


    const enemyPlayers =
        game?.enemy ||
        createDefaultPlayers(
            defaultEnemyPlayers
        );


    container.innerHTML = `

        <div class="game-editor-card">

            <div class="game-editor-header">

                <h2>
                    Game ${currentGameIndex + 1}
                </h2>


                <div class="form-group">

                    <label>
                        Ergebnis
                    </label>

                    <select
                        id="current-game-result"
                        class="game-result-select"
                    >

                        <option
                            value="win"
                            ${game?.result === "win"
                                ? "selected"
                                : ""}
                        >
                            WIN
                        </option>

                        <option
                            value="loss"
                            ${game?.result === "loss"
                                ? "selected"
                                : ""}
                        >
                            LOSS
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        GameTime
                    </label>

                    <input
                        type="text"
                        id="current-game-time"
                        placeholder="z. B. 32:45"
                        value="${escapeHtml(
                            game?.gametime || ""
                        )}"
                        autocomplete="off"
                    >

                </div>

            </div>


            <h2>
                KOI
            </h2>

            <div id="editor-koi-players">

                ${createPlayerFormsHtml(
                    "koi",
                    koiPlayers
                )}

            </div>


            <h2 style="margin-top:30px;">
                Gegner
            </h2>

            <div id="editor-enemy-players">

                ${createPlayerFormsHtml(
                    "enemy",
                    enemyPlayers
                )}

            </div>

        </div>

    `;


    document
        .querySelectorAll(
            ".koi-champion, .enemy-champion"
        )
        .forEach(input => {

            updateChampionPreview(input);

        });

}


/* =========================================
   SPIELER
========================================= */

function createDefaultPlayers(names) {

    return names.map(name => ({

        name: name,

        champion: "",

        kills: 0,

        deaths: 0,

        assists: 0,

        damage: 0,

        cs: 0

    }));

}


function createPlayerFormsHtml(team, players) {

    return players.map((player, index) => {

        return `
            <div class="player-form">

                <div class="player-role">
                    ${roles[index]}
                </div>


                <div class="player-grid">

                    <div class="form-group">
                        <label>
                            Spieler
                        </label>

                        <input
                            type="text"
                            class="${team}-name"
                            data-index="${index}"
                            value="${escapeHtml(player.name)}"
                        >
                    </div>


                    <div class="form-group champion-form-group">

                        <label>
                            Champion
                        </label>

                        <input
                            type="text"
                            class="${team}-champion"
                            data-index="${index}"
                            placeholder="Champion suchen..."
                            value="${escapeHtml(player.champion || "")}"
                            autocomplete="off"
                        >

                        <div
                            class="champion-preview"
                            id="${team}-champion-preview-${index}"
                        ></div>

                    </div>


                    <div class="form-group">
                        <label>
                            Kills
                        </label>

                        <input
                            type="number"
                            min="0"
                            class="${team}-kills"
                            data-index="${index}"
                            value="${Number(player.kills) || 0}"
                        >
                    </div>


                    <div class="form-group">
                        <label>
                            Deaths
                        </label>

                        <input
                            type="number"
                            min="0"
                            class="${team}-deaths"
                            data-index="${index}"
                            value="${Number(player.deaths) || 0}"
                        >
                    </div>


                    <div class="form-group">
                        <label>
                            Assists
                        </label>

                        <input
                            type="number"
                            min="0"
                            class="${team}-assists"
                            data-index="${index}"
                            value="${Number(player.assists) || 0}"
                        >
                    </div>


                    <div class="form-group">
                        <label>
                            CS
                        </label>

                        <input
                            type="number"
                            min="0"
                            class="${team}-cs"
                            data-index="${index}"
                            value="${Number(player.cs) || 0}"
                        >
                    </div>


                    <div class="form-group">
                        <label>
                            Damage
                        </label>

                        <input
                            type="number"
                            min="0"
                            class="${team}-damage"
                            data-index="${index}"
                            value="${Number(player.damage) || 0}"
                        >
                    </div>

                </div>

            </div>
        `;

    }).join("");
}


/* =========================================
   SPIELER AUSLESEN
========================================= */

function getPlayersFromEditor(team) {

    const players = [];

    for (let i = 0; i < 5; i++) {

        players.push({

            name:
                document.querySelector(
                    `.${team}-name[data-index="${i}"]`
                ).value,

            champion:
                document.querySelector(
                    `.${team}-champion[data-index="${i}"]`
                ).value,

            kills:
                Number(
                    document.querySelector(
                        `.${team}-kills[data-index="${i}"]`
                    ).value
                ),

            deaths:
                Number(
                    document.querySelector(
                        `.${team}-deaths[data-index="${i}"]`
                    ).value
                ),

            assists:
                Number(
                    document.querySelector(
                        `.${team}-assists[data-index="${i}"]`
                    ).value
                ),

            cs:
                Number(
                    document.querySelector(
                        `.${team}-cs[data-index="${i}"]`
                    ).value
                ),

            damage:
                Number(
                    document.querySelector(
                        `.${team}-damage[data-index="${i}"]`
                    ).value
                )

        });

    }

    return players;
}

/* =========================================
   MATCH SPEICHERN
========================================= */

document.getElementById("save-match")
    .addEventListener("click", saveCurrentMatch);


async function saveCurrentMatch() {

    const date =
        document.getElementById("match-date").value;

    const opponent =
        document
            .getElementById("match-opponent")
            .value
            .trim();

    const type =
        document.getElementById("match-type").value;

    const mode =
        document.getElementById("match-mode").value;


    /*
        Pflichtfelder prüfen
    */

    if (!date || !opponent) {

        alert(
            "Bitte Datum und Gegner eintragen."
        );

        return;
    }


    /*
        =========================================
        MATCH BESTIMMEN
        =========================================
    */

    let match;


    /*
        Bestehendes Match bearbeiten
    */

    if (
        currentMatchId !== null &&
        currentMatchId !== undefined
    ) {

        match =
            matches.find(
                match =>
                    match.id === currentMatchId
            );


        if (!match) {

            alert(
                "Das Match konnte nicht gefunden werden."
            );

            return;
        }

    }


    /*
        Neues Match
    */

    else {

        match = {
            id: null,
            date: date,
            opponent: opponent,
            type: type,
            mode: mode,
            games: []
        };

    }


    /*
        =========================================
        MATCH IN SUPABASE SPEICHERN
        =========================================
    */

    let matchId;


    /*
        Bestehendes Match aktualisieren
    */

    if (currentMatchId !== null) {

        const {
            data,
            error
        } = await supabaseClient
            .from("matches")
            .update({
                date: date,
                opponent: opponent,
                type: type,
                mode: mode
            })
            .eq("id", currentMatchId)
            .select()
            .single();


        if (error) {

            console.error(
                "Fehler beim Aktualisieren des Matches:",
                error
            );

            alert(
                "Das Match konnte nicht gespeichert werden."
            );

            return;
        }


        matchId =
            data.id;

    }


    /*
        Neues Match anlegen
    */

    else {

        const {
            data,
            error
        } = await supabaseClient
            .from("matches")
            .insert({
                date: date,
                opponent: opponent,
                type: type,
                mode: mode
            })
            .select()
            .single();


        if (error) {

            console.error(
                "Fehler beim Erstellen des Matches:",
                error
            );

            alert(
                "Das Match konnte nicht gespeichert werden."
            );

            return;
        }


        matchId =
            data.id;


        /*
            Neues Match auch lokal in unserer
            bisherigen App-Struktur anlegen.
        */

        match.id =
            matchId;

        matches.push(match);

    }


    /*
        =========================================
        AKTUELLES GAME AUS DEM EDITOR LESEN
        =========================================
    */

    const resultElement =
        document.getElementById(
            "current-game-result"
        );


    if (resultElement) {

        const currentGame = {
    result:
        resultElement.value,

    gametime:
        document.getElementById(
            "current-game-time"
        )?.value.trim() || "",

    koi:
        getPlayersFromEditor("koi"),

    enemy:
        getPlayersFromEditor("enemy")
};


        /*
            Lokale Struktur aktualisieren
        */

        match.games[currentGameIndex] =
            currentGame;


        /*
            =========================================
            GAME IN SUPABASE SPEICHERN
            =========================================
        */

        const gameNumber =
            currentGameIndex + 1;


        /*
            Prüfen, ob dieses Game bereits existiert.
        */

        const {
            data: existingGame,
            error: existingGameError
        } = await supabaseClient
            .from("games")
            .select("id")
            .eq("match_id", matchId)
            .eq("game_number", gameNumber)
            .maybeSingle();


        if (existingGameError) {

            console.error(
                "Fehler beim Prüfen des Games:",
                existingGameError
            );

            alert(
                "Das Game konnte nicht gespeichert werden."
            );

            return;
        }


        let gameId;


        /*
            Game aktualisieren
        */

        if (existingGame) {

            const {
                data,
                error
            } = await supabaseClient
                .from("games")
               .update({
    result:
        currentGame.result,

    gametime:
        currentGame.gametime
})
                .eq("id", existingGame.id)
                .select()
                .single();


            if (error) {

                console.error(
                    "Fehler beim Aktualisieren des Games:",
                    error
                );

                alert(
                    "Das Game konnte nicht gespeichert werden."
                );

                return;
            }


            gameId =
                data.id;


            /*
                Alte Spielerdaten löschen.
                Danach werden die aktuellen Daten
                wieder sauber eingetragen.
            */

            const {
                error: deletePlayersError
            } = await supabaseClient
                .from("game_players")
                .delete()
                .eq("game_id", gameId);


            if (deletePlayersError) {

                console.error(
                    "Fehler beim Löschen alter Spielerdaten:",
                    deletePlayersError
                );

                alert(
                    "Die Spielerdaten konnten nicht aktualisiert werden."
                );

                return;
            }

        }


        /*
            Neues Game anlegen
        */

        else {

            const {
                data,
                error
            } = await supabaseClient
                .from("games")
                .insert({
    match_id: matchId,
    game_number: gameNumber,
    result: currentGame.result,
    gametime: currentGame.gametime
})
                .select()
                .single();


            if (error) {

                console.error(
                    "Fehler beim Erstellen des Games:",
                    error
                );

                alert(
                    "Das Game konnte nicht gespeichert werden."
                );

                return;
            }


            gameId =
                data.id;

        }


        /*
            =========================================
            SPIELER SPEICHERN
            =========================================
        */

        const playerRows = [];


        /*
            KOI
        */

        currentGame.koi.forEach(player => {

            playerRows.push({

                game_id: gameId,

                team: "koi",

                player_name:
                    player.name,

                champion:
                    player.champion || null,

                kills:
                    Number(player.kills) || 0,

                deaths:
                    Number(player.deaths) || 0,

                assists:
                    Number(player.assists) || 0,

                damage:
                    Number(player.damage) || 0,

                cs:
                    Number(player.cs) || 0

            });

        });


        /*
            Gegner
        */

        currentGame.enemy.forEach(player => {

            playerRows.push({

                game_id: gameId,

                team: "enemy",

                player_name:
                    player.name,

                champion:
                    player.champion || null,

                kills:
                    Number(player.kills) || 0,

                deaths:
                    Number(player.deaths) || 0,

                assists:
                    Number(player.assists) || 0,

                damage:
                    Number(player.damage) || 0,

                cs:
                    Number(player.cs) || 0

            });

        });


        /*
            Spieler gesammelt einfügen
        */

        if (playerRows.length > 0) {

            const {
                error
            } = await supabaseClient
                .from("game_players")
                .insert(playerRows);


            if (error) {

                console.error(
                    "Fehler beim Speichern der Spieler:",
                    error
                );

                alert(
                    "Die Spielerdaten konnten nicht gespeichert werden."
                );

                return;
            }

        }

    }


    /*
        =========================================
        LOKALE DATEN AKTUALISIEREN
        =========================================
    */

    match.date =
        date;

    match.opponent =
        opponent;

    match.type =
        type;

    match.mode =
        mode;


    /*
        Games auf die Größe des gewählten
        Modus begrenzen.
    */

    const gameCount =
        getGameCount(mode);

    match.games =
        match.games.slice(
            0,
            gameCount
        );


    /*
        =========================================
        ERFOLG
        =========================================
    */

    alert(
        "Match wurde gespeichert."
    );


    /*
        Seite neu laden.
        Die Daten kommen danach direkt
        aus Supabase.
    */

    window.location.reload();

}


/* =========================================
   MATCH LISTE
========================================= */

function renderMatches() {

    const container =
        document.getElementById("matches-list");


    if (matches.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Noch keine Matches gespeichert.
            </div>
        `;

        return;
    }


    const sortedMatches =
        [...matches].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


    container.innerHTML =
        sortedMatches.map(match => {

            const gameCount =
                getGameCount(match.mode);


            const typeText =
                match.type === "prime"
                    ? "Prime League"
                    : "Scrim";


            const modeText =
                getModeText(match.mode);


            let gameButtons = "";


            for (let i = 0; i < gameCount; i++) {

                const game =
                    match.games?.[i];


                let className = "mini-game empty";
                let text = `G${i + 1}`;


                if (game) {

                    if (game.result === "win") {
                        className = "mini-game win";
                    }

                    if (game.result === "loss") {
                        className = "mini-game loss";
                    }

                }


                gameButtons += `
                    <div class="${className}">
                        ${text}
                    </div>
                `;

            }


            return `

                <div
                    class="match-row"
                    onclick="viewMatch('${match.id}', 0)"
                >

                    <div class="match-date">
                        ${formatDate(match.date)}
                    </div>


                    <div class="match-opponent">

                        KOI vs
                        ${escapeHtml(match.opponent)}

                        <small>
                            ${typeText}
                        </small>

                    </div>


                    <div class="match-mode">
                        ${modeText}
                    </div>


                    <div class="match-games">
                        ${gameButtons}
                    </div>


                    <div
                        class="menu-container"
                        onclick="event.stopPropagation()"
                    >

                        <button
                            class="menu-btn"
                            onclick="toggleMatchMenu('${match.id}')"
                        >
                            ⋮
                        </button>


                        <div
                            class="match-menu"
                            id="menu-${match.id}"
                        >

                            <button
                                onclick="editMatch('${match.id}')"
                            >
                                ✏️ Bearbeiten
                            </button>


                            <button
                                class="delete-btn"
                                onclick="deleteMatch('${match.id}')"
                            >
                                🗑️ Löschen
                            </button>

                        </div>

                    </div>

                </div>

            `;

        }).join("");

}


/* =========================================
   MATCH ANSEHEN
========================================= */

function viewMatch(id, gameIndex = -1) {

    const match =
        matches.find(match => match.id === id);

    if (!match) {
        return;
    }


    currentMatchId = id;
    currentGameIndex = gameIndex;


    document.getElementById("detail-title")
        .textContent =
        `KOI vs ${match.opponent}`;


    document.getElementById("detail-subtitle")
        .textContent =
        `${formatDate(match.date)} · ${getModeText(match.mode)}`;


    document.getElementById("detail-match-type")
        .textContent =
        match.type === "prime"
            ? "Prime League"
            : "Scrim";


    renderDetailTabs(match);
    renderDetailGame(match);


    closeAllMenus();

    showPage("match-detail");
}


/* =========================================
   DETAIL GAME TABS
========================================= */

function renderDetailTabs(match) {

    const container =
        document.getElementById("detail-game-tabs");

    const count =
        getGameCount(match.mode);

    container.innerHTML = "";

    /* ================================
       SUMMARY / GAME 0
    ================================= */

    const summaryButton =
        document.createElement("button");

    summaryButton.type = "button";
    summaryButton.className = "game-tab summary-tab";

    if (currentGameIndex === -1) {
        summaryButton.classList.add("active");
    }

    summaryButton.innerHTML = `
        SUMMARY
        <span class="game-tab-result">
            Übersicht
        </span>
    `;

    summaryButton.addEventListener("click", () => {

        currentGameIndex = -1;

        renderDetailTabs(match);
        renderDetailGame(match);

    });

    container.appendChild(summaryButton);


    /* ================================
       G1 – G5
    ================================= */

    for (let i = 0; i < count; i++) {

        const game =
            match.games?.[i];

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "game-tab";

        if (i === currentGameIndex) {
            button.classList.add("active");
        }

        if (game) {

            if (game.result === "win") {
                button.classList.add("win");
            }

            if (game.result === "loss") {
                button.classList.add("loss");
            }

        } else {

            button.classList.add("not-played");

        }

        button.innerHTML = `
            G${i + 1}

            <span class="game-tab-result">
                ${
                    game
                        ? game.result === "win"
                            ? "WIN"
                            : "LOSS"
                        : "—"
                }
            </span>
        `;

        button.addEventListener("click", () => {

            currentGameIndex = i;

            renderDetailTabs(match);
            renderDetailGame(match);

        });

        container.appendChild(button);

    }

}

function renderDetailSummary(match) {

    const games =
        (match.games || [])
            .filter(Boolean);

    if (games.length === 0) {

        return `
            <div class="section-card">
                <div class="empty-game-card">

                    <h2>Match Summary</h2>

                    <p>
                        Für dieses Match wurden noch keine
                        Games eingetragen.
                    </p>

                </div>
            </div>
        `;

    }


    function createSummaryPlayers(teamKey) {

        const players =
            games[0]?.[teamKey] || [];

        return players.map((_, playerIndex) => {

           let totalKills = 0;
let totalDeaths = 0;
let totalAssists = 0;
let totalDamage = 0;

            const championsUsed = [];

            games.forEach((game, gameIndex) => {

                const player =
                    game?.[teamKey]?.[playerIndex];

                if (!player) {
                    return;
                }

                totalKills +=
                    Number(player.kills) || 0;

                totalDeaths +=
                    Number(player.deaths) || 0;

                totalAssists +=
                    Number(player.assists) || 0;

                totalDamage +=
                     Number(player.damage) || 0;

                if (player.champion) {

                    championsUsed.push({
                        name: player.champion,
                        game: gameIndex + 1
                    });

                }

            });


            const playerName =
                players[playerIndex]?.name || "—";


            return `
                <div class="summary-player-row">

                    <div class="summary-player-name">
                        ${escapeHtml(playerName)}
                    </div>


                    <div class="summary-champions">

                        ${
                            championsUsed.map(champion => {

                                const image =
                                    getChampionImage(
                                        champion.name
                                    );

                                return image
                                    ? `
                                        <img
                                            src="${image}"
                                            alt="${escapeHtml(champion.name)}"
                                            title="Game ${champion.game}: ${escapeHtml(champion.name)}"
                                            class="summary-champion-icon"
                                            onerror="this.style.display='none'"
                                        >
                                    `
                                    : `
                                        <span
                                            class="summary-champion-placeholder"
                                            title="Game ${champion.game}: ${escapeHtml(champion.name)}"
                                        >
                                            ?
                                        </span>
                                    `;

                            }).join("")

                        }

                    </div>


                    <div class="summary-kda">
                        ${totalKills}/${totalDeaths}/${totalAssists}
                    </div>
                    <div class="summary-damage">
                       ${formatNumber(totalDamage)}
                    </div>
                </div>
            `;

        }).join("");

    }


    return `
        <div class="section-card summary-card">

            <div class="summary-header">

                <div>

                    <div class="detail-game-title">
                        Match Summary
                    </div>

                    <div class="summary-subtitle">
                        ${games.length} ${games.length === 1 ? "Game" : "Games"} gespielt
                    </div>

                </div>

            </div>


            <div class="summary-team">

                <div class="summary-team-title">
                    KOI
                </div>

               <div class="summary-column-header">
    <div>Spieler</div>
    <div>Champions</div>
    <div>K/D/A</div>
    <div>Damage</div>
</div>

                ${createSummaryPlayers("koi")}

            </div>


            <div class="summary-team">

                <div class="summary-team-title">
                    ${escapeHtml(match.opponent)}
                </div>

                <div class="summary-column-header">
                    <div>Spieler</div>
                    <div>Champions</div>
                    <div>K/D/A</div>
                </div>

                ${createSummaryPlayers("enemy")}

            </div>

        </div>
    `;
}


/* =========================================
   DETAIL GAME
========================================= */

function renderDetailGame(match) {

    const container =
        document.getElementById("detail-game");


    if (currentGameIndex === -1) {

        container.innerHTML =
            renderDetailSummary(match);

        return;
    }


    const game =
        match.games?.[currentGameIndex];


    /*
        GAME NICHT VORHANDEN
    */

    if (!game) {

        container.innerHTML = `

            <div class="section-card">

                <div class="empty-game-card">

                    <h2>
                        Game ${currentGameIndex + 1}
                    </h2>

                    <p>
                        Für dieses Game wurden noch keine
                        Daten eingetragen.
                    </p>

                    <button
                        type="button"
                        class="primary-btn"
                        onclick="
                            startGameEntry(
                                '${match.id}',
                                ${currentGameIndex}
                            )
                        "
                    >
                        + Game eintragen
                    </button>

                </div>

            </div>

        `;

        return;
    }


    /*
        GAME VORHANDEN
    */

    const resultClass =
        game.result === "win"
            ? "result-win"
            : "result-loss";


    const resultText =
        game.result === "win"
            ? "WIN"
            : "LOSS";


    container.innerHTML = `

        <div class="section-card">

            <div class="detail-game-header">

                <div>

                    <div class="detail-game-title">
                        Game ${currentGameIndex + 1}
                    </div>

                    ${
                        game.gametime
                            ? `
                                <div class="detail-game-time">
                                    GameTime: ${escapeHtml(game.gametime)}
                                </div>
                              `
                            : ""
                    }

                </div>


                <div class="detail-game-actions">

                    <span
                        class="result-badge ${resultClass}"
                    >
                        ${resultText}
                    </span>


                    <button
                        type="button"
                        class="edit-game-btn"
                        onclick="
                            editCurrentGame(
                                '${match.id}',
                                ${currentGameIndex}
                            )
                        "
                    >
                        ✏ Bearbeiten
                    </button>

                </div>

            </div>

        </div>


        ${renderDetailTeam(
            "KOI",
            game.koi
        )}


        ${renderDetailTeam(
            match.opponent,
            game.enemy
        )}

    `;

}
/* =========================================
   AKTUELLES GAME BEARBEITEN
========================================= */

function editCurrentGame(matchId, gameIndex) {

    const match =
        matches.find(
            match => match.id === matchId
        );


    if (!match) {
        return;
    }


    const game =
        match.games?.[gameIndex];


    if (!game) {
        return;
    }


    /*
        Match und Game merken
    */

    currentMatchId = matchId;
    currentGameIndex = gameIndex;


    /*
        Matchdaten in den Editor laden
    */

    document.getElementById("editor-title")
        .textContent =
        `Game ${gameIndex + 1} bearbeiten`;


    document.getElementById("editor-subtitle")
        .textContent =
        `KOI vs ${match.opponent} · ${getModeText(match.mode)}`;


    document.getElementById("match-date").value =
        match.date;


    document.getElementById("match-opponent").value =
        match.opponent;


    document.getElementById("match-type").value =
        match.type;


    document.getElementById("match-mode").value =
        match.mode;


    /*
        Game-Auswahl aktualisieren
    */

    updateGameTabs();


    /*
        Spieler und Statistiken laden
    */

    renderGameEditor();


    /*
        Editor anzeigen
    */

    showPage("match-editor");

}

function renderDetailTeam(teamName, players) {
    return `
        <div class="detail-team-card">
            <div class="detail-team-title">
                ${escapeHtml(teamName)}
            </div>

            <div class="detail-row detail-header">
                <div>Spieler</div>
                <div>Champion</div>
                <div>K/D/A</div>
                <div>Damage</div>
                <div>CS</div>
            </div>

            ${players.map(player => `
                <div class="detail-row">
                    <div class="detail-player">
                        ${escapeHtml(player.name)}
                    </div>

                    <div class="detail-champion">

    <img
        src="${getChampionImage(player.champion)}"
        alt="${escapeHtml(player.champion || "")}"
        class="champion-icon"
        onerror="this.style.display='none'"
    >

    <span>
        ${escapeHtml(player.champion || "—")}
    </span>

</div>

                    <div class="detail-kda">
                        ${player.kills}/${player.deaths}/${player.assists}
                    </div>

                    <div class="detail-damage">
                        ${formatNumber(player.damage)}
                    </div>

                    <div class="detail-cs">
                        ${
                            player.cs !== undefined &&
                            player.cs !== null &&
                            player.cs !== ""
                                ? player.cs
                                : "—"
                        }
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}


/* =========================================
   MENÜ
========================================= */

function toggleMatchMenu(id) {

    const menu =
        document.getElementById(`menu-${id}`);


    if (!menu) {
        return;
    }


    const wasOpen =
        menu.classList.contains("open");


    closeAllMenus();


    if (!wasOpen) {
        menu.classList.add("open");
    }

}


function closeAllMenus() {

    document.querySelectorAll(".match-menu")
        .forEach(menu => {

            menu.classList.remove("open");

        });

}


document.addEventListener("click", () => {

    closeAllMenus();

});


/* =========================================
   MATCH LÖSCHEN
========================================= */

async function deleteMatch(id) {

    const match =
        matches.find(
            match => match.id === id
        );

    if (!match) {
        return;
    }

    const confirmed =
        confirm(
            `Möchtest du KOI vs ${match.opponent} wirklich löschen?`
        );

    if (!confirmed) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("matches")
        .delete()
        .eq("id", id);

    if (error) {

        console.error(
            "Fehler beim Löschen des Matches:",
            error
        );

        alert(
            "Das Match konnte nicht gelöscht werden."
        );

        return;
    }

    matches =
        matches.filter(
            match => match.id !== id
        );

    renderMatches();
    renderOverview();
}


/* =========================================
   ZURÜCK
========================================= */

document.getElementById("detail-back")
    .addEventListener("click", () => {

        showPage("matches");

    });


document.getElementById("editor-back")
    .addEventListener("click", () => {

        showPage("matches");

    });


document.getElementById("cancel-editor")
    .addEventListener("click", () => {

        currentMatchId = null;

        showPage("matches");

    });


document.getElementById("overview-all-matches")
    .addEventListener("click", () => {

        showPage("matches");

    });


/* =========================================
   ÜBERSICHT
========================================= */

function renderOverview() {

    let totalGames = 0;
    let wins = 0;
    let losses = 0;

    let seriesWins = 0;
    let seriesLosses = 0;


    matches.forEach(match => {

        if (!match.games) {
            return;
        }


        /*
            Einzelne Games zählen
        */

        match.games.forEach(game => {

            if (!game) {
                return;
            }


            totalGames++;


            if (game.result === "win") {
                wins++;
            } else {
                losses++;
            }

        });


        /*
            Series-Ergebnis bestimmen

            Eine Serie zählt nur einmal.
            Mehr Siege als Niederlagen = Series Win
            Mehr Niederlagen als Siege = Series Loss

            Unentschiedene / noch nicht entschiedene
            Serien werden nicht gewertet.
        */

        const playedGames =
            match.games.filter(Boolean);


        const seriesGameWins =
            playedGames.filter(
                game => game.result === "win"
            ).length;


        const seriesGameLosses =
            playedGames.filter(
                game => game.result === "loss"
            ).length;


        if (seriesGameWins > seriesGameLosses) {

            seriesWins++;

        } else if (seriesGameLosses > seriesGameWins) {

            seriesLosses++;

        }

    });


    /*
        Series Winrate
    */

    const seriesCount =
        seriesWins + seriesLosses;


    const winrate =
        seriesCount > 0
            ? Math.round(
                (seriesWins / seriesCount) * 100
            )
            : 0;


    document.getElementById("total-matches")
        .textContent = matches.length;


    document.getElementById("total-games")
        .textContent = totalGames;


    document.getElementById("total-wins")
        .textContent = wins;


    document.getElementById("total-losses")
        .textContent = losses;


    document.getElementById("winrate")
        .textContent = `${winrate}%`;


    renderRecentMatches();
    renderOpponentStats();

}


/* =========================================
   LETZTE MATCHES
========================================= */

function renderRecentMatches() {

    const container =
        document.getElementById("recent-matches");


    const recent =
        [...matches]
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            )
            .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Noch keine Matches vorhanden.
            </div>
        `;

        return;
    }


    container.innerHTML =
        recent.map(match => {

            const games =
                match.games || [];


            const gameCount =
                getGameCount(match.mode);


            const wins =
                games
                    .filter(Boolean)
                    .filter(
                        game => game.result === "win"
                    )
                    .length;


            const losses =
                games
                    .filter(Boolean)
                    .filter(
                        game => game.result === "loss"
                    )
                    .length;


            const typeText =
                match.type === "prime"
                    ? "Prime League"
                    : "Scrim";


            const modeText =
                getModeText(match.mode);


            /*
                Game-Buttons
                SUMMARY steht vor G1.
            */

            let gameButtons = `

                <button
                    type="button"
                    class="recent-game-button summary"
                    onclick="
                        selectRecentGame(
                            event,
                            '${match.id}',
                            -1
                        )
                    "
                >

                    SUMMARY

                    <span class="game-result">
                        Übersicht
                    </span>

                </button>

            `;


            /*
                G1 bis G5
            */

            for (let i = 0; i < gameCount; i++) {

                const game =
                    games[i];


                let className =
                    "recent-game-button empty";


                let resultText =
                    "Nicht eingetragen";


                if (game) {

                    if (game.result === "win") {

                        className =
                            "recent-game-button win";

                        resultText = "WIN";

                    } else {

                        className =
                            "recent-game-button loss";

                        resultText = "LOSS";

                    }

                }


                gameButtons += `

                    <button
                        type="button"
                        class="${className}"
                        onclick="
                            selectRecentGame(
                                event,
                                '${match.id}',
                                ${i}
                            )
                        "
                    >

                        G${i + 1}

                        <span class="game-result">
                            ${resultText}
                        </span>

                    </button>

                `;

            }


            return `

                <div class="recent-match-wrapper">

                    <!-- MATCH KOPFZEILE -->

                    <div
                        class="recent-match-row"
                        onclick="toggleRecentMatch('${match.id}')"
                    >

                        <div class="match-date">
                            ${formatDate(match.date)}
                        </div>


                        <div class="match-opponent">

                            KOI vs
                            ${escapeHtml(match.opponent)}

                            <small>
                                ${typeText}
                            </small>

                        </div>


                        <div class="match-mode">
                            ${modeText}
                        </div>


                        <div class="match-games">

                            <span class="win-text">
                                ${wins} W
                            </span>

                            <span class="loss-text">
                                ${losses} L
                            </span>

                        </div>


                        <button
                            type="button"
                            class="expand-match-btn"
                            id="expand-${match.id}"
                            onclick="
                                event.stopPropagation();
                                toggleRecentMatch('${match.id}');
                            "
                        >
                            ↓
                        </button>

                    </div>


                    <!-- AUFGEKLAPPTER BEREICH -->

                    <div
                        class="recent-match-games"
                        id="recent-games-${match.id}"
                    >

                        <div class="recent-game-list">

                            ${gameButtons}

                        </div>


                        <div
                            id="preview-${match.id}"
                            class="recent-game-preview"
                        ></div>

                    </div>

                </div>

            `;

        }).join("");

}

/* =========================================
   GAME IN DER MATCH-KURZANSICHT AUSWÄHLEN
========================================= */

function selectRecentGame(event, matchId, gameIndex) {

    event.stopPropagation();


    const match =
        matches.find(
            match => match.id === matchId
        );


    if (!match) {
        return;
    }


    /*
        SUMMARY
    */

    if (gameIndex === -1) {

        renderRecentSummary(match);

    } else {

        /*
            Falls das Game noch nicht existiert:
            direkt Eingabemaske öffnen.
        */

        if (!match.games?.[gameIndex]) {

            startGameEntry(
                matchId,
                gameIndex
            );

            return;
        }


        /*
            Game existiert:
            Kurzansicht aktualisieren.
        */

        renderRecentGamePreview(
            match,
            gameIndex
        );

    }


    /*
        Aktiven Button markieren.
    */

    const gameButtons =
        document.querySelectorAll(
            `#recent-games-${matchId} .recent-game-button`
        );


    gameButtons.forEach((button, index) => {

        /*
            SUMMARY ist Button 0,
            deshalb entspricht der Button-Index
            dem gameIndex + 1.
        */

        const buttonIndex =
            gameIndex === -1
                ? 0
                : gameIndex + 1;


        button.classList.toggle(
            "active",
            index === buttonIndex
        );

    });

}

function renderRecentSummary(match) {

    const container =
        document.getElementById(
            `preview-${match.id}`
        );

    if (!container) {
        return;
    }

    const games =
        (match.games || []).filter(Boolean);

    if (games.length === 0) {

        container.innerHTML = `
            <div class="preview-empty">

                <p>
                    Für dieses Match wurden noch keine Games eingetragen.
                </p>

                <button
                    type="button"
                    class="preview-add-btn"
                    onclick="
                        startGameEntry(
                            '${match.id}',
                            0
                        )
                    "
                >
                    + Game 1 eintragen
                </button>

            </div>
        `;

        return;
    }


    /*
        Spieler zusammenfassen
    */

    function buildSummary(players) {

        return players.map((_, playerIndex) => {

            let totalKills = 0;
            let totalDeaths = 0;
            let totalAssists = 0;
            let totalCS = 0;
            let totalDamage = 0;

            const champions = [];


            games.forEach((game, gameIndex) => {

                const player =
                    players === game.koi
                        ? game.koi?.[playerIndex]
                        : game.enemy?.[playerIndex];

                if (!player) {
                    return;
                }


                totalKills += Number(player.kills) || 0;
                totalDeaths += Number(player.deaths) || 0;
                totalAssists += Number(player.assists) || 0;
                totalCS += Number(player.cs) || 0;
                totalDamage += Number(player.damage) || 0;


                if (player.champion) {

                    champions.push({
                        name: player.champion,
                        game: gameIndex + 1
                    });

                }

            });


            return {
                name: players[playerIndex]?.name || "—",
                champions,
                kills: totalKills,
                deaths: totalDeaths,
                assists: totalAssists,
                cs: totalCS,
                damage: totalDamage
            };

        });

    }


    const koiSummary =
        buildSummary(games[0].koi || []);

    const enemySummary =
        buildSummary(games[0].enemy || []);


    function renderSummaryPlayers(players) {

        return players.map(player => `

            <div class="preview-player-row">

                <div class="preview-player-name">
                    ${escapeHtml(player.name)}
                </div>


                <div class="preview-champions">

                    ${player.champions.map(champion => {

                        const image =
                            getChampionImage(champion.name);

                        return image
                            ? `
                                <img
                                    src="${image}"
                                    alt="${escapeHtml(champion.name)}"
                                    class="champion-icon"
                                    title="G${champion.game}: ${escapeHtml(champion.name)}"
                                    onerror="this.style.display='none'"
                                >
                            `
                            : "";

                    }).join("")}

                </div>


                <div class="preview-kda">

                    ${player.kills}/${player.deaths}/${player.assists}

                </div>


                <div class="preview-cs">

                    ${player.cs}

                </div>


                <div class="preview-damage">

                    ${formatNumber(player.damage)}

                </div>

            </div>

        `).join("");

    }


    container.innerHTML = `

        <div class="preview-header">

            <div class="preview-title">
                Match Summary
            </div>

            <div class="preview-result">
                ${games.length} ${games.length === 1 ? "Game" : "Games"}
            </div>

        </div>


        <!-- KOI -->

        <div class="preview-team">

            <div class="preview-team-title">
                KOI
            </div>


            <div class="preview-player-row preview-player-header">

                <div>
                    Spieler
                </div>

                <div>
                    Champions
                </div>

                <div>
                    K/D/A
                </div>

                <div>
                    CS
                </div>

                <div>
                    Damage
                </div>

            </div>


            ${renderSummaryPlayers(koiSummary)}

        </div>


        <!-- GEGNER -->

        <div class="preview-team">

            <div class="preview-team-title">
                ${escapeHtml(match.opponent)}
            </div>


            <div class="preview-player-row preview-player-header">

                <div>
                    Spieler
                </div>

                <div>
                    Champions
                </div>

                <div>
                    K/D/A
                </div>

                <div>
                    CS
                </div>

                <div>
                    Damage
                </div>

            </div>


            ${renderSummaryPlayers(enemySummary)}

        </div>


        <div class="preview-actions">

            <button
                type="button"
                class="preview-view-btn"
                onclick="
                    event.stopPropagation();
                    viewMatch(
                        '${match.id}',
                        -1
                    )
                "
            >
                Match Summary vollständig ansehen →
            </button>

        </div>

    `;

}


function renderRecentSummary(
    match,
    previewId = `preview-${match.id}`
) {

    const container =
        document.getElementById(
            previewId
        );

    if (!container) {
        return;
    }


    const games =
        (match.games || [])
            .filter(Boolean);


    if (games.length === 0) {

        container.innerHTML = `
            <div class="preview-empty">
                Noch keine Games eingetragen.
            </div>
        `;

        return;
    }


    function createSummaryPlayers(teamKey) {

        const firstPlayers =
            games[0]?.[teamKey] || [];


        return firstPlayers.map((_, playerIndex) => {

            let totalKills = 0;
            let totalDeaths = 0;
            let totalAssists = 0;
            let totalCS = 0;
            let totalDamage = 0;


            const championsUsed = [];


            games.forEach((game, gameIndex) => {

                const player =
                    game?.[teamKey]?.[playerIndex];


                if (!player) {
                    return;
                }


                totalKills +=
                    Number(player.kills) || 0;

                totalDeaths +=
                    Number(player.deaths) || 0;

                totalAssists +=
                    Number(player.assists) || 0;

                totalCS +=
                    Number(player.cs) || 0;

                totalDamage +=
                    Number(player.damage) || 0;


                if (player.champion) {

                    championsUsed.push({
                        name: player.champion,
                        game: gameIndex + 1
                    });

                }

            });


            const playerName =
                firstPlayers[playerIndex]?.name || "—";


            return `
                <div class="preview-summary-player">

                    <div class="preview-player-name">
                        ${escapeHtml(playerName)}
                    </div>


                    <div class="preview-summary-champions">

                        ${
                            championsUsed
                                .map(champion => {

                                    const image =
                                        getChampionImage(
                                            champion.name
                                        );


                                    return image
                                        ? `
                                            <img
                                                src="${image}"
                                                alt="${escapeHtml(champion.name)}"
                                                title="Game ${champion.game}: ${escapeHtml(champion.name)}"
                                                class="summary-champion-icon"
                                                onerror="this.style.display='none'"
                                            >
                                        `
                                        : "";

                                })
                                .join("")
                        }

                    </div>


                    <div class="preview-kda">
                        ${totalKills}/${totalDeaths}/${totalAssists}
                    </div>


                    <div class="preview-cs">
                        ${totalCS}
                    </div>


                    <div class="preview-damage">
                        ${formatNumber(totalDamage)}
                    </div>

                </div>
            `;

        }).join("");

    }


    container.innerHTML = `

        <div class="preview-header">

            <div class="preview-title">
                Match Summary
            </div>

            <div class="preview-result">
                ${games.length}
                ${games.length === 1 ? "Game" : "Games"}
            </div>

        </div>


        <div class="preview-team">

            <div class="preview-team-title">
                KOI
            </div>


            <div class="preview-summary-header">

                <div>
                    Spieler
                </div>

                <div>
                    Champions
                </div>

                <div>
                    K/D/A
                </div>

                <div>
                    CS
                </div>

                <div>
                    Damage
                </div>

            </div>


            ${createSummaryPlayers("koi")}

        </div>


        <div class="preview-team">

            <div class="preview-team-title">
                ${escapeHtml(match.opponent)}
            </div>


            <div class="preview-summary-header">

                <div>
                    Spieler
                </div>

                <div>
                    Champions
                </div>

                <div>
                    K/D/A
                </div>

                <div>
                    CS
                </div>

                <div>
                    Damage
                </div>

            </div>


            ${createSummaryPlayers("enemy")}

        </div>


        <div class="preview-actions">

            <button
                type="button"
                class="preview-view-btn"
                onclick="
                    event.stopPropagation();
                    viewMatch(
                        '${match.id}',
                        -1
                    )
                "
            >
                Match Summary vollständig ansehen →
            </button>

        </div>

    `;

}

/* =========================================
   GAME KURZANSICHT
========================================= */

function renderRecentGamePreview(
    match,
    gameIndex,
    previewId = `preview-${match.id}`
) {

    const container =
        document.getElementById(
            previewId
        );


    if (!container) {
        return;
    }


    const game =
        match.games?.[gameIndex];


    /*
        GAME NICHT VORHANDEN
    */

    if (!game) {

        container.innerHTML = `

            <div class="preview-empty">

                <p>
                    Für Game ${gameIndex + 1}
                    wurden noch keine Daten eingetragen.
                </p>

                <button
                    type="button"
                    class="preview-add-btn"
                    onclick="
                        startGameEntry(
                            '${match.id}',
                            ${gameIndex}
                        )
                    "
                >
                    + Game ${gameIndex + 1} eintragen
                </button>

            </div>

        `;

        return;
    }


    const resultClass =
        game.result === "win"
            ? "win"
            : "loss";


    const resultText =
        game.result === "win"
            ? "WIN"
            : "LOSS";


    container.innerHTML = `

        <div class="preview-header">
    <div>
        <div class="preview-title">
            Game ${gameIndex + 1}
        </div>

        ${
            game.gametime
                ? `
                    <div class="preview-game-time">
                        GameTime: ${escapeHtml(game.gametime)}
                    </div>
                  `
                : ""
        }
    </div>

    <div
        class="preview-result ${resultClass}"
    >
        ${resultText}
    </div>
</div>


        <!-- KOI -->

        <div class="preview-team">

            <div class="preview-team-title">
                KOI
            </div>


            <div class="preview-player-row preview-player-header">

    <div>
        Spieler
    </div>

    <div>
        Champion
    </div>

    <div>
        K/D/A
    </div>

    <div>
        CS
    </div>

    <div>
        Damage
    </div>

</div>


            ${renderPreviewPlayers(game.koi)}

        </div>


        <!-- GEGNER -->

        <div class="preview-team">

            <div class="preview-team-title">
                ${escapeHtml(match.opponent)}
            </div>


            <div class="preview-player-row preview-player-header">

    <div>
        Spieler
    </div>

    <div>
        Champion
    </div>

    <div>
        K/D/A
    </div>

    <div>
        CS
    </div>

    <div>
        Damage
    </div>

</div>


            ${renderPreviewPlayers(game.enemy)}

        </div>


        <div class="preview-actions">

            <button
                type="button"
                class="preview-view-btn"
                onclick="
                    event.stopPropagation();
                    viewMatch(
                        '${match.id}',
                        ${gameIndex}
                    )
                "
            >
                Spiel vollständig ansehen →
            </button>

        </div>

    `;

}


/* =========================================
   SPIELER FÜR KURZANSICHT
========================================= */

function renderPreviewPlayers(players) {

    if (!players || players.length === 0) {

        return `
            <div class="preview-empty">
                Keine Spielerdaten vorhanden.
            </div>
        `;

    }


    return players.map(player => `

        <div class="preview-player-row">

            <div class="preview-player-name">
                ${escapeHtml(player.name)}
            </div>


            <div class="preview-champion">

                ${
                    getChampionImage(player.champion)
                        ? `
                            <img
                                src="${getChampionImage(player.champion)}"
                                alt="${escapeHtml(player.champion)}"
                                class="champion-icon"
                            >
                        `
                        : ""
                }

                <span>
                    ${escapeHtml(player.champion || "—")}
                </span>

            </div>


            <div class="preview-kda">
                ${player.kills}/${player.deaths}/${player.assists}
            </div>


            <div class="preview-cs">
                ${
                    player.cs !== undefined &&
                    player.cs !== null &&
                    player.cs !== ""
                        ? player.cs
                        : "—"
                }
            </div>


            <div class="preview-damage">
                ${formatNumber(player.damage)}
            </div>

        </div>

    `).join("");
}

/* =========================================
   GEGNER
========================================= */

function renderOpponentStats() {

    const container =
        document.getElementById("opponent-stats");


    if (matches.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                Noch keine Spiele vorhanden.
            </div>
        `;

        return;
    }


    const opponents = {};


    /*
        Matches nach Gegner gruppieren
    */

    matches.forEach(match => {

        if (!opponents[match.opponent]) {
            opponents[match.opponent] = [];
        }

        opponents[match.opponent].push(match);

    });


    container.innerHTML =
        Object.entries(opponents)
            .map(([opponent, opponentMatches], opponentIndex) => {

                /*
                    Matches innerhalb des Gegners
                    vom neuesten zum ältesten sortieren.
                */

                const sortedMatches =
                    [...opponentMatches]
                        .sort(
                            (a, b) =>
                                new Date(b.date) -
                                new Date(a.date)
                        );


                let totalGames = 0;
                let totalWins = 0;
                let totalLosses = 0;


                sortedMatches.forEach(match => {

                    (match.games || [])
                        .filter(Boolean)
                        .forEach(game => {

                            totalGames++;


                            if (game.result === "win") {

                                totalWins++;

                            } else {

                                totalLosses++;

                            }

                        });

                });


                const opponentId =
                    `opponent-${opponentIndex}`;


                return `

                    <div class="opponent-group">


                        <!-- GEGNER -->

                        <div
                            class="opponent-row"
                            onclick="
                                toggleOpponent(
                                    '${opponentId}'
                                )
                            "
                        >

                            <div class="opponent-name">

                                KOI vs
                                ${escapeHtml(opponent)}

                            </div>


                            <div class="opponent-games">

                                ${sortedMatches.length}
                                ${sortedMatches.length === 1
                                    ? "Match"
                                    : "Matches"}

                            </div>


                            <div class="win-text">

                                ${totalWins} W

                            </div>


                            <div class="loss-text">

                                ${totalLosses} L

                            </div>


                            <div class="opponent-expand">

                                ↓

                            </div>

                        </div>


                        <!-- MATCHES -->

                        <div
                            id="${opponentId}"
                            class="opponent-matches"
                        >

                            ${
                                sortedMatches
                                    .map((match, matchIndex) => {

                                        const games =
                                            (match.games || [])
                                                .filter(Boolean);


                                        const wins =
                                            games.filter(
                                                game =>
                                                    game.result === "win"
                                            ).length;


                                        const losses =
                                            games.filter(
                                                game =>
                                                    game.result === "loss"
                                            ).length;


                                        return `

                                            <div class="opponent-match">


                                                <div
                                                    class="opponent-match-row"
                                                    onclick="
                                                        toggleOpponentMatch(
                                                            event,
                                                            '${match.id}'
                                                        )
                                                    "
                                                >

                                                    <div class="opponent-match-info">

                                                        <div class="opponent-match-name">

                                                            Match ${matchIndex + 1}

                                                        </div>


                                                        <div class="opponent-match-date">

                                                            ${formatDate(match.date)}

                                                        </div>

                                                    </div>


                                                    <div class="opponent-match-score">

                                                        <span class="win-text">

                                                            ${wins} W

                                                        </span>


                                                        <span class="loss-text">

                                                            ${losses} L

                                                        </span>

                                                    </div>


                                                    <div class="opponent-match-expand">

                                                        ↓

                                                    </div>

                                                </div>


                                                <!-- KURZANSICHT -->

                                                <div
                                                    id="opponent-match-${match.id}"
                                                    class="opponent-match-content"
                                                >

                                                    <div class="opponent-game-list">


                                                        <!-- SUMMARY -->

                                                        <button
    type="button"
    class="recent-game-button summary"
    onclick="
        event.stopPropagation();
        selectOpponentGame(
            event,
            '${match.id}',
            -1
        );
        return false;
    "
>
    SUMMARY

    <span class="game-result">
        Übersicht
    </span>

</button>
                                                        <!-- GAMES -->

                                                        ${
                                                            Array.from({
                                                                length:
                                                                    getGameCount(
                                                                        match.mode
                                                                    )
                                                            })
                                                            .map((_, gameIndex) => {

                                                                const game =
                                                                    match.games?.[gameIndex];


                                                                let className =
                                                                    "recent-game-button empty";


                                                                let resultText =
                                                                    "Nicht eingetragen";


                                                                if (game) {

                                                                    if (
                                                                        game.result ===
                                                                        "win"
                                                                    ) {

                                                                        className =
                                                                            "recent-game-button win";

                                                                        resultText =
                                                                            "WIN";

                                                                    } else {

                                                                        className =
                                                                            "recent-game-button loss";

                                                                        resultText =
                                                                            "LOSS";

                                                                    }

                                                                }


                                                                return `

                                                                    <button
    type="button"
    class="${className}"
    onclick="
        event.stopPropagation();
        selectOpponentGame(
            event,
            '${match.id}',
            ${gameIndex}
        );
        return false;
    "
>

                                                                        G${gameIndex + 1}

                                                                        <span class="game-result">
                                                                            ${resultText}
                                                                        </span>

                                                                    </button>

                                                                `;

                                                            })
                                                            .join("")
                                                        }

                                                    </div>


                                                    <!--
                                                        Wichtig:
                                                        Wir verwenden hier bewusst
                                                        dieselbe Preview-ID wie bei
                                                        den normalen Recent Matches.
                                                    -->

                                                    <div
    id="opponent-preview-${match.id}"
    class="opponent-preview"
></div>


                                                </div>

                                            </div>

                                        `;

                                    })
                                    .join("")
                            }

                        </div>

                    </div>

                `;

            })
            .join("");

}

function toggleOpponent(opponentId) {

    const container =
        document.getElementById(
            opponentId
        );


    if (!container) {
        return;
    }


    container.classList.toggle(
        "open"
    );


    /*
        Pfeil drehen
    */

    const opponentRow =
        container.previousElementSibling;


    if (opponentRow) {

        opponentRow.classList.toggle(
            "expanded"
        );

    }

}



function toggleOpponentMatch(
    event,
    matchId
) {

    event.stopPropagation();


    const container =
        document.getElementById(
            `opponent-match-${matchId}`
        );


    if (!container) {
        return;
    }


    const match =
        matches.find(
            match => match.id === matchId
        );


    if (!match) {
        return;
    }


    const isOpen =
        container.classList.contains("open");


    if (isOpen) {

        container.classList.remove("open");


        const matchRow =
            container.previousElementSibling;


        if (matchRow) {

            matchRow.classList.remove(
                "expanded"
            );

        }


        return;
    }


    /*
        Match öffnen
    */

    container.classList.add("open");


    const matchRow =
        container.previousElementSibling;


    if (matchRow) {

        matchRow.classList.add(
            "expanded"
        );

    }


    /*
        Bereits vorhandene Summary verwenden
    */

    renderRecentSummary(
        match
    );


    /*
        SUMMARY aktiv markieren
    */

    const buttons =
        container.querySelectorAll(
            ".recent-game-button"
        );


    buttons.forEach(
        (button, index) => {

            button.classList.toggle(
                "active",
                index === 0
            );

        }
    );

}

function selectOpponentGame(
    event,
    matchId,
    gameIndex
) {

    event.stopPropagation();


    const match =
        matches.find(
            match => match.id === matchId
        );


    if (!match) {
        return;
    }


    const container =
        document.getElementById(
            `opponent-match-${matchId}`
        );


    if (!container) {
        return;
    }


    /*
        ID des Preview-Bereichs
        innerhalb der Gegner-Ansicht
    */

    const previewId =
        `opponent-preview-${match.id}`;


    /*
        SUMMARY
    */

    if (gameIndex === -1) {

        renderRecentSummary(
            match,
            previewId
        );

    } else {

        /*
            Game existiert nicht:
            Eingabemaske öffnen.
        */

        if (!match.games?.[gameIndex]) {

            startGameEntry(
                matchId,
                gameIndex
            );

            return;
        }


        /*
            Bereits vorhandene
            Game-Kurzansicht verwenden
        */

        renderRecentGamePreview(
            match,
            gameIndex,
            previewId
        );

    }


    /*
        Aktiven Button markieren
    */

    const buttons =
        container.querySelectorAll(
            ".recent-game-button"
        );


    buttons.forEach(
        (button, index) => {

            const buttonIndex =
                gameIndex === -1
                    ? 0
                    : gameIndex + 1;


            button.classList.toggle(
                "active",
                index === buttonIndex
            );

        }
    );

}

/* =========================================
   MODE-TEXTE
========================================= */

function getModeText(mode) {

    switch (mode) {

        case "bo3":
            return "BO3";

        case "bo5":
            return "BO5";

        case "fearless3":
            return "3 Games Fearless";

        case "fearless5":
            return "5 Games Fearless";

        default:
            return "BO5";

    }

}


/* =========================================
   DATUM
========================================= */

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(`${dateString}T00:00:00`);


    return date.toLocaleDateString(
        "de-DE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


/* =========================================
   ZAHLEN
========================================= */

function formatNumber(value) {

    return Number(value || 0)
        .toLocaleString("de-DE");

}


/* =========================================
   HTML SICHER MACHEN
========================================= */

function escapeHtml(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

/* =========================================
   MATCH AUF / ZU KLAPPEN
========================================= */

function toggleRecentMatch(id) {

    const gamesContainer =
        document.getElementById(
            `recent-games-${id}`
        );


    const expandButton =
        document.getElementById(
            `expand-${id}`
        );


    if (!gamesContainer) {
        return;
    }


    const isOpen =
        gamesContainer.classList.contains("open");


    /*
        Schließen
    */

    if (isOpen) {

        gamesContainer.classList.remove("open");

        expandButton.classList.remove("expanded");

        return;
    }


    /*
        Öffnen
    */

    gamesContainer.classList.add("open");

    expandButton.classList.add("expanded");


    /*
        Match suchen
    */

    const match =
        matches.find(
            match => match.id === id
        );


    if (!match) {
        return;
    }


    /*
        Beim Öffnen immer die SUMMARY anzeigen.
    */

    const gameIndex = -1;


    /*
        Summary anzeigen
    */

    renderRecentSummary(
        match
    );


    /*
        SUMMARY-Button markieren
    */

    const gameButtons =
        document.querySelectorAll(
            `#recent-games-${id} .recent-game-button`
        );


    gameButtons.forEach((button, index) => {

        button.classList.toggle(
            "active",
            index === 0
        );

    });

}

/* =========================================
   GAME AUS DER ÜBERSICHT ÖFFNEN
========================================= */

function openRecentGame(event, matchId, gameIndex) {

    event.stopPropagation();


    const match =
        matches.find(
            match => match.id === matchId
        );


    if (!match) {
        return;
    }


    /*
        Game existiert bereits
        → normale Detailansicht
    */

    if (match.games?.[gameIndex]) {

        viewMatch(
            matchId,
            gameIndex
        );

        return;
    }


    /*
        Game existiert noch nicht
        → direkt zur Eingabe
    */

    startGameEntry(
        matchId,
        gameIndex
    );

}

/* =========================================
   EINZELNES GAME EINTRAGEN
========================================= */

function startGameEntry(matchId, gameIndex) {

    const match =
        matches.find(
            match => match.id === matchId
        );


    if (!match) {
        return;
    }


    currentMatchId = matchId;
    currentGameIndex = gameIndex;


    document.getElementById("editor-title")
        .textContent =
        `Game ${gameIndex + 1} eintragen`;


    document.getElementById("editor-subtitle")
        .textContent =
        `KOI vs ${match.opponent} · ${getModeText(match.mode)}`;


    document.getElementById("match-date").value =
        match.date;


    document.getElementById("match-opponent").value =
        match.opponent;


    document.getElementById("match-type").value =
        match.type;


    document.getElementById("match-mode").value =
        match.mode;


    updateGameTabs();


    renderGameEditor();


    showPage("match-editor");

}

/* =========================================
   CHAMPION PREVIEW AKTUALISIEREN
========================================= */

function updateChampionPreview(input) {
    const team = input.classList.contains("koi-champion")
        ? "koi"
        : "enemy";

    const index = input.dataset.index;

    const preview = document.getElementById(
        `${team}-champion-preview-${index}`
    );

    if (!preview) {
        return;
    }

    const champion = getChampion(input.value);

    if (!champion) {
        preview.innerHTML = "";
        return;
    }

    preview.innerHTML = `
        <img
            src="${champion.image}"
            alt="${escapeHtml(champion.name)}"
            class="champion-preview-image"
        >

        <span>
            ${escapeHtml(champion.name)}
        </span>
    `;
}

function createChampionDropdown(input) {
    let dropdown = input.parentElement.querySelector(
        ".champion-dropdown"
    );

    if (!dropdown) {
        dropdown = document.createElement("div");

        dropdown.className = "champion-dropdown";

        input.parentElement.appendChild(dropdown);
    }

    return dropdown;
}


function renderChampionDropdown(input) {
    const dropdown = createChampionDropdown(input);

    const search = input.value.trim();

    if (!search) {
        dropdown.innerHTML = "";
        dropdown.classList.remove("active");
        return;
    }

    const results = findChampionBySearch(search);

    if (results.length === 0) {
        dropdown.innerHTML = `
            <div class="champion-dropdown-empty">
                Kein Champion gefunden
            </div>
        `;

        dropdown.classList.add("active");

        return;
    }

    /*
     * Maximal 8 Treffer anzeigen.
     */
    const visibleResults = results.slice(0, 8);

    dropdown.innerHTML = visibleResults
        .map(champion => `
            <button
                type="button"
                class="champion-option"
                data-champion="${escapeHtml(champion.name)}"
            >
                <img
                    src="${champion.image}"
                    alt="${escapeHtml(champion.name)}"
                >

                <span>
                    ${escapeHtml(champion.name)}
                </span>
            </button>
        `)
        .join("");

    dropdown.classList.add("active");
}

function selectChampion(input, championName) {
    input.value = championName;

    updateChampionPreview(input);

    const dropdown = input.parentElement.querySelector(
        ".champion-dropdown"
    );

    if (dropdown) {
        dropdown.innerHTML = "";
        dropdown.classList.remove("active");
    }

    input.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );
}

document.addEventListener("input", event => {
    if (
        event.target.classList.contains("koi-champion") ||
        event.target.classList.contains("enemy-champion")
    ) {
        updateChampionPreview(event.target);
        renderChampionDropdown(event.target);
    }
});

document.addEventListener("click", event => {
    const option = event.target.closest(".champion-option");

    if (!option) {
        return;
    }

    const input = option
        .closest(".champion-form-group")
        .querySelector("input");

    if (!input) {
        return;
    }

    selectChampion(
        input,
        option.dataset.champion
    );
});

document.addEventListener("click", event => {
    if (
        event.target.classList.contains("koi-champion") ||
        event.target.classList.contains("enemy-champion")
    ) {
        return;
    }

    document
        .querySelectorAll(".champion-dropdown")
        .forEach(dropdown => {
            dropdown.classList.remove("active");
        });
});