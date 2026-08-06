package core.auth.user;

import core.auth.user.command.CommandUser;
import core.utils.common.enumeration.CommonConstant;
import core.utils.common.enumeration.MongoEnum;
import core.utils.common.helpers.CommonUtils;
import core.utils.common.helpers.DateTimeUtils;
import core.utils.common.helpers.SHA512;
import core.utils.common.models.Reference;
import core.utils.config.ENVConfig;
import core.utils.config.mongodb.MongoDBConnector;
import core.utils.config.mongodb.MongoDBOperator;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
public class UserApplication {
    private final MongoDBOperator<User> mongoDBOperator;

    public UserApplication(ENVConfig applicationConfig) {
        mongoDBOperator = new MongoDBConnector<>(
                applicationConfig.getStringProperty("mongodb_connection.lottery"),
                MongoEnum.Database.ADMIN, MongoEnum.Collection.USER, User.class
        );
    }

    public Optional<User> add(CommandUser command) {
        if (StringUtils.isAnyBlank(command.getPhone(), command.getPassword())) {
            return Optional.empty();
        }

        // hash password
        String hash_pass = SHA512.valueOf(command.getPassword());

        User user = User.builder()
                .phone(command.getPhone())
                .password(hash_pass)
                .business_type(command.getBusiness_type())
                .is_active(true)
                .email(command.getEmail())
                .name(command.getName())
                .build();
        this.setDefaultData(user);
        return Optional.ofNullable(mongoDBOperator.insert(user));
    }

    public Optional<User> getByPhone(String phone, String business_type) {
        if (StringUtils.isAnyBlank(phone, business_type)) {
            return Optional.empty();
        }

        Map<String, Object> query = new HashMap<>();
        query.put("phone", phone);
        query.put("business_type", business_type);

        return Optional.ofNullable(mongoDBOperator.getOne(query));
    }

    // helpers
    public void setDefaultData(User data) {
        Long current = DateTimeUtils.getCurrentTimeWithZeroSecondAndMilis();
        if (data.getCreated_date() == null) {
            data.setCreated_date(current);
        }
        if (data.getLast_updated_date() == null) {
            data.setLast_updated_date(current);
        }
        Reference ref = Reference.builder()
                .type(CommonConstant.ReferenceType.SYSTEM)
                .build();
        if (data.getLast_updated_by() == null) {
            data.setLast_updated_by(ref);
        }
        if (data.getCreated_by() == null) {
            data.setCreated_by(ref);
        }
        data.setKeyword(CommonUtils.formatKeywords(Arrays.asList(data.getName(), data.getEmail(), data.getPhone())));
    }
}
