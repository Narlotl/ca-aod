//import pdf2html from 'pdf2html';
import { exec } from 'child_process';
import { parentPort, workerData } from 'worker_threads';

const districts = [];
const files = workerData ? workerData : [process.argv[2]];
for (const file of files) {
    console.log('start', file)
    await new Promise((resolve, reject) => {
        exec(`pdftotext -f 10 -layout "reports/${file}" -`, (err, text, stderr) => {
            text = text.replaceAll(/ {2,}/g, ' ').split('\n');

            let startedReading = false;
            const grades = [];
            let percents;
            for (let i = 0; i < text.length; i++) {
                const line = text[i].trim();
                if (!startedReading) {
                    if (line.startsWith('Summary Measures of Level of AOD Use') || line.startsWith('AOD Use, Lifetime'))
                        startedReading = true;
                    continue;
                }

                if (line.startsWith('Grade') || line === 'NT' || line.startsWith('All') && line.endsWith('Table')) {
                    const cols = line.split(' ');
                    for (const col of cols) {
                        if (col.length === 0 || col === 'Grade' || col === 'Table' || col === '%')
                            continue;
                        if (!grades.includes(col))
                            grades.push(col);
                    }
                }
                else if (line.startsWith('Lifetime alcohol or drug use')) {
                    percents = line
                        .substring(
                            29, // start of percent columns
                            line.length - 5 // line ends with " A9.2"
                        ).split(' ');
                    break;
                }
                else if (line.startsWith('Lifetime alcohol or drugs (any use)')) {
                    percents = line
                        .substring(
                            36, // start of percent columns
                            line.length - 6 // line ends with " A6.2 "
                        ).split(' ');
                    break;
                }
                else if (line.startsWith('Any of the above AOD Use')) {
                    percents = line
                        .substring(
                            25, // start of percent columns
                        ).split(' ');
                    break;
                }
                else if (line.startsWith('Lifetime alcohol or drugs (excluding cold/cough')) {
                    // This one is across two lines
                    // Example: https://data.calschls.org/resources/Orange_Unified_1314_CHKS.pdf#p48R_mc18
                    percents = text[i + 1]
                        .substring(1, text[i + 1].length - 5)
                        .split(' ');
                    break;
                }
            }

            const obj = {};
            for (let i = 0; i < grades.length; i++)
                obj[grades[i]] = parseInt(percents[i]);

            const code = file.substring(0, 7);
            const yearIndex = file.indexOf('_', 8);
            districts.push({
                code,
                name: file.substring(8, yearIndex),
                percents: obj,
                year: parseInt(file.substring(yearIndex + 1))
            });

            console.log('done', file)
            resolve();
        });
    });
}

if (parentPort)
    parentPort.postMessage(districts);
else
    console.log(districts);
