package com.fertipredict.app.MLClient;

public class MLServiceException extends RuntimeException {
    public final int status;
    public final String code;
    public final String reference;
    public MLServiceException(int status, String code, String message, Integer upstreamStatus) {
        super(message);
        this.status = status;
        this.code = code;
        this.reference = java.util.UUID.randomUUID().toString();
        org.slf4j.LoggerFactory.getLogger(MLServiceException.class)
            .error("ML failure reference={} code={} upstreamStatus={}", reference, code, upstreamStatus);
    }
}
