# geoplotter
A simple react app that plots geohashes onto mapbox via url parameters.
## config
### Available URL Parameters for `GeohashMap`

| Parameter   | Type    | Required | Description                                                                                      | Example Value                                                   |
|-------------|---------|----------|--------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|
| `geohashes` | String  | No       | A comma-separated list of geohashes to display on the map.                                        | `geohashes=dr5ru,dr5rv,dr5rw`                                  |
| `urls`      | String  | No       | A comma-separated list of URLs pointing to files containing geohashes (one per line). These are fetched and displayed. | `urls=https://example.com/data1,https://example.com/data2`     |
| `colors`    | String  | No       | A comma-separated list of hex colors to be displayed for each group of URLs.                     | `colors=ffffff,000000`                                          |
| `timer`     | Integer | No       | Refresh interval in seconds for reloading geohashes and updating the map.                        | `timer=60`                                                      |