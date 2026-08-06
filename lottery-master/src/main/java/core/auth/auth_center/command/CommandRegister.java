package core.auth.auth_center.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommandRegister {
    private String phone;
    private String business_type;
    private String password;
    private String re_password;
    private String email;
    private String name;
}
