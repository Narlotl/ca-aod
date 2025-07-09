import { existsSync, mkdirSync, readFileSync, createWriteStream } from 'fs';
import { get, Agent } from 'https';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

console.log('Downloading report files');

const rl = createInterface({ input: stdin, output: stdout });
await rl.question('This will download ~1.4G of data. Make sure you have a fast and stable internet connection. Press ENTER to confirm or Ctrl+C to quit. ');
rl.close();

if (!existsSync('data/reports/'))
    mkdirSync('data/reports');

const reports = JSON.parse(readFileSync('data/reports.json', 'utf8'));

const agent = new Agent({
    keepAlive: true,
    maxSockets: 5
});
const options = { agent };

let done = 0;
for (const report of reports) {
    const fileName = `data/reports/${report.code}_${report.name.replaceAll('/', '-')}_${report.year}.pdf`;
    if (!existsSync(fileName))
        get('https://data.calschls.org/resources/' + report.file, options, res => {
            const file = createWriteStream(fileName);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                done++;
                console.log(report.name, done + '/' + reports.length);
            });
        }).on('error', e => console.error(report, e));
}
