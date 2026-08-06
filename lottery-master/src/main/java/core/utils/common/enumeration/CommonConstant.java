package core.utils.common.enumeration;

import java.util.Arrays;
import java.util.List;

public class CommonConstant {

    public static class CommonField {
        public static String CREATED_DATE = "created_date";
        public static String LAST_UPDATED_DATE = "last_updated_date";
        public static String CREATED_BY = "created_by";
        public static String LAST_UPDATED_BY = "last_updated_by";
        public static String IS_DELETED = "is_deleted";
        public static String _ID = "_id";
        public static String KEYWORD = "keyword";
        public static String NAME = "name";
    }

    public class ReferenceType {
        public static final String USER = "user";
        public static final String SYSTEM = "system";
    }

    public class ReportEnum {
        public static final String HEAD = "head";
        public static final String TAIL = "tail";
        public static final String DOUBLE = "double";
        public static final String TRIPLE = "triple";
    }

    public static final List<String> ZeroToNine = Arrays.asList("0", "1", "2", "3", "4", "5", "6", "7", "8", "9");
    public static final List<String> ZeroToNineTyNine = Arrays.asList(
            "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
            "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
            "20", "21", "22", "23", "24", "25", "26", "27", "28", "29",
            "30", "31", "32", "33", "34", "35", "36", "37", "38", "39",
            "40", "41", "42", "43", "44", "45", "46", "47", "48", "49",
            "50", "51", "52", "53", "54", "55", "56", "57", "58", "59",
            "60", "61", "62", "63", "64", "65", "66", "67", "68", "69",
            "70", "71", "72", "73", "74", "75", "76", "77", "78", "79",
            "80", "81", "82", "83", "84", "85", "86", "87", "88", "89",
            "90", "91", "92", "93", "94", "95", "96", "97", "98", "99");

    public static final String CRAWL_URL = "https://crawl-xsmb-572e0fe177dd.herokuapp.com/api/lottery/get/by_date?date={{date}}";
}
