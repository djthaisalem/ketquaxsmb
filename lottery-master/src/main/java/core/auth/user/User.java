package core.auth.user;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import core.utils.common.models.Reference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.mongojack.Id;

import javax.persistence.Entity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class User {
    // common
    @JsonSerialize(using = ToStringSerializer.class)
    @Id
    ObjectId _id;
    private Long created_date;
    private Long last_updated_date;
    private Reference created_by;
    private Reference last_updated_by;
    @Builder.Default
    private Boolean is_deleted = false;

    // speciality
    // login
    private String phone;
    private String password;
    private String business_type;
    private Boolean is_active;

    // info
    private String email;
    private String name;
    private String keyword; // for search


}
