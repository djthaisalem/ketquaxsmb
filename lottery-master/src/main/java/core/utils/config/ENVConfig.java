package core.utils.config;


import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;


@Component
@RequiredArgsConstructor
public class ENVConfig {
    public static final String LOCAL = "local";
    public static final String DEV = "dev";
    public static final String STG = "stg";

    private final Environment env;

    public String getStringProperty(String key) {
        String result = env.getProperty(key);
        return result == null ? key : result;
    }

    public String getStringProperty(String key, String defaultValue) {
        return env.getProperty(key, defaultValue);
    }

    public String getActiveProfiles() {
        return Arrays.stream(env.getActiveProfiles()).findFirst().orElse("stg");
    }
}
