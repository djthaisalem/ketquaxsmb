package core.auth.auth_center.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CommandLogin {
    private String phone;
    private String password;
    private String business_type;
}
