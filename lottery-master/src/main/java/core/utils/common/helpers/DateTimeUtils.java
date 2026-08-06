package core.utils.common.helpers;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Component
public class DateTimeUtils {

    private static final AESUtils aesUtils = new AESUtils();


    public static Long getCurrentTimeWithZeroSecondAndMilis() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }


    // HH:mm dd/MM/yyyy
    public static Boolean checkValidDateTime(String date_string) {
        try {
            if (StringUtils.isBlank(date_string)) {
                return false;
            }

            List<String> split = Arrays.asList(date_string.split(" "));
            if (split.size() != 2) {
                return false;
            }

            return (checkValidTime(split.get(0)) && checkValidDate(split.get(1)));
        } catch (Exception e) {
            return false;
        }
    }

    // dd/MM/yyyy
    public static Boolean checkValidDate(String date_string) {
        try {
            if (StringUtils.isBlank(date_string)) {
                return false;
            }

            List<String> split = Arrays.asList(date_string.split("/"));
            if (split.size() != 3) {
                return false;
            }

            if (split.get(0).length() != 2 || StringUtils.trim(split.get(0)).length() != 2) {
                return false;
            }
            int day = Integer.parseInt(split.get(0));
            if (day < 0 || day > 31) {
                return false;
            }

            if (split.get(1).length() != 2 || StringUtils.trim(split.get(1)).length() != 2) {
                return false;
            }
            int month = Integer.parseInt(split.get(1));
            if (month < 0 || month > 12) {
                return false;
            }

            if (split.get(2).length() != 4 || StringUtils.trim(split.get(2)).length() != 4) {
                return false;
            }
            int year = Integer.parseInt(StringUtils.trim(split.get(2)));

        } catch (Exception e) {
            return false;
        }
        return true;
    }

    public static Boolean checkValidTime(String date_string) {
        try {
            if (StringUtils.isBlank(date_string)) {
                return false;
            }

            List<String> split = Arrays.asList(date_string.split(":"));
            if (split.size() != 2) {
                return false;
            }

            if (split.get(0).length() != 2 || StringUtils.trim(split.get(0)).length() != 2) {
                return false;
            }
            int hour = Integer.parseInt(split.get(0));
            if (hour < 0 || hour > 23) {
                return false;
            }

            if (split.get(1).length() != 2 || StringUtils.trim(split.get(1)).length() != 2) {
                return false;
            }
            int minute = Integer.parseInt(split.get(1));
            if (minute < 0 || minute > 59) {
                return false;
            }
        } catch (Exception e) {
            return false;
        }
        return true;
    }

    public static String convertLongToDate(String pattern, Long time) {
        String result = null;
        try {
            Date date = new Date(time);
            result = new SimpleDateFormat(pattern).format(date);
        } catch (Exception e) {
        }
        return result;
    }

    public static Long convertDateStringToLong(String dateString, String pattern) {
        Long result = null;
        try {
            Date date = new SimpleDateFormat(pattern).parse(dateString);
            result = date.getTime();
        } catch (Exception e) {
        }
        return result;
    }

}
