package core.auth.user.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommandUser {
    // login
    private String phone;
    private String password;
    private String business_type;
    private Boolean is_active;

    // info
    private String email;
    private String name;
}
