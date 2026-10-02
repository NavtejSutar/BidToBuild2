package edu.campus.maintenance.auth;

import edu.campus.maintenance.common.exceptions.RateLimitExceededException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    // Simple in-memory sliding window rate limiter
    private static class RequestLog {
        long timestamp;
        RequestLog(long ts) { this.timestamp = ts; }
    }

    private final Map<String, java.util.List<Long>> requestMap = new ConcurrentHashMap<>();

    public void checkRateLimit(String key, int maxRequests, int windowSeconds) {
        long now = Instant.now().toEpochMilli();
        long windowStart = now - (windowSeconds * 1000L);

        requestMap.compute(key, (k, timestamps) -> {
            if (timestamps == null) {
                timestamps = new java.util.concurrent.CopyOnWriteArrayList<>();
            }
            // Remove timestamps older than window
            timestamps.removeIf(ts -> ts < windowStart);

            if (timestamps.size() >= maxRequests) {
                throw new RateLimitExceededException("Rate limit exceeded for " + key + ". Please try again in " + windowSeconds + " seconds.");
            }
            timestamps.add(now);
            return timestamps;
        });
    }
}
