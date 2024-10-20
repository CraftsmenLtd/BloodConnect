#!/bin/bash

STREAM_ARN="arn:aws:dynamodb:ap-south-1:211125655549:table/i-83-create-blood-request-bloodConnect-table/stream/2024-10-20T18:15:31.532"
REGION="ap-south-1"

while IFS= read -r shard; do
    echo "Checking shard: $shard"
   
    # Get the initial shard iterator
    iterator=$(aws dynamodbstreams get-shard-iterator --stream-arn "$STREAM_ARN" --shard-id "$shard" --shard-iterator-type TRIM_HORIZON --region "$REGION" --query 'ShardIterator' --output text)
   
    if [ -z "$iterator" ]; then
        echo "Failed to get iterator for shard: $shard"
        continue
    fi

    # Loop to get all records from the shard
    while true; do
        # Get records using the shard iterator
        response=$(aws dynamodbstreams get-records --shard-iterator "$iterator" --region "$REGION")
        
        # Check if there are any records
        if [[ $response == *'"Records": ['* && $response != *'"Records": []'* ]]; then
            echo "Records found in shard: $shard"
            echo "$response"
        fi

        # Extract next iterator
        next_iterator=$(echo "$response" | grep -o '"NextShardIterator": "[^"]*' | cut -d'"' -f4)

        # Check if we've reached the end of the shard
        if [ -z "$next_iterator" ]; then
            echo "Reached end of shard: $shard"
            break
        fi

        # Update iterator for next batch
        iterator=$next_iterator
    done

done < shard_ids.txt