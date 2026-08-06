package core.utils.common.helpers;

import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class RandomUtils {
    public static final String NUM = "num";
    public static final String CHAR = "char";
    public static final String CHAR_LOW = "char_low";
    public static final String MIX = "mix";
    public static final String MIX_UPPER = "mix_upper";

    public String randomString(String type, int length) {
        String nums = "0123456789";
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        String mixs = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        String mixUpper = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
        String charLows = "abcdefghiklmnopqrstuvwxyz";
        StringBuilder randomString = new StringBuilder();
        Random r = new Random();
        switch (type) {
            case NUM:
                for (int i = 0; i < length; i++) {
                    randomString.append(nums.charAt(r.nextInt(nums.length())));
                }
                break;
            case CHAR:
                for (int i = 0; i < length; i++) {
                    randomString.append(chars.charAt(r.nextInt(chars.length())));
                }
                break;
            case CHAR_LOW:
                for (int i = 0; i < length; i++) {
                    randomString.append(charLows.charAt(r.nextInt(charLows.length())));
                }
                break;
            case MIX:
                for (int i = 0; i < length; i++) {
                    randomString.append(mixs.charAt(r.nextInt(mixs.length())));
                }
                break;
            case MIX_UPPER:
                for (int i = 0; i < length; i++) {
                    randomString.append(mixUpper.charAt(r.nextInt(mixUpper.length())));
                }
                break;
            default:
                break;
        }
        return randomString.toString();
    }
}
