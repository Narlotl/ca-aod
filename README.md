# ca-aod
Mapping drug use in California high schools.

School districts in California are encouraged every year to administer the [California Healthy Kids Survey (CHKS)](https://www.cde.ca.gov/ls/he/at/chks.asp) to their 9th and 11th grade students. The survey includes questions about student alcohol or drug (AOD) use. This project uses the response data from these surveys to map the percent of students who have used drugs in their lifetime in each district.

## Data sources
- Percent data from CHKS responses parsed from California Department of Education [report files](https://dq.cde.ca.gov/dataquest/page2.asp?level=District&subject=HKids&submit1=Submit)*.
- District boundaries from [California School District Areas 2023-24](https://gis.data.ca.gov/datasets/CDEGIS::california-school-district-areas-2023-24/about) dataset on the California State Geoportal.

*It is important to interpret these results with caution. Results can be significantly impacted by response rates, the type of parental consent used (passive or active), gender differences, regional variations, and other issues. The CHKS is only one of many data sources.

## Run it yourself

- Clone the repository
- Run `npm install` to install libraries
- Run `npm run build` to create data
- If you need to run any of the steps individually, `npm run build` runs:
    - `node get_reports.js`
    - `node download.js`
    - `node threads.js`
    - `node combine.js`

Percents are in `data/percents.json` and the map data file is `data/results.topojson`.
