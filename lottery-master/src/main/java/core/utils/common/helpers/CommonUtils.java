package core.utils.common.helpers;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.BeanDescription;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationConfig;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.BeanPropertyWriter;
import com.fasterxml.jackson.databind.ser.BeanSerializerModifier;
import core.utils.common.models.FilterRange;
import core.utils.common.models.Sort;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import core.utils.common.anotation.TransField;
import core.utils.common.enumeration.CommonConstant;
import core.utils.common.enumeration.MongoEnum;
import core.utils.config.mongodb.MongoDBOperator;

import java.lang.reflect.Field;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class CommonUtils {

    private static final AESUtils aesUtils = new AESUtils();

    //
    // build common query
    //
    public static Map<String, Object> buildSort(List<Sort> sorts) {
        Map<String, Object> sort = new HashMap<>();
        if (CollectionUtils.isNotEmpty(sorts)) {
            for (Sort s : sorts) {
                sort.put(s.getField(), BooleanUtils.isTrue(s.getIs_asc()) ? 1 : -1);
            }
            return sort;
        }
        // mặc định
        sort.put("_id", -1);
        return sort;
    }

    public static void buildRangeFilters(Map<String, Object> query, List<FilterRange> ranges) {
        if (CollectionUtils.isNotEmpty(ranges)) {
            for (FilterRange range : ranges) {
                if (StringUtils.isBlank(range.getField())) {
                    continue;
                }
                if (range.getFrom() != null) {
                    query.put(range.getField(), new Document("$gte", range.getFrom()));
                }
                if (range.getTo() != null) {
                    query.put(range.getField(), new Document("$lte", range.getTo()));
                }
            }
        }
    }

    public static void buildKeywordQuery(Map<String, Object> query, String keyword, String field) {

        if (query == null || StringUtils.isBlank(keyword)) {
            return;
        }

        if (StringUtils.isBlank(field)) {
            field = CommonConstant.CommonField.KEYWORD;
        }

        Document regex = new Document("$regex", Pattern.compile(keyword, Pattern.CASE_INSENSITIVE));
        query.put(field, regex);
    }

    public static void buildIncludeIdsQuery(Map<String, Object> query, List<String> ids) {
        if (query == null || CollectionUtils.isEmpty(ids)) {
            return;
        }

        query.put(CommonConstant.CommonField._ID, new Document(MongoEnum.Operator.IN, ids.stream().map(ObjectId::new).collect(Collectors.toList())));
    }

    public static void buildInListIdsQuery(Map<String, Object> query, List<String> ids, String field) {
        if (query == null || CollectionUtils.isEmpty(ids) || StringUtils.isBlank(field)) {
            return;
        }

        query.put(field, new Document(MongoEnum.Operator.IN, ids));
    }

    public static void buildExcludeIdsQuery(Map<String, Object> query, List<String> ids) {
        if (query == null || CollectionUtils.isEmpty(ids)) {
            return;
        }

        query.put(CommonConstant.CommonField._ID, new Document(MongoEnum.Operator.NIN, ids.stream().map(ObjectId::new).collect(Collectors.toList())));
    }

    public static Map<String, Object> buildFieldsProjections(List<String> fields) {
        Map<String, Object> projections = new HashMap<>();
        if (CollectionUtils.isNotEmpty(fields)) {
            for (String field : fields) {
                projections.put(field, 1);
            }
        }
        return projections;
    }

    public static String formatKeywords(List<String> keywords) {
        if (CollectionUtils.isNotEmpty(keywords)) {
            keywords = keywords.stream().filter(StringUtils::isNotBlank)
                    .map(ele -> StringUtils.stripAccents(StringUtils.lowerCase(ele)))
                    .collect(Collectors.toList());
            return StringUtils.join(keywords, "/");
        }
        return "";
    }

    public static String formatKeyword(String keyword) {
        if (StringUtils.isNotBlank(keyword)) {
            return StringUtils.stripAccents(StringUtils.lowerCase(keyword));
        }
        return "";
    }

    public static Boolean checkExistByName(String value, String field, MongoDBOperator mongoDBOperator) {
        Map<String, Object> query = new HashMap<>();
        buildKeywordQuery(query, value, field);
        Long count = mongoDBOperator.count(new Document(query));
        if (count > 0) {
            return true;
        }

        return false;
    }

    public static String getLastCharacterOfString(String value, Integer number) {
        if (StringUtils.isBlank(value)) {
            return "";
        }
        if (number == null) {
            number = 1;
        }

        if (number >= value.length()) {
            return value;
        }

        return value.substring(value.length() - number);
    }
    //
    // End build common query
    //

    //
    // Build update data
    //
    private static class Custom2BeanSerializerModifier extends BeanSerializerModifier {
        @Override
        public List<BeanPropertyWriter> changeProperties(SerializationConfig config, BeanDescription beanDesc, List<BeanPropertyWriter> beanProperties) {
            return beanProperties.stream().filter(property -> property.getAnnotation(TransField.class) == null).collect(Collectors.toList());
        }
    }

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .registerModule(new SimpleModule() {
                @Override
                public void setupModule(SetupContext context) {
                    super.setupModule(context);
                    context.addBeanSerializerModifier(new Custom2BeanSerializerModifier());
                }
            });

    private static final ObjectMapper objectMapperNonNull = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL)
            .registerModule(new SimpleModule() {
                @Override
                public void setupModule(SetupContext context) {
                    super.setupModule(context);
                    context.addBeanSerializerModifier(new Custom2BeanSerializerModifier());
                }
            });

    public static Document buildUpdateData(@NonNull Object object) {
        TypeReference<HashMap<String, Object>> typeRef = new TypeReference<HashMap<String, Object>>() {
        };
        Map<String, Object> data = objectMapper.convertValue(object, typeRef);
        Document query_item = new Document();
        query_item.putAll(data);
        query_item.remove("_id");
        return query_item;
    }

    public static Document buildUpdateDataNonNull(@NonNull Object object) {
        TypeReference<HashMap<String, Object>> typeRef = new TypeReference<HashMap<String, Object>>() {
        };
        Map<String, Object> data = objectMapperNonNull.convertValue(object, typeRef);
        Document query_item = new Document();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            Object value = entry.getValue();
            try {
                if (entry.getKey() != null) {
                    Field field = object.getClass().getDeclaredField(entry.getKey());
                    if (field.getType().equals(ObjectId.class)) {
                        value = new ObjectId(entry.getValue().toString());
                    }
                }
            } catch (NoSuchFieldException e) {
                e.printStackTrace();
            }
            query_item.put(entry.getKey(), value);
        }
        query_item.remove("_id");
        return query_item;
    }
    //
    // End build update data
    //

    private static void createCombinations(List<String> origins, int k, int index, List<String> combination, List<List<String>> combinations) {
        if (k == 0) {
            combinations.add(combination);
            return;
        }

        for (int i = index; i <= origins.size() - k; i++) {
            List<String> new_combination;
            if (i == origins.size() - k) {
                new_combination = combination;
            } else {
                new_combination = new ArrayList<>(combination);
            }
            new_combination.add(origins.get(i));
            createCombinations(origins, k - 1, i + 1, new_combination, combinations);
        }
    }

    public static List<List<String>> getAllCombinations(List<String> origins, int k) {
        List<List<String>> combinations = new ArrayList<>();
        createCombinations(origins, k, 0, new ArrayList<>() , combinations);
        return combinations;
    }
}
