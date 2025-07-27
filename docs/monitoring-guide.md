# 📊 Monitoring & Observability Guide

This guide covers the comprehensive monitoring and observability features implemented in the Contact Management API.

## 🎯 Overview

The application includes enterprise-grade monitoring capabilities:

- **Structured Logging** with correlation IDs
- **Real-time Metrics Collection** for requests, errors, cache, and database
- **Health Checks** with readiness and liveness probes
- **Performance Monitoring** with automatic alerting
- **Error Tracking** with detailed context
- **System Metrics** monitoring

## 📈 Metrics Collection

### Request Metrics
- **Total Requests**: Count of HTTP requests
- **Response Times**: Average and percentile response times
- **Error Rates**: Percentage of failed requests
- **Status Code Distribution**: Breakdown by HTTP status codes

### Error Metrics
- **Error Count**: Total application errors
- **Error Types**: Categorized by error type
- **Error Paths**: Errors grouped by endpoint
- **Error Context**: User ID, correlation ID, stack traces

### Cache Metrics
- **Hit Rate**: Cache hit percentage
- **Operation Counts**: Hits, misses, sets, deletes
- **Response Times**: Cache operation performance

### Database Metrics
- **Query Count**: Total database queries
- **Query Performance**: Average query execution time
- **Slow Queries**: Queries exceeding 1000ms threshold
- **Query Errors**: Failed database operations

### System Metrics
- **CPU Usage**: Process CPU utilization
- **Memory Usage**: Heap and RSS memory consumption
- **Uptime**: Application uptime
- **Active Connections**: Database connection count

## 🔍 Monitoring Endpoints

### Health Checks

#### General Health Check
```http
GET /health
```

Returns comprehensive health status including database, Redis, memory, and disk checks.

**Response Example:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "responseTime": 45,
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "details": {
        "status": "connected",
        "responseTime": 12,
        "connectionCount": 5
      }
    },
    {
      "name": "redis",
      "status": "healthy",
      "details": {
        "status": "connected",
        "responseTime": 8
      }
    }
  ],
  "version": "1.0.0",
  "environment": "production"
}
```

#### Readiness Check
```http
GET /health/ready
```

Kubernetes-style readiness probe checking critical dependencies.

#### Liveness Check
```http
GET /health/live
```

Kubernetes-style liveness probe with system information.

### Metrics Endpoints

All metrics endpoints require authentication with Bearer token.

#### Comprehensive Metrics Dashboard
```http
GET /monitoring/metrics
Authorization: Bearer <token>
```

Returns all metrics in a single response for dashboard display.

#### Request Metrics
```http
GET /monitoring/metrics/requests?timeRange=300000
Authorization: Bearer <token>
```

**Query Parameters:**
- `timeRange` (optional): Time range in milliseconds (default: 60000)

**Response Example:**
```json
{
  "totalRequests": 150,
  "averageResponseTime": 245,
  "errorRate": 2.5,
  "statusCodes": {
    "200": 140,
    "404": 5,
    "500": 5
  },
  "timeRange": "300s"
}
```

#### Error Metrics
```http
GET /monitoring/metrics/errors?timeRange=300000
Authorization: Bearer <token>
```

#### Cache Metrics
```http
GET /monitoring/metrics/cache?timeRange=300000
Authorization: Bearer <token>
```

#### Database Metrics
```http
GET /monitoring/metrics/database?timeRange=300000
Authorization: Bearer <token>
```

#### System Metrics
```http
GET /monitoring/metrics/system
Authorization: Bearer <token>
```

## 📝 Logging

### Structured Logging Format

All logs include:
- **Timestamp**: ISO 8601 format with milliseconds
- **Level**: error, warn, info, debug, verbose
- **Message**: Human-readable log message
- **Context**: Component or service name
- **Correlation ID**: Request tracking identifier
- **Service**: Application name and version
- **Environment**: development, staging, production

### Log Files

- **`logs/combined.log`**: All application logs
- **`logs/error.log`**: Error-level logs only
- **`logs/access.log`**: HTTP request logs

### Log Rotation

- **Max File Size**: 10MB per log file
- **Retention**: 5-10 files depending on log type
- **Format**: JSON for machine processing

### Correlation IDs

Every HTTP request receives a unique correlation ID:
- **Header**: `X-Correlation-ID` in response
- **Logging**: Included in all related log entries
- **Tracing**: Links all operations for a single request

## 🚨 Alerting & Thresholds

### Automatic Alerts

The system automatically logs warnings for:

#### Performance Alerts
- **Slow Requests**: > 1000ms response time
- **Slow Database Queries**: > 1000ms execution time
- **High Memory Usage**: > 80% heap utilization

#### Error Alerts
- **Application Errors**: All unhandled exceptions
- **Database Errors**: Connection failures and query errors
- **Cache Errors**: Redis connection issues

#### Security Alerts
- **Authentication Failures**: Failed login attempts
- **Authorization Violations**: Access denied events
- **Rate Limiting**: Threshold exceeded events

### Custom Alerting

Extend alerting by monitoring log files or metrics endpoints:

```bash
# Monitor error rate
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/monitoring/metrics/requests" \
  | jq '.errorRate'

# Monitor memory usage
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/monitoring/metrics/system" \
  | jq '.memoryUsage.heapUsedPercent'
```

## 🔧 Configuration

### Environment Variables

```bash
# Logging configuration
LOG_LEVEL=info                    # debug, info, warn, error
NODE_ENV=production              # development, staging, production

# Metrics retention
METRICS_RETENTION_HOURS=24       # Hours to keep metrics in memory
METRICS_MAX_COUNT=1000          # Maximum metrics per type

# Health check thresholds
MEMORY_THRESHOLD_MB=1024        # Memory usage alert threshold
CPU_THRESHOLD_PERCENT=80        # CPU usage alert threshold
```

### Log Level Configuration

- **debug**: Detailed debugging information
- **info**: General application information
- **warn**: Warning conditions
- **error**: Error conditions only

## 📊 Integration Examples

### Prometheus Integration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'contact-api'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/monitoring/metrics'
    bearer_token: 'your-auth-token'
```

### Grafana Dashboard

Create dashboards using the metrics endpoints:
- Request rate and response times
- Error rates and types
- Cache hit rates
- Database performance
- System resource usage

### ELK Stack Integration

Configure log shipping to Elasticsearch:

```yaml
# filebeat.yml
filebeat.inputs:
- type: log
  paths:
    - /app/logs/*.log
  json.keys_under_root: true
  json.add_error_key: true
```

## 🛠️ Troubleshooting

### High Memory Usage

1. Check system metrics: `GET /monitoring/metrics/system`
2. Review memory-intensive operations in logs
3. Monitor garbage collection patterns
4. Consider increasing memory limits

### Slow Performance

1. Check request metrics: `GET /monitoring/metrics/requests`
2. Identify slow endpoints in logs
3. Review database query performance
4. Check cache hit rates

### Database Issues

1. Monitor database metrics: `GET /monitoring/metrics/database`
2. Check connection pool status
3. Review slow query logs
4. Verify database health: `GET /health`

### Cache Problems

1. Check cache metrics: `GET /monitoring/metrics/cache`
2. Monitor Redis connectivity
3. Review cache hit rates
4. Check Redis logs for errors

## 📚 Best Practices

### Monitoring Strategy

1. **Set up automated alerting** for critical metrics
2. **Monitor trends** rather than just current values
3. **Use correlation IDs** to trace request flows
4. **Regular health check monitoring** for early issue detection

### Log Management

1. **Use structured logging** for better searchability
2. **Include context** in all log messages
3. **Avoid logging sensitive data** (passwords, tokens)
4. **Monitor log volume** to prevent disk space issues

### Performance Optimization

1. **Monitor cache hit rates** and optimize caching strategy
2. **Track slow queries** and optimize database performance
3. **Monitor memory usage** and tune garbage collection
4. **Use correlation IDs** for distributed tracing

This monitoring setup provides comprehensive observability for production environments while maintaining performance and security standards.
