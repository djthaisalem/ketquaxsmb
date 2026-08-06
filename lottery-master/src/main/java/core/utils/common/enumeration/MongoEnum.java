package core.utils.common.enumeration;

public class MongoEnum {
    public static class Database {
        public static String LOTTERY = "lottery";
        public static String ADMIN = "admin";
    }

    public static class Collection {
        public static String LOTTERY = "lottery";
        public static String USER = "user";
    }

    public static class Operator {
        public static String IN = "$in";
        public static String NIN = "$nin";
        public static String SET = "$set";
        public static String LTE = "$lte";
        public static String LT = "$lt";
    }
}
