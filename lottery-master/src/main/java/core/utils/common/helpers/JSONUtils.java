package core.utils.common.helpers;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.*;
import com.google.gson.reflect.TypeToken;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class JSONUtils {
    private static final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .enable(JsonParser.Feature.ALLOW_SINGLE_QUOTES);
    private static final Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ssZ")
            .registerTypeAdapter(ObjectId.class, (JsonSerializer<ObjectId>) (src, typeOfSrc, context) -> new JsonPrimitive(src.toHexString()))
            .registerTypeAdapter(ObjectId.class, (JsonDeserializer<ObjectId>) (json, typeOfT, context) -> new ObjectId(json.getAsString()))
            .create();

    public static <T> T toObject(String json, Class<T> clazz) {
        return JSON.parseObject(json, clazz);
    }

    public static <T> String toJSON(T obj) {
        return JSON.toJSONString(obj);
    }

    public static JSONObject fastJsonToObject(String json) {
        return JSON.parseObject(json);
    }

    public static String objectToJson(Object obj) {
        try {
            objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
            return new String(objectMapper.writeValueAsBytes(obj), StandardCharsets.UTF_8);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return "";
    }

    public static <T> T jsonToObject(String JSON, Class<T> clazz) {
        try {
            if (StringUtils.isNotBlank(JSON)) {
                return objectMapper.readValue(JSON, clazz);
            }
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static <T> List<T> jsonToListObject(String JSON, Class<T> clazz) {
        try {
            if (StringUtils.isNotBlank(JSON)) {
                JavaType itemType = objectMapper.getTypeFactory().constructCollectionType(List.class, clazz);
                return objectMapper.readValue(JSON, itemType);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        return new ArrayList<>();
    }

    public static Map<String, Object> objectToMap(Object obj) {
        TypeReference<HashMap<String, Object>> typeRef = new TypeReference<HashMap<String, Object>>() {
        };
        return objectMapper.convertValue(obj, typeRef);
    }

    public static Map<String, Object> stringToMap(String str) {
        try {
            return objectMapper.readValue(str, HashMap.class);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return null;
    }

    // GSON
    public static <T> String gsonToJSON(T obj) {
        return gson.toJson(obj);
    }

    public static <T> T gsonToObject(String json, Class<T> clazz) {
        return gson.fromJson(json, clazz);
    }

    public static <T> List<T> gsonToListObject(String json, Class<T> clazz) {
        Type typeOfT = TypeToken.getParameterized(List.class, clazz).getType();
        return gson.fromJson(json, typeOfT);
    }

}
