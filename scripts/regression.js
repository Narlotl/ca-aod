import { readFileSync, writeFileSync } from 'fs';
import MultivariateLinearRegression from 'ml-regression-multivariate-linear';

const data = JSON.parse(readFileSync('regression/percents.json'))
    .filter(d => d.percents["9"] < d.percents["10"] && d.percents["10"] < d.percents["11"] && d.percents["11"] < d.percents["12"]);

const x = data.map(d => [d.percents["9"], d.percents["11"]]);
const y_10 = data.map(d => [d.percents["10"]]),
    y_12 = data.map(d => [d.percents["12"]]);

const model_10 = new MultivariateLinearRegression(x, y_10),
    model_12 = new MultivariateLinearRegression(x, y_12);

const percents = JSON.parse(readFileSync('data/percents.json', 'utf8'));
const predicted = [];
for (let i = 0; i < percents.length; i++) {
    const district = percents[i];

    if (!district.percents["9"] || !district.percents["11"]) {
        predicted.push(district);
        continue;
    }

    const sample = [district.percents["9"], district.percents["11"]];
    if (!district.percents["10"])
        district.percents["10"] = Math.round(model_10.predict(sample)[0]);
    if (!district.percents["12"])
        district.percents["12"] = Math.round(model_12.predict(sample)[0]);

    predicted.push(district);
}

writeFileSync('data/predicted.json', JSON.stringify(predicted, null, 2));
