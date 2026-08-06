package core.utils.common.helpers;

import lombok.Data;

@Data
public class CustomException extends Exception {
    private Object object;

    public CustomException() {
        super();
    }

    public CustomException(String s) {
        super(s, new Throwable(s), false, false);
    }

    public CustomException(String s, Throwable throwable) {
        super(s, throwable, false, false);
    }

    public CustomException(Throwable throwable) {
        super(throwable.getMessage(), throwable, false, false);
    }

    public CustomException(String s, Throwable throwable, boolean b, boolean b1) {
        super(s, throwable, b, b1);
    }

    public CustomException(String s, Object object, Throwable throwable) {
        super(s, throwable != null ? throwable : new Throwable(s));
        throwable.printStackTrace();
        this.object = object;
    }

    public CustomException(String s, Object object, Throwable throwable, boolean b) {
        super(s, throwable != null ? throwable : new Throwable(s));
        if (b) {
            throwable.printStackTrace();
        }
        this.object = object;
    }
}
