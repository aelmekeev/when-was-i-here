#!/bin/bash

# Use https://github.com/AshKyd/geojson-regions to get geo.json. 110m resolution is enough.

temp_file="geo_temp.json"
temp_file_2="geo_temp_2.json"

# keep only iso_a2 from the geojson file
cat geo.json | jq -c '{
  "type": "FeatureCollection",
  "features": [
    .features[] | {
      "type": .type,
      "iso_a2": .properties.iso_a2,
      name: .properties.name,
      "geometry": .geometry
    }
  ]
}' >$temp_file

# fix for https://github.com/nvkelso/natural-earth-vector/issues/284
# France => FR
# Norway => NO
jq -c '{
  "type": "FeatureCollection",
  "features": [
    .features[] | {
      "type": .type,
      iso_a2: (if .name == "France" then "FR" elif .name == "Norway" then "NO" else .iso_a2 end),
      name: .name,
      "geometry": .geometry
    }
  ]
}' $temp_file >$temp_file_2

# set street view flag
jq -sc '. | .[0] as $cov | .[1] |
  {
  "type": "FeatureCollection",
  "features": [
    .features[] | {
      "type": .type,
      iso_a2: .iso_a2,
      name: .name,
      sv: ($cov[.iso_a2] != null // false),
      "geometry": .geometry
    }
  ]
}' street_view_coverage.json $temp_file_2 >../src/utils/geo.json

rm $temp_file $temp_file_2
