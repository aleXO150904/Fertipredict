package com.fertipredict.app.Prediction;

import java.time.Instant;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PredictionTimeTest {
    @Test void creationCrossesUtcDayIntoCorrectLimaDay() {
        Prediction p = new Prediction();
        p.recordCreation(Instant.parse("2026-11-02T02:35:39Z"));
        assertEquals(LocalDateTime.parse("2026-11-01T21:35:39"), p.getDate());
        assertEquals("2026-11-01T21:35:39-05:00", p.displayDate());
    }
    @Test void updateDoesNotReplaceCreation() {
        Prediction p = new Prediction();
        Instant original = Instant.parse("2026-11-02T02:35:39Z");
        p.recordCreation(original);
        p.recordUpdate(original.plusSeconds(3600));
        assertEquals(original, p.getCreatedAt());
        assertEquals(original.plusSeconds(3600), p.getUpdatedAt());
        assertEquals("2026-11-01T21:35:39-05:00", p.displayDate());
        assertThrows(IllegalStateException.class, () -> p.recordCreation(Instant.now()));
    }
    @Test void legacyDateRemainsUnconvertedAfterEdit() {
        Prediction p = Prediction.builder().date(LocalDateTime.parse("2026-11-02T02:35:39")).build();
        p.recordUpdate(Instant.parse("2026-11-06T12:00:00Z"));
        assertNull(p.getCreatedAt());
        assertEquals("2026-11-02T02:35:39", p.displayDate());
    }
}
