import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

console.log('Getting reports list');

if (!existsSync('data'))
    mkdirSync('data');

// Download data files
let data;
if (!existsSync('data/reports.html')) {
    data = await fetch('https://dq.cde.ca.gov/dataquest/HKids/HKSearchName.asp?TheYear=&cTopic=HKids&cLevel=District&cName=&cCounty=&cTimeFrame=S', { headers: { 'User-Agent': 'CA AOD in High Schools/0.1 (Linux)' } })
        .then(res => res.text())
    writeFileSync('data/reports.html', data);
}
else
    data = readFileSync('data/reports.html', 'utf8');
data = data.split('\n');

let districts;
if (!existsSync('data/districts.json')) {
    districts = await fetch('https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/DistrictAreas2324/FeatureServer/0/query?where=GradeHigh%3D12+AND+GradeHighCensus%3D12&objectIds=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=DistrictName,CDCode&returnGeometry=false&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&collation=&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnTrueCurves=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=json')
        .then(res => res.json());
    districts = districts.features.map(d => d.attributes);
    writeFileSync('data/districts.json', JSON.stringify(districts, null, 2));
}
else
    districts = JSON.parse(readFileSync('data/districts.json', 'utf8'));

let currentDistrict;
const reports = [];
for (let i = 0; i < data.length; i++) {
    const line = data[i].trim();

    if (!line.startsWith('<option') || line.includes(currentDistrict))
        continue;

    // File name is stored in the value property of the option element
    let index = line.indexOf('\'') + 1;
    const file = line.substring(index, line.indexOf('\'', index));
    if (file.includes('Grd6-8'))
        continue;

    // Data is stored as the option element's text
    index = line.indexOf('>') + 2;
    // DISTRICT CODE, --, DISTRICT NAME, LEVEL, YEAR
    const district = line.substring(index, line.indexOf('</option>', index)).split('&nbsp;');

    // Only use high schools
    if (district[3] !== 'Student - Secondary' || !districts.find(d => d.CDCode === district[0]) /* Schools where top grade is 12 */)
        continue;

    reports.push({
        file,
        code: district[0],
        name: district[2],
        year: district[4].substring(5) // Select last 4 characters = end year
    });
    currentDistrict = district[0];
}

writeFileSync('data/reports.json', JSON.stringify(reports, null, 2));
