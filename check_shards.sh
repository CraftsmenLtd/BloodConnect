#!/bin/bash

while IFS= read -r shard; do
    echo "Checking shard: $shard"
    
    # Get the shard iterator
    iterator=$(aws dynamodbstreams get-shard-iterator --stream-arn "arn:aws:dynamodb:ap-south-1:211125655549:table/i-83-create-blood-request-bloodConnect-table/stream/2024-10-17T22:41:45.995" --shard-id "$shard" --shard-iterator-type TRIM_HORIZON --region ap-south-1 --query 'ShardIterator' --output text)
    
    if [ -z "$iterator" ]; then
        echo "Failed to get iterator for shard: $shard"
        continue
    fi

    # Get records using the shard iterator
    records=$(aws dynamodbstreams get-records --shard-iterator "$iterator" --region ap-south-1)
    
    # Check if there are any records
    if [[ $records == *'"Records": ['* && $records != *'"Records": []'* ]]; then
    # if [[ $records == *'"eventName": "INSERT"'* ]]; then
        echo "Found records in shard: $shard"
        echo "$records"
        break
    fi
done < shard_ids.txt