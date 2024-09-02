#!/bin/bash
set -e

BASE_DIR="$OPENAPI_DIRECTORY/paths"

# Update integration references in the YAML file
updateIntegrationsFilesRef() {
    local file="$1"

    # Extract {{}} patterns for replacement
    patterns=$(grep -o '{{[^}]*}}' "$file" | sort | uniq)

    if [ -n "$patterns" ]; then
        echo "Processing file: $file"

        # Replace integrations with the corresponding $ref
        for pattern in $patterns; do
            filename=$(echo "$pattern" | sed -e 's/{{\([^}]*\)}}/\1/')
            echo "Updating reference for file: $filename"

            sed -i "s/\"$pattern\"/\n    \$ref: .\/..\/..\/integration\/$CLOUD_PROVIDER\/auth\/$filename/g" "$file"
        done
    else
        echo "No patterns found in $file"
    fi
}

# Find and process each YAML file under `paths` directory
find "$BASE_DIR" -name "*.yml" | while read -r file; do
    updateIntegrationsFilesRef "$file"
done
