package core.utils.common.enumeration;

import java.util.Arrays;
import java.util.List;

public class FieldProjectionEnum {

    public static final List<String> REPORT_BY_PRICE = Arrays.asList("_id", "date_string", "date", "all",
            "short_db", "short_1", "short_21", "short_22","short_31", "short_32", "short_33", "short_34", "short_35", "short_36",
            "short_41", "short_42", "short_43","short_44", "short_51", "short_52","short_53", "short_54", "short_55", "short_56",
            "short_61", "short_62", "short_63","short_71", "short_72", "short_73", "short_74");
    public static final List<String> ALL_ONLY = Arrays.asList("_id", "date_string", "date", "all");
    public static final List<String> REPORT_BY_MISS = Arrays.asList("_id", "date_string", "date", "all", "miss_heads", "miss_tails");

}
