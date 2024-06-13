// script.js
import config from './config.js';

document.addEventListener("DOMContentLoaded", function() {
    const dateSelector = document.getElementById('date-selector');
    const leagueSelector = document.getElementById('league-selector');
    const gamesList = document.getElementById('games-list');

    const tvChannelInfo = {
        "Sky": {
            "logo": "assets/sky.png",
            "url": "https://www.skysports.com/"
        },
        "Servus TV": {
            "logo": "assets/servus.png",
            "url": "https://www.servustv.com/"
        },
        "ZDF": {
            "logo": "assets/ZDF.png",
            "url": "https://www.zdf.de"
        },
        'ARD': {
            'logo': 'assets/ARD.png',
            'url': 'https://www.ard.de/'
        },
        'DAZN': {
            'logo': 'assets/DAZN.png',
            'url': 'https://www.dazn.com/en-DE/welcome'
        },
        'RTL': {
            'logo': 'assets/rtl.png',
            'url': 'https://www.rtl.de/'
        },
        'NITRO': {
            'logo': 'assets/nitro.png',
            'url': 'https://www.nitro-tv.de/cms/index.html'
        },
        'ORF': {
            'logo': 'assets/orf.png',
            'url': 'https://orf.at/'
        },
        'Fußball.TV1': {
            'logo': null,
            'url': null,
        }
    };

    const leagueNameTranslations = {
        'Alle Spiele': 'Alle Spiele',
        'Bundesliga 1': '1. Bundesliga',
        'Premier League': 'Premier League',
        'Ligue 1': 'Ligue 1', 
        'Serie A': 'Serie A',
        'La Liga': 'La Liga',
        'UEFA Champions League': 'UEFA Champions League',
        'UEFA Europa league': 'UEFA Europa League',
        'DFB Pokal': 'DFB Pokal',
        'Bundesliga 2': '2. Bundesliga',
        'World Cup': 'Weltmeisterschaft',
        'Euro Championship': 'Europameisterschaft',
        'Friendlies': 'Freundschaftspiele'
    };

    const reverseLeagueNameTranslations = {};
    for (const [english, translated] of Object.entries(leagueNameTranslations)) {
        reverseLeagueNameTranslations[translated] = english;
    }

    // Initialize the date selector to today
    populateDateSelector();

    // Populate league selector
    const leagues = Object.keys(leagueNameTranslations); // Get list of leagues
    populateLeagueSelector(leagues);

    // Fetch and display games for today's date and all leagues by default
    fetchGames(dateSelector.value, leagueSelector.value);

    // Event listeners for selectors
    dateSelector.addEventListener('change', () => {
        fetchGames(dateSelector.value, leagueSelector.value);
    });

    leagueSelector.addEventListener('change', () => {
        fetchGames(dateSelector.value, leagueSelector.value);
    });

    function populateDateSelector() {
        const today = new Date();
        dateSelector.value = today.toISOString().split('T')[0];
    }

    function populateLeagueSelector(leagues) {
        const leagueSelector = document.getElementById('league-selector');
        leagueSelector.innerHTML = ''; // Clear existing options
    
        leagues.forEach(league => {
            const option = document.createElement('option');
            option.value = league; // Use the English title for API requests
            option.textContent = leagueNameTranslations[league] || league; // Display the translated name
            leagueSelector.appendChild(option);
        });
    }

    function fetchGames(date, league) {
        const apiUrl = config.backendUrl;
        console.log(apiUrl)

        let requestData = {
            date: date
        };

        if (league != 'Alle Spiele') {
            requestData.league = reverseLeagueNameTranslations[league] || league;
        }

        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            displayGames(data);
        })
        .catch(error => {
            console.error('Error fetching games:', error);
        });
    }

    function displayGames(response) {
        // Parse the response body if necessary
        const games = JSON.parse(response.body).data;
        
        // Group games by league
        const gamesByLeague = {};
        games.forEach(game => {
            if (!gamesByLeague[game.league]) {
                gamesByLeague[game.league] = [];
            }
            gamesByLeague[game.league].push(game);
        });
    
        gamesList.innerHTML = '';

        const noGamesFound = Object.keys(gamesByLeague).length === 0;
        if (noGamesFound) {
            const noGamesMessage = document.createElement('p');
            noGamesMessage.textContent = `Leider konnten zur Zeit keine Spiele für die ausgewählte Liga und das Datum gefunden werden!`;
            noGamesMessage.className = 'no-games-message text-center'; // Adding text-center class to center the message
            gamesList.appendChild(noGamesMessage);
            return; // Exit the function as there are no games to display
        }
    
        // Display games grouped by league
        for (const league in gamesByLeague) {
            const leagueGames = gamesByLeague[league];

            // Get translated league name or fallback to original name
            const translatedLeagueName = leagueNameTranslations[league] || league;
    
            // Create container for league header and divider
            const leagueContainer = document.createElement('div');
            leagueContainer.className = 'league-container';
            leagueContainer.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <div class="league-header">
                            <img src="${leagueGames[0].league_logo}" alt="${league} logo" class="league-logo">
                            <h2 class="league-name">${translatedLeagueName}</h2>
                        </div>
                        <hr class="divider">
                    </div>
                </div>
            `;
    
            // Append league container to gamesList
            gamesList.appendChild(leagueContainer);
    
            // Display games for the league
            leagueGames.forEach(game => {
                const card = document.createElement('div');
                card.className = 'col-lg-4 col-md-6 col-sm-12 mb-4'; // Adjusted for column layout
                card.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <div class="text-center mt-3">
                                <p class="card-text">Zeit: ${game.time}</p>
                                ${Array.isArray(game.tv_channels) && game.tv_channels.some(channel => channel.trim() !== '') ? 
                                    `<div class="card-text">${game.tv_channels.map(channel => {
                                        const channelKey = Object.keys(tvChannelInfo).find(key => channel.includes(key));
                                        if (channelKey) {
                                            const channelInfo = tvChannelInfo[channelKey];
                                            if (channelInfo.url != null || channelInfo.logo != null)                                                return `
                                                    <a href="${channelInfo.url}" target="_blank">
                                                        <img src="${channelInfo.logo}" alt="${channelKey} logo" class="img-fluid channel-logo">
                                                    </a>`;
                                            else {
                                                return `<p class="card-text no-channel-text">${channelKey}</p>`
                                            }
                                        } else {
                                            return `<p class="card-text"> ${key}</p>`;
                                        }
                                    }).join(' ')}</div>` 
                                    : `<p class="card-text no-channel-text">Es liegen noch keine Sender vor!</p>`}
                            </div>
                            <hr> <!-- Add horizontal line to separate team logos and "vs" text -->
                            <div class="team-info">
                                <div class="text-center">
                                    <img src="${game.home_logo}" alt="${game.home_team} logo" class="img-fluid team-logo">
                                    <h5 class="card-title mb-0 text-center">${game.home_team}</h5>
                                </div>
                                <span class="vs-text">vs</span>
                                <div class="text-center">
                                    <img src="${game.away_logo}" alt="${game.away_team} logo" class="img-fluid team-logo">
                                    <h5 class="card-title mb-0 text-center">${game.away_team}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    
                // Append card to gamesList
                gamesList.appendChild(card);
            });
        }
    }
});