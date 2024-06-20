document.addEventListener("DOMContentLoaded", function() {
    const dateSelector = document.getElementById('date-selector');
    const leagueSelector = document.getElementById('league-selector');
    const gamesList = document.getElementById('games-list');
    const loadingIcon = document.getElementById('loading-icon');

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
        'MagentaTV': {
            'logo': 'assets/magentatv.jpg',
            'url': 'https://www.telekom.de/magenta-tv',
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
        'Euro Championship': 'Euro 2024',
        'Friendlies': 'Friendlies'
    };

    document.getElementById('impressum-link').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('impressum-overlay').style.display = 'flex';
    });

    document.getElementById('datenschutz-link').addEventListener('click', function(event) {
        event.preventDefault();
        document.getElementById('datenschutz-overlay').style.display = 'flex';
    });

    document.getElementById('close-impressum').addEventListener('click', function() {
        document.getElementById('impressum-overlay').style.display = 'none';
    });

    document.getElementById('close-datenschutz').addEventListener('click', function() {
        document.getElementById('datenschutz-overlay').style.display = 'none';
    });

    document.getElementById('impressum-overlay').addEventListener('click', function(event) {
        if (event.target.id === 'impressum-overlay') {
            document.getElementById('impressum-overlay').style.display = 'none';
        }
    });

    document.getElementById('datenschutz-overlay').addEventListener('click', function(event) {
        if (event.target.id === 'datenschutz-overlay') {
            document.getElementById('datenschutz-overlay').style.display = 'none';
        }
    });

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
        leagueSelector.innerHTML = ''; // Clear existing options
    
        leagues.forEach(league => {
            const option = document.createElement('option');
            option.value = league; // Use the English title for API requests
            option.textContent = leagueNameTranslations[league] || league; // Display the translated name
            leagueSelector.appendChild(option);
        });
    }

    function fetchGames(date, league) {
        const apiUrl = 'https://hidje0vygd.execute-api.eu-central-1.amazonaws.com/production/game_data';
    
        let requestData = {
            date: date
        };
    
        if (league !== 'Alle Spiele') {
            requestData.league = reverseLeagueNameTranslations[league] || league;
        }
    
        // Show loading icon and hide games list
        loadingIcon.style.display = 'block';
        gamesList.style.display = 'none';
    
        fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(requestData),
        })
        .then(response => response.json())
        .then(data => {
            displayGames(data, league); // Pass league to displayGames
            // Hide loading icon and show games list
            loadingIcon.style.display = 'none';
            gamesList.style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching games:', error);
            // Hide loading icon on error
            loadingIcon.style.display = 'none';
        });
    }
    
    function parseTvChannel(tvChannelStr) {
        if (!tvChannelStr) {
            // If the string is empty, return an empty array
            return [];
        }
    
        try {
            // Replace single quotes with double quotes to make it valid JSON
            let sanitizedStr = tvChannelStr.replace(/'/g, '"');
            // Parse the sanitized string as JSON
            return JSON.parse(sanitizedStr);
        } catch (e) {
            console.error('Failed to parse tv_channel:', e);
            return [];
        }
    }
    
    function displayGames(response, selectedLeague) {
        const games = JSON.parse(response.body).data;
        
        // Parse the tv_channel field for each game
        games.forEach(game => {
            game.tv_channel = parseTvChannel(game.tv_channel);
        });
    
        // Group games by league
        const gamesByLeague = {};
        games.forEach(game => {
            if (!gamesByLeague[game.league]) {
                gamesByLeague[game.league] = [];
            }
            gamesByLeague[game.league].push(game);
        });
    
        gamesList.innerHTML = ''; // Clear old games
    
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

            // Sort games by time
            leagueGames.sort((a, b) => a.time.localeCompare(b.time));
    
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
                // Remove the seconds from the time string
                const formattedTime = game.time ? game.time.slice(0, -3) : '';
    
                const card = document.createElement('div');
                card.className = 'col-lg-4 col-md-6 col-sm-12 mb-4'; // Adjusted for column layout
                card.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <div class="text-center mt-3">
                                <p class="card-text">Zeit: ${formattedTime}</p>
                                ${Array.isArray(game.tv_channel) && game.tv_channel.some(channel => channel.trim() !== '') ? 
                                    `<div class="card-text">${game.tv_channel.map(channel => {
                                        const channelKey = Object.keys(tvChannelInfo).find(key => channel.includes(key));
                                        if (channelKey) {
                                            const channelInfo = tvChannelInfo[channelKey];
                                            if (channelInfo.url != null || channelInfo.logo != null) {
                                                return `
                                                    <a href="${channelInfo.url}" target="_blank">
                                                        <img src="${channelInfo.logo}" alt="${channelKey} logo" class="img-fluid channel-logo">
                                                    </a>`;
                                            } else {
                                                return `<p class="card-text no-channel-text">${channelKey}</p>`;
                                            }
                                        } else {
                                            return `<p class="card-text">${channel}</p>`;
                                        }
                                    }).join(' ')}</div>` 
                                    : `<p class="card-text no-channel-text">Es liegen noch keine Sender vor!</p>`}
                            </div>
                            <hr>
                            <div class="team-info">
                                <div class="text-center">
                                    <img src="${game.home_logo}" alt="${game.home_team} logo" class="img-fluid team-logo">
                                    <h5 class="card-title mb-0 text-center">${game.home_german}</h5>
                                </div>
                                <span class="vs-text">vs</span>
                                <div class="text-center">
                                    <img src="${game.away_logo}" alt="${game.away_team} logo" class="img-fluid team-logo">
                                    <h5 class="card-title mb-0 text-center">${game.away_german}</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    
                // Append card to the league container
                leagueContainer.querySelector('.row').appendChild(card);
            });
        }
    
        // Update league selector to maintain selected league after fetching games
        leagueSelector.value = selectedLeague;
    }
});