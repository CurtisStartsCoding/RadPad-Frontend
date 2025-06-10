# Redis Integration in RadOrderPad

**Version:** 1.0
**Date:** 2025-04-20

This document describes the comprehensive Redis integration in the RadOrderPad application, focusing on Redis Cloud with RedisJSON and RedisSearch modules for efficient data storage, retrieval, and searching.

## Overview

RadOrderPad uses Redis Cloud (hosted on AWS) for:

1. **Caching Medical Reference Data**: CPT codes, ICD-10 codes, and their mappings
2. **Fast Context Generation**: Using RedisSearch for advanced, real-time indexing and querying
3. **Structured Data Storage**: Using RedisJSON for efficient storage and retrieval of JSON data

## Implementation Details

### 1. Redis Client Configuration

The Redis client is configured in `src/config/redis.ts` with the following key features:

- **TLS Enabled**: Always uses TLS for secure connections to Redis Cloud
- **Connection Pooling**: Leverages ioredis connection pooling
- **Error Handling**: Comprehensive error handling with informative messages
- **Reconnection Strategy**: Exponential backoff with a maximum retry time

### 2. RedisJSON Integration

All data is stored using RedisJSON commands:

- **Storage**: Uses `JSON.SET` instead of regular `SET` to store structured JSON data
- **Retrieval**: Uses `JSON.GET` to retrieve JSON data
- **Helper Functions**: `cacheDataWithRedisJson` and `getCachedDataWithRedisJson` provide a clean API

### 3. RedisSearch Integration

RedisSearch is used for fast, advanced querying:

- **Index Creation**: Indexes are created using `FT.CREATE` with `ON JSON` syntax
- **Querying**: Uses `FT.SEARCH` for efficient querying
- **Field-Level Indexing**: Indexes specific fields within JSON documents

### 4. Cache-Aside Pattern Implementation

The Cache-Aside pattern is implemented for data retrieval:

1. Check Redis first for the requested data
2. If found (cache hit), return the data directly
3. If not found (cache miss), query PostgreSQL
4. Store the result in Redis with an appropriate TTL
5. Return the data to the application

### 5. Data Models

The following data models are stored in Redis:

- **CPT Codes**: `cpt:{cpt_code}` → JSON object with description, modality, body_part
- **ICD-10 Codes**: `icd10:{icd10_code}` → JSON object with description, clinical_notes, etc.
- **Mappings**: `mapping:{icd10_code}:{cpt_code}` → JSON object with mapping details
- **Markdown Docs**: `markdown:{icd10_code}` → JSON object with markdown content

### 6. Search Indexes

Two main search indexes are created:

- **CPT Index**:
  ```
  FT.CREATE cpt_index ON JSON PREFIX 1 cpt: SCHEMA
    $.description AS description TEXT WEIGHT 5.0
    $.modality AS modality TAG
    $.body_part AS body_part TAG
    $.description AS description_nostem TEXT NOSTEM
  ```

- **ICD-10 Index**:
  ```
  FT.CREATE icd10_index ON JSON PREFIX 1 icd10: SCHEMA
    $.description AS description TEXT WEIGHT 5.0
    $.keywords AS keywords TEXT WEIGHT 2.0
    $.category AS category TAG
    $.is_billable AS is_billable TAG
    $.description AS description_nostem TEXT NOSTEM
  ```

### 7. Time-to-Live (TTL) Settings

Different TTL settings are used for different types of data:

- **Prompt templates**: 1 hour (3600 seconds)
- **CPT and ICD-10 codes**: 24 hours (86400 seconds)
- **CPT-ICD10 mappings**: 6 hours (21600 seconds)
- **ICD-10 markdown docs**: 6 hours (21600 seconds)

## Environment Configuration

Redis Cloud connection details are configured via environment variables:

```
REDIS_CLOUD_HOST=your-redis-cloud-endpoint.cloud.redislabs.com
REDIS_CLOUD_PORT=12345
REDIS_CLOUD_PASSWORD=your-redis-cloud-password
```

## Security Considerations

- **TLS Encryption**: All connections to Redis Cloud use TLS encryption
- **Authentication**: Redis Cloud password is used for authentication
- **IP Allowlisting**: Redis Cloud is configured to only accept connections from specific IP addresses (currently only 3.135.76.53 is allowed)

### IP Allowlisting Configuration

The Redis Cloud instance is currently configured to only accept connections from the IP address 3.135.76.53. You need to add your current IP address (69.138.136.57) to the allowlist in the Redis Cloud console:

1. Log in to the Redis Cloud console
2. Navigate to your database
3. Go to the "Security" tab
4. Under "CIDR allow list", add your IP address: 69.138.136.57
5. Click "Save"

Alternatively, you can use a proxy or VPN to route your traffic through the allowed IP address.

## Testing Redis Cloud Connection

To test your connection to Redis Cloud and check if your IP address is properly allowlisted, you can use the provided test scripts:

### Basic Connection Test

```bash
# Windows
.\test-redis-connection.bat

# Unix/Linux/macOS
./test-redis-connection.sh
```

This script will:
1. Display your current public IP address
2. Test the connection to Redis Cloud
3. Provide guidance on how to update the IP allowlist if the connection fails

### Redis Functionality Test

Once your connection is working, you can run a more comprehensive test that verifies Redis functionality:

```bash
# Windows
.\run-redis-basic-test.bat

# Unix/Linux/macOS
./run-redis-basic-test.sh
```

This test will:
1. Test the Redis Cloud connection
2. Create RedisSearch indexes
3. Verify the indexes were created
4. Test basic Redis operations (set, get, delete)

The test includes a 30-second timeout to prevent it from hanging indefinitely if there are connection issues.

### Enhanced RedisSearch Test

To verify that the system is correctly using RedisSearch as the primary path and PostgreSQL as the fallback, you can run the enhanced RedisSearch test:

```bash
# Windows
.\run-redis-search-enhanced-test.bat

# Unix/Linux/macOS
./run-redis-search-enhanced-test.sh
```

This test will:
1. Create RedisSearch indexes
2. Verify the indexes were created
3. Test the primary RedisSearch path by calling the validation endpoint
4. Test the PostgreSQL fallback path by temporarily disabling the Redis connection
5. Compare the results from both paths

The test verifies that:
- The system uses RedisSearch as the primary path when Redis is available
- The system falls back to PostgreSQL when Redis is unavailable
- Both paths produce similar results

This test is particularly useful for ensuring that the fallback mechanism works correctly and that the system can continue to function even if Redis is unavailable.

## Fallback Strategy

If Redis Cloud is unavailable, the application falls back to PostgreSQL for data retrieval:

1. Connection test is performed before each Redis operation
2. If the connection fails, the application gracefully falls back to PostgreSQL
3. Detailed error messages are logged to help diagnose connection issues
4. Path tracing logs indicate which path (RedisSearch or PostgreSQL) is being used

### Path Tracing

The system logs which path (RedisSearch or PostgreSQL) is being used for context generation, making it easy to monitor the system's behavior in production:

```typescript
// When using RedisSearch
logger.info('CONTEXT_PATH: Using RedisSearch as primary path');

// When falling back to PostgreSQL
logger.info('CONTEXT_PATH: Using PostgreSQL fallback (Redis connection failed)');
logger.info('CONTEXT_PATH: Using PostgreSQL fallback (Redis connection error)');
logger.info('CONTEXT_PATH: Using PostgreSQL fallback (RedisSearch error)');
logger.info('CONTEXT_PATH: Executing PostgreSQL fallback path');
```

These log entries can be used to track which path is being used and why, helping to diagnose issues and monitor the system's behavior.

## Benefits

This implementation provides significant benefits:

1. **Performance**: Near real-time (<10-20ms) retrieval of contextually relevant medical codes
2. **Reduced Database Load**: Minimizes direct queries to PostgreSQL
3. **Robustness**: Includes fallback to PostgreSQL if Redis fails
4. **Maintainability**: Modular design with clear separation of concerns

## Maintenance and Monitoring

- **Index Creation**: The `create-redis-indexes.ts` script creates and updates RedisSearch indexes
- **Connection Testing**: The `testRedisConnection` function can be used to test the Redis Cloud connection
- **Error Logging**: Comprehensive error logging helps diagnose issues
- **Path Tracing**: The system logs which path (RedisSearch or PostgreSQL) is being used for context generation

### Monitoring Path Usage

You can monitor which path (RedisSearch or PostgreSQL) is being used by searching for log entries with the prefix `CONTEXT_PATH:`:

```
CONTEXT_PATH: Using RedisSearch as primary path
CONTEXT_PATH: Using PostgreSQL fallback (Redis connection failed)
CONTEXT_PATH: Using PostgreSQL fallback (Redis connection error)
CONTEXT_PATH: Using PostgreSQL fallback (RedisSearch error)
CONTEXT_PATH: Executing PostgreSQL fallback path
```

These log entries can be used to:
- Monitor the percentage of requests using RedisSearch vs. PostgreSQL
- Identify when Redis is unavailable or experiencing issues
- Track the performance of each path
- Set up alerts for when the system falls back to PostgreSQL too frequently

## Future Enhancements

Potential future enhancements include:

1. **Cache Warming**: Implement proactive cache warming for frequently accessed data
2. **Cache Metrics**: Add monitoring and metrics for cache hit/miss rates and performance
3. **Distributed Locking**: Implement distributed locking for concurrent operations on the same data
4. **Automatic Index Updates**: Implement automatic index updates when the underlying reference data in PostgreSQL changes
5. **Caching Validation Results**: Store complete validation results for frequently used dictations
6. **Advanced Query Optimization**: Further refine RedisSearch queries for better relevance

## References

- [Redis Cloud Documentation](https://docs.redis.com/latest/rc/)
- [RedisJSON Documentation](https://redis.io/docs/stack/json/)
- [RedisSearch Documentation](https://redis.io/docs/stack/search/)

## Migration Notes

This implementation represents a migration from AWS MemoryDB to Redis Cloud. The core functionality remains the same, but the connection configuration and security settings have been updated to work with Redis Cloud.