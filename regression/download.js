import { existsSync, readFileSync, createWriteStream } from 'fs';
import { get, Agent } from 'https';

console.log('Downloading report files');

const reports = JSON.parse(readFileSync('reports.json', 'utf8'));

const agent = new Agent({
    keepAlive: true,
    maxSockets: 5
});
const options = { agent };

let done = 0;
for (const report of reports) {
    const fileName = `reports/${report.code}_${report.name.replaceAll('/', '-')}_${report.year}.pdf`;
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
