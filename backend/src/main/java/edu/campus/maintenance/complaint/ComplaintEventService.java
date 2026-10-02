package edu.campus.maintenance.complaint;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class ComplaintEventService {

    private final Map<Long, List<SseEmitter>> emitterMap = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long complaintId) {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout
        List<SseEmitter> emitters = emitterMap.computeIfAbsent(complaintId, k -> new CopyOnWriteArrayList<>());
        emitters.add(emitter);

        emitter.onCompletion(() -> removeEmitter(complaintId, emitter));
        emitter.onTimeout(() -> removeEmitter(complaintId, emitter));
        emitter.onError(e -> removeEmitter(complaintId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected to complaint updates for ID: " + complaintId));
        } catch (IOException e) {
            removeEmitter(complaintId, emitter);
        }

        return emitter;
    }

    public void broadcastStatusUpdate(Long complaintId, Object updateData) {
        List<SseEmitter> emitters = emitterMap.get(complaintId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("STATUS_UPDATE")
                        .data(updateData));
            } catch (IOException e) {
                removeEmitter(complaintId, emitter);
            }
        }
    }

    private void removeEmitter(Long complaintId, SseEmitter emitter) {
        List<SseEmitter> emitters = emitterMap.get(complaintId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emitterMap.remove(complaintId);
            }
        }
    }

    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        emitterMap.forEach((complaintId, emitters) -> {
            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().comment("ping"));
                } catch (IOException e) {
                    removeEmitter(complaintId, emitter);
                }
            }
        });
    }
}
