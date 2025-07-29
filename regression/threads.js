import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { exec } from 'child_process';

// Make sure pdftotext is installed
await new Promise((resolve, reject) => {
    exec('pdftotext -v', (err, stdout, stderr) => {
        if (err)
            reject('pdftotext not found. More information at https://poppler.freedesktop.org');
        resolve();
    });
});

console.log('Parsing report files');

const files = readdirSync('reports/');
let districts = [];

const promises = [];
for (let i = 0; i < cpus().length - 1; i++)
    promises.push(new Promise((resolve, reject) => {
        const worker = new Worker('./parse.js', // Relative path is required
            { workerData: files.slice(i * files.length / 10, (i + 1) * files.length / 10) }
        );
        worker.on('message', data => {
            districts = districts.concat(data);
            resolve();
        });
    }));

await Promise.all(promises);

const reports = JSON.parse(readFileSync('reports.json', 'utf8'));
for (let i = 0; i < districts.length; i++)
    for (let j = 0; j < reports.length; j++)
        if (districts[i].code === reports[j].code) {
            districts[i].file = reports[j].file;
            reports.splice(j, 1);
            break;
        }

writeFileSync('percents.json', JSON.stringify(districts, null, 2));
