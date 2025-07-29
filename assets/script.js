// https://stackoverflow.com/a/4819886
const touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);

let grade = '11';

const map = L.map('map', {
    center: [37.16611, -119.44944],
    zoom: touch ? 6 : 7,
    minZoom: 6,
    maxZoom: 12,
    maxBounds: [[42.009444, -124.415278], [32.534444, -114.131111]]
});
let tiles;

let max = 100.01;
const colors = ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704', '#dddddd'];
const getIndex = properties => {
    const percent = properties.percents[grade];
    if (!percent)
        return colors.length - 1;
    return Math.floor(percent / max * 9);
};

const dataWindow = L.control();
dataWindow.onAdd = () => {
    this._data = L.DomUtil.create('div', 'info data');
    return this._data;
};
const infoMessage = '<b>' + (touch ? 'Tap' : 'Hover') + ' a district to see info and ' + (touch ? 'select.' : 'click to select.') + '</b>';
dataWindow.update = properties => {
    if (properties) {
        let html = `<b>${properties.name} (${properties.year}${properties.year <= 2022 && properties.percents[grade] ? ' ⚠️' : ''})</b><br>`;
        if (properties.percents[grade])
            html += `<span>${properties.percents[grade]}% (${rankings.indexOf(properties.name) + 1} / ${rankings.length})</span>`;
        else
            html += '<span>No data</span>';
        if (properties.year <= 2022 && properties.percents[grade]) {
            html += '<br><span>';
            if (properties.year <= 2015)
                html += 'This datum is over 10 years old and probably isn\'t representative of current numbers.';
            else if (properties.year <= 2020)
                html += 'This datum is over 5 years old and may not be representative of current numbers.';
            else
                html += 'This datum is from during COVID restrictions and may not be representative of normal numbers.';
            html += '</span>';
        }
        this._data.innerHTML = html;
    }
    else
        this._data.innerHTML = infoMessage;
};
dataWindow.addTo(map);
dataWindow.update();

const legend = L.control({ position: 'bottomleft' });
legend.onAdd = () => {
    this._scale = L.DomUtil.create('div', 'info legend');
    return this._scale;
};
legend.update = () => {
    this._scale.innerHTML = '';

    const length = colors.length - 1;
    for (let i = 0; i < length; i++)
        this._scale.innerHTML += `
<span style="background-color: ${colors[i]}"></span> ${Math.round(i / length * max)}&ndash;${Math.round((i + 1) / length * max)}%
<br>
`;
    this._scale.innerHTML += `<span style="background-color: ${colors[colors.length - 1]}"></span> No data`;
}
legend.addTo(map);

const buttons = L.control({ position: 'topleft' });
buttons.onAdd = () => {
    this._buttons = L.DomUtil.create('div', 'leaflet-bar buttons');
    return this._buttons;
};
buttons.update = () => {
    this._buttons.innerHTML = `
        <a id="info-button" title="Information">ⓘ</a>
        <a id ="download-button" class="leaflet-disabled" target="_blank" title="Download district report">⤓</a>
        <a id="table-button" class="leaflet-disabled" title="District data table">⊞</a>
        <a id="settings-button" class="leaflet-disabled" title="Settings">⚙</a>
    `;
}
buttons.addTo(map);
buttons.update();

const infoWindow = document.getElementById('info');
const infoButton = document.getElementById('info-button');
const infoClose = document.getElementById('info-close');
infoButton.onclick = () => {
    tableWindow.classList.add('hidden');
    infoWindow.classList.toggle('hidden');
    settingsWindow.classList.add('hidden');
};
if (localStorage.getItem('infoClosed'))
    infoWindow.classList.add('hidden');
infoClose.onclick = () => {
    localStorage.setItem('infoClosed', true);
    infoWindow.classList.add('hidden');
}

const downloadButton = document.getElementById('download-button');

const tableWindow = document.getElementById('table');
const tableButton = document.getElementById('table-button');
const tableDistrict = document.getElementById('table-district');
const tableRows = document.getElementById('table-rows');
const tableClose = document.getElementById('table-close');
const citationDistrict = document.getElementById('citation-district');
const citationYear = document.getElementById('citation-year');
tableButton.onclick = () => {
    if (tableButton.classList.contains('leaflet-disabled'))
        return;

    infoWindow.classList.add('hidden');
    tableWindow.classList.toggle('hidden');
    settingsWindow.classList.add('hidden');
};
tableClose.onclick = () => tableWindow.classList.add('hidden');

const settingsButton = document.getElementById('settings-button');
const settingsClose = document.getElementById('settings-close');
const settingsWindow = document.getElementById('settings');
const gradesForm = document.getElementById('grades');
settingsButton.onclick = () => {
    if (settingsButton.classList.contains('leaflet-disabled'))
        return;

    infoWindow.classList.add('hidden');
    tableWindow.classList.add('hidden');
    settingsWindow.classList.toggle('hidden');
};
settingsClose.onclick = () => settingsWindow.classList.add('hidden');
gradesForm.onchange = e => {
    grade = e.target.value;
    updateRankings();
    tiles.redraw();
};

const stripePatterns = [];
for (const color of colors) {
    const stripes = new L.StripePattern({
        weight: 7.5,
        spaceWeight: 0.5,
        color: color,
        spaceColor: 'black',
        opacity: 1,
        spaceOpacity: 1,
    });
    stripes.addTo(map);
    stripePatterns.push(stripes);
}

const rankings = [];
let selectedTile;

const updateRankings = () => {
    const length = rankings.length; // Otherwise the length decreases each time and array isn't cleared
    for (let i = 0; i < length; i++)
        rankings.pop();
    const sorted = data.objects.results.geometries
        .filter(d => grade in d.properties.percents)
        .sort((a, b) => b.properties.percents[grade] - a.properties.percents[grade]);
    for (const district of sorted)
        rankings.push(district.properties.name);
    max = sorted[0].properties.percents[grade] + 0.01;
    legend.update();
}

const addTiles = () => {
    updateRankings();

    tiles = L.vectorGrid.slicer(data, {
        vectorTileLayerStyles: {
            results: properties => {
                return {
                    weight: 1,
                    opacity: 1,
                    color: '#000000',
                    fillColor: colors[getIndex(properties)],
                    fillOpacity: 0.9,
                    fill: true,
                    fillPattern: (properties.year <= 2022 && properties.percents[grade]) ? stripePatterns[getIndex(properties)] : ''
                }
            }
        },
        interactive: true,
        getFeatureId: f => f.properties.code
    }).addTo(map);

    return tiles;
};

let data;
const getData = async () => {
    const cache = await caches.open('ca-aod');
    data = await cache.match('data/results.topojson');
    if (!data) {
        await cache.add('data/results.topojson');
        data = await cache.match('data/results.topojson');
    }
    data = await data.json();

    return data;
}

getData().then(() => {
    const tiles = addTiles();

    const highlightTile = e => {
        // If desktop user has a selected tile, moving mouse shouldn't change it
        if (selectedTile && !touch)
            return;

        const properties = e.layer.properties;
        dataWindow.update(properties);
        tiles.setFeatureStyle(properties.code, {
            weight: 3,
            opacity: 1,
            color: '#000000',
            fillColor: colors[getIndex(properties)],
            fillOpacity: 1,
            fill: true,
            fillPattern: (properties.year <= 2022 && properties.percents[grade]) ? stripePatterns[getIndex(properties)] : ''
        });
    };
    const resetTile = e => {
        // If desktop user has a selected tile, moving mouse shouldn't change it
        if (selectedTile && !touch)
            return;

        dataWindow.update();
        tiles.resetFeatureStyle(e.layer.properties.code);
    };

    tiles.on('mouseover', highlightTile);
    tiles.on('mouseout', resetTile);
    tiles.on('click', e => {
        if (selectedTile) {
            if (selectedTile.code === e.layer.properties.code) {
                // User clicked selected tile, deselect it
                selectedTile = undefined;
                resetTile(e);

                downloadButton.classList.add('leaflet-disabled');
                tableButton.classList.add('leaflet-disabled');
                tableWindow.classList.add('hidden');

                return;
            }

            // User selected new tile
            tiles.resetFeatureStyle(selectedTile.code);
            selectedTile = undefined;
        }

        // Add district information to windows
        highlightTile(e);
        selectedTile = e.layer.properties;

        tableDistrict.innerText = selectedTile.name;
        tableRows.innerHTML = Object.entries(selectedTile.percents).map(p => `
            <tr>
            <td>${p[0]}</td>
            <td>${p[1] || '&ndash;'}</td>
            </tr>
        `).join('');

        citationDistrict.innerText = selectedTile.name;
        citationYear.innerText = selectedTile.year - 1 + '-' + selectedTile.year;

        downloadButton.classList.remove('leaflet-disabled');
        downloadButton.href = 'https://data.calschls.org/resources/' + selectedTile.file;
        tableButton.classList.remove('leaflet-disabled');
    });

    // Everything is loaded, settings can be accessed now
    settingsButton.classList.remove('leaflet-disabled');
});
