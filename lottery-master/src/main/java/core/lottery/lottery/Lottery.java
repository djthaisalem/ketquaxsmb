package core.lottery.lottery;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import core.utils.common.models.Reference;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;

import javax.persistence.Entity;
import javax.persistence.Id;
import java.io.Serializable;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class Lottery implements Serializable {
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
    private String date_string;
    private Long date;

    // raw
    private String price_db;
    private String price_1;
    private String price_21;
    private String price_22;
    private String price_31;
    private String price_32;
    private String price_33;
    private String price_34;
    private String price_35;
    private String price_36;
    private String price_41;
    private String price_42;
    private String price_43;
    private String price_44;
    private String price_51;
    private String price_52;
    private String price_53;
    private String price_54;
    private String price_55;
    private String price_56;
    private String price_61;
    private String price_62;
    private String price_63;
    private String price_71;
    private String price_72;
    private String price_73;
    private String price_74;

    // 2 số cuối
    private String short_db;
    private String short_1;
    private String short_21;
    private String short_22;
    private String short_31;
    private String short_32;
    private String short_33;
    private String short_34;
    private String short_35;
    private String short_36;
    private String short_41;
    private String short_42;
    private String short_43;
    private String short_44;
    private String short_51;
    private String short_52;
    private String short_53;
    private String short_54;
    private String short_55;
    private String short_56;
    private String short_61;
    private String short_62;
    private String short_63;
    private String short_71;
    private String short_72;
    private String short_73;
    private String short_74;

    // list
    private List<String> all;
    private List<String> all_db;
    private List<String> all_1;
    private List<String> all_2;
    private List<String> all_3;
    private List<String> all_4;
    private List<String> all_5;
    private List<String> all_6;
    private List<String> all_7;

    private List<String> heads;
    private List<String> miss_heads;
    private List<String> tails;
    private List<String> miss_tails;

}
