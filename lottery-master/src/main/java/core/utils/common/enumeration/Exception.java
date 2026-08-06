package core.utils.common.enumeration;

public class Exception extends Throwable {
    // check request data
    public static String REQUEST_BODY_REQUIRED = "request_body_required";
    public static String ID_REQUIRED_ON_URL = "id_required_on_url";
    public static String INVALID_DATA = "invalid_data";
    public static String MISSING_DATA = "missing_data";
    public static String DATE_FORMAT_NOT_CORRECT = "date_format_not_correct";
    public static String MISSING_UPLOAD_FILE = "missing_upload_file";
    public static String NOT_SUPPORT_FILE_TYPE = "not_support_file_type";

    // login code
    public static String AUTH_INVALID = "auth_invalid";
    public static String USER_EXIST = "user_exist";
    public static String RE_PASS_NOT_MATCH = "re_pass_not_match";

    // common
    public static String ITEM_EXIST = "item_exist";


}
