const DDRAGON_BASE =
    "https://ddragon.leagueoflegends.com";

let champions = [];
let championMap = new Map();
let championsLoaded = false;


/* =========================================
   CHAMPION DATEN LADEN
========================================= */

async function loadChampions() {
    try {
        /*
         * Wir holen zuerst die aktuellste verfügbare
         * Data-Dragon-Version.
         */
        const versionsResponse = await fetch(
            `${DDRAGON_BASE}/api/versions.json`
        );

        if (!versionsResponse.ok) {
            throw new Error("Data Dragon Versionen konnten nicht geladen werden.");
        }

        const versions = await versionsResponse.json();

        const latestVersion = versions[0];

        /*
         * Danach holen wir die komplette Champion-Liste.
         */
        const championResponse = await fetch(
            `${DDRAGON_BASE}/cdn/${latestVersion}/data/de_DE/champion.json`
        );

        if (!championResponse.ok) {
            throw new Error("Champion-Daten konnten nicht geladen werden.");
        }

        const championData = await championResponse.json();

        champions = Object.values(championData.data).map(champion => ({
            id: champion.id,
            name: champion.name,
            key: champion.key,
            image: `${DDRAGON_BASE}/cdn/${latestVersion}/img/champion/${champion.image.full}`,
            version: latestVersion
        }));

        /*
         * Map für schnelle Suche.
         */
        championMap = new Map(
            champions.map(champion => [
                champion.name.toLowerCase(),
                champion
            ])
        );

        championsLoaded = true;

        console.log(
            `${champions.length} Champions geladen.`,
            `Data Dragon ${latestVersion}`
        );

        /*
         * Falls die App auf die Champions gewartet hat,
         * können wir sie jetzt aktualisieren.
         */
        document.dispatchEvent(
            new CustomEvent("championsLoaded")
        );

        return champions;

    } catch (error) {
        console.error("Fehler beim Laden der Champions:", error);

        championsLoaded = false;

        document.dispatchEvent(
            new CustomEvent("championsLoadError", {
                detail: error
            })
        );

        return [];
    }
}


/* =========================================
   CHAMPION SUCHEN
========================================= */

function getChampion(championName) {
    if (!championName) {
        return null;
    }

    const normalizedName = championName
        .trim()
        .toLowerCase();

    return championMap.get(normalizedName) || null;
}


/* =========================================
   CHAMPION BILD
========================================= */

function getChampionImage(championName) {
    const champion = getChampion(championName);

    if (!champion) {
        return null;
    }

    return champion.image;
}


/* =========================================
   ALIAS-SUCHE
========================================= */

function findChampionBySearch(search) {
    if (!search) {
        return [];
    }

    const value = search
        .trim()
        .toLowerCase();

    return champions.filter(champion =>
        champion.name
            .toLowerCase()
            .includes(value)
    );
}


/* =========================================
   START
========================================= */

loadChampions();