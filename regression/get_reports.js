import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

console.log('Getting reports list');

// Download data files
let data = readFileSync('../data/reports.html', 'utf8');
data = data.split('\n');

const districts = ['3476505', '3768031', '3768346', '3367215', '4369609', '2165482', '1964519', '1964683', '1663982', '1964311', '4068759', '4068809', '4369534', '0161275', '0461515', '0761697'];

const reports = [];
for (let i = 0; i < data.length; i++) {
    const line = data[i].trim();

    if (!line.startsWith('<option'))
        continue;

    // File name is stored in the value property of the option element
    let index = line.indexOf('\'') + 1;
    const file = line.substring(index, line.indexOf('\'', index));
    if (file.includes('Grd6-8') || file.includes('II') || file.includes('NT'))
        continue;

    // Data is stored as the option element's text
    index = line.indexOf('>') + 2;
    // DISTRICT CODE, --, DISTRICT NAME, LEVEL, YEAR
    const district = line.substring(index, line.indexOf('</option>', index)).split('&nbsp;');

    // Only use high schools
    if (district[3] !== 'Student - Secondary' || !districts.includes(district[0])) /* Schools where top grade is 12 */
        continue;

    reports.push({
        file,
        code: district[0],
        name: district[2],
        year: district[4].substring(5) // Select last 4 characters = end year
    });
}

writeFileSync('reports.json', JSON.stringify(reports, null, 2));
