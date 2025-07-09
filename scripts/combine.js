import { existsSync, readFileSync, writeFileSync } from 'fs';
import { topology } from 'topojson-server';
import { presimplify, quantile, simplify } from 'topojson-simplify';

console.log('Merging data with geometry');

const percents = JSON.parse(readFileSync('data/percents.json', 'utf8'));

let districts;
if (!existsSync('data/districts.geojson')) {
    districts = await fetch('https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/DistrictAreas2324/FeatureServer/0/query?outFields=CDCode&where=GradeHigh%3D12+AND+GradeHighCensus%3D12&f=geojson')
        .then(res => res.json());
    districts = districts.features;
    writeFileSync('data/districts.geojson', JSON.stringify(districts));
}
else
    districts = JSON.parse(readFileSync('data/districts.geojson', 'utf8'));

const filteredDistricts = [];

for (let i = 0; i < percents.length; i++) {
    const percent = percents[i];

    for (let j = 0; j < districts.length; j++) {
        const district = districts[j];

        if (district.properties.CDCode === percent.code) {
            filteredDistricts.push({
                type: 'Feature',
                id: district.id,
                geometry: district.geometry,
                properties: percent
            });

            districts.splice(j, 1);
            break;
        }
    }
}

const topo = topology({ results: { type: 'FeatureCollection', features: filteredDistricts } }, 10000);
const pre = presimplify(topo);
const weight = quantile(pre, 0.1);
const simplified = simplify(pre, weight);
writeFileSync('data/results.topojson', JSON.stringify(simplified));

console.log('Done');
