package core.utils.common.helpers;

import org.springframework.stereotype.Component;

import javax.crypto.*;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import javax.xml.bind.DatatypeConverter;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.KeySpec;
import java.util.Objects;

/**
 * Encryption and Decryption using AES 256 Algorithm
 *
 */
@Component
public class AESUtils {

    public enum DataType {
        HEX,
        BASE64
    }

    private static final String CIPHER_ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String SECRET_KEY_ALGORITHM = "PBKDF2WithHmacSHA1";
    private static final String KEY_ALGORITHM = "AES";
    private static final String PASS_PHRASE = "@sfhsdifh@#1";

    private final int IV_SIZE = 128;
    private int iterationCount = 1989;
    private int keySize = 256;
    private int saltLength = 64;
    private int ivLength = 32;
    private final DataType dataType = DataType.BASE64;

    private Cipher cipher;

    public void AESUtil() {
        try {
            cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            saltLength = this.keySize / 4;
        } catch (NoSuchPaddingException | NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
    }

    public void AESUtil(int keySize, int iterationCount) {
        this.keySize = keySize;
        this.iterationCount = iterationCount;
        try {
            cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            saltLength = this.keySize / 4;
        } catch (NoSuchPaddingException | NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
    }

    public String encrypt(String salt, String iv, String passPhrase, String plainText) {
        try {
            SecretKey secretKey = generateKey(salt, passPhrase);
            byte[] encrypted = doFinal(Cipher.ENCRYPT_MODE, secretKey, iv, plainText.getBytes(StandardCharsets.UTF_8));
            String cipherText;

            if (dataType.equals(DataType.HEX)) {
                cipherText = toHex(encrypted);
            } else {
                cipherText = toBase64(encrypted);
            }
            return cipherText;
        } catch (Exception e) {
            return null;
        }
    }

    public String encrypt(String plainText) {
        try {
            String salt = toHex(generateRandom(saltLength / 2));
            String iv = toHex(generateRandom(ivLength / 2));
            String cipherText = encrypt(salt, iv, PASS_PHRASE, plainText);
            return salt + iv + cipherText;
        } catch (Exception e) {
            return null;
        }
    }

    public String decrypt(String salt, String iv, String cipherText) {
        try {
            SecretKey key = generateKey(salt, PASS_PHRASE);
            byte[] encrypted;
            if (dataType.equals(DataType.HEX)) {
                encrypted = fromHex(cipherText);
            } else {
                encrypted = fromBase64(cipherText);
            }
            byte[] decrypted = doFinal(Cipher.DECRYPT_MODE, key, iv, encrypted);
            return new String(Objects.requireNonNull(decrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    public String decrypt(String cipherText) {
        try {
            String salt = cipherText.substring(0, saltLength);
            String iv = cipherText.substring(saltLength, saltLength + ivLength);
            String ct = cipherText.substring(saltLength + ivLength);
            return decrypt(salt, iv, ct);
        } catch (Exception e) {
            return null;
        }
    }

    private SecretKey generateKey(String salt, String passPhrase) {
        try {
            SecretKeyFactory secretKeyFactory = SecretKeyFactory.getInstance(SECRET_KEY_ALGORITHM);
            KeySpec keySpec = new PBEKeySpec(passPhrase.toCharArray(), fromHex(salt), iterationCount, keySize);
            return new SecretKeySpec(secretKeyFactory.generateSecret(keySpec).getEncoded(), KEY_ALGORITHM);
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            e.printStackTrace();
        }
        return null;
    }

    private static byte[] fromBase64(String str) {
        return DatatypeConverter.parseBase64Binary(str);
    }

    private static String toBase64(byte[] ba) {
        return DatatypeConverter.printBase64Binary(ba);
    }

    private static byte[] fromHex(String str) {
        return DatatypeConverter.parseHexBinary(str);
    }

    private static String toHex(byte[] ba) {
        return DatatypeConverter.printHexBinary(ba);
    }

    private byte[] doFinal(int mode, SecretKey secretKey, String iv, byte[] bytes) {
        try {
            cipher = Cipher.getInstance(CIPHER_ALGORITHM);
            cipher.init(mode, secretKey, new IvParameterSpec(fromHex(iv)));
            return cipher.doFinal(bytes);
        } catch (InvalidAlgorithmParameterException | IllegalBlockSizeException | BadPaddingException | InvalidKeyException | NoSuchPaddingException | NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return null;
    }

    private static byte[] generateRandom(int length) {
        SecureRandom random = new SecureRandom();
        byte[] randomBytes = new byte[length];
        random.nextBytes(randomBytes);
        return randomBytes;
    }

}