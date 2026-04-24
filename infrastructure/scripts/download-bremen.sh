#!/bin/bash
# Download Bremen OSM extract from Geofabrik
# This is used by Valhalla for pedestrian routing

EXTRACT_URL="https://download.geofabrik.de/europe/germany/bremen-latest.osm.pbf"
OUTPUT_DIR="../valhalla-data"

mkdir -p "$OUTPUT_DIR"

echo "Downloading Bremen OSM extract..."
curl -L -o "$OUTPUT_DIR/bremen-latest.osm.pbf" "$EXTRACT_URL"

echo "Download complete. Size:"
ls -lh "$OUTPUT_DIR/bremen-latest.osm.pbf"
echo ""
echo "Valhalla will automatically build tiles from this extract on first start."
