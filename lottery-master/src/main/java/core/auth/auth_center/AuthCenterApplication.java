package core.auth.auth_center;

import core.auth.auth_center.command.CommandLogin;
import core.auth.auth_center.command.CommandRegister;
import core.auth.auth_center.models.ResponseLogin;
import core.auth.user.User;
import core.auth.user.UserApplication;
import core.auth.user.command.CommandUser;
import core.utils.common.enumeration.Exception;
import core.utils.common.helpers.CustomException;
import core.utils.common.helpers.SHA512;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AuthCenterApplication {

    @Autowired
    private UserApplication userApplication;
    @Autowired
    private LotteryAuthCenter lotteryAuthCenter;

    public Optional<ResponseLogin> login(CommandLogin command) throws CustomException {
        if (StringUtils.isAnyBlank(command.getPhone(), command.getPassword(), command.getBusiness_type())) {
            throw new CustomException(Exception.AUTH_INVALID);
        }

        User user = userApplication.getByPhone(command.getPhone(), command.getBusiness_type()).orElse(null);
        if (user == null) {
            throw new CustomException(Exception.AUTH_INVALID);
        }
        String hash = SHA512.valueOf(command.getPassword());
        if (!hash.equals(user.getPassword())) {
            throw new CustomException(Exception.AUTH_INVALID);
        }

        // generate token
        return lotteryAuthCenter.createLoginToken(user);
    }

    public Optional<ResponseLogin> register(CommandRegister command) throws CustomException {
        if (StringUtils.isAnyBlank(command.getPhone(), command.getPassword(), command.getRe_password(), command.getBusiness_type())) {
            throw new CustomException(Exception.INVALID_DATA);
        }

        if (!command.getPassword().equals(command.getRe_password())) {
            throw new CustomException(Exception.RE_PASS_NOT_MATCH);
        }

        User user = userApplication.getByPhone(command.getPhone(), command.getBusiness_type()).orElse(null);
        if (user != null) {
            throw new CustomException(Exception.USER_EXIST);
        }

        CommandUser command_add_user = CommandUser.builder()
                .phone(command.getPhone())
                .password(command.getPassword())
                .business_type(command.getBusiness_type())
                .email(command.getEmail())
                .name(command.getName())
                .build();
        user = userApplication.add(command_add_user).orElse(null);
        // generate token
        return lotteryAuthCenter.createLoginToken(user);
    }
}
