package core.auth.auth_center;

import core.auth.auth_center.models.ResponseLogin;
import core.auth.user.User;
import core.utils.common.enumeration.UserEnum;
import core.utils.common.helpers.AESUtils;
import io.vertx.core.Handler;
import io.vertx.core.Vertx;
import io.vertx.core.http.HttpHeaders;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.auth.JWTOptions;
import io.vertx.ext.auth.authentication.TokenCredentials;
import io.vertx.ext.auth.jwt.JWTAuthOptions;
import io.vertx.ext.auth.jwt.impl.JWTAuthProviderImpl;
import io.vertx.ext.web.RoutingContext;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class LotteryAuthCenter implements Handler<RoutingContext> {

    private final JWTAuthProviderImpl jwtAuth = new JWTAuthProviderImpl(Vertx.vertx(), new JWTAuthOptions());

    @Autowired
    private AESUtils aesUtils;

    @Override
    public void handle(RoutingContext routingContext) {
        HttpServerRequest request = routingContext.request();
        request.pause();

        String authorization = request.headers().get(HttpHeaders.AUTHORIZATION);
        String decrypt = aesUtils.decrypt(authorization);
        if (StringUtils.isBlank(decrypt)) {
            routingContext.fail(401);
            return;
        }

        String[] parts = decrypt.split(" ");
        String token = parts[1];
        if (parts.length != 2) {
            routingContext.fail(401);
            return;
        }
        String scheme = parts[0];
        if (!"bearer".equalsIgnoreCase(scheme)) {
            routingContext.fail(401);
            return;
        }
        TokenCredentials credentials = new TokenCredentials(token);
        jwtAuth.authenticate(credentials, res -> {
            if (res.succeeded()) {
                try {
                    JsonObject jsonObject = res.result().principal();
                    String user_id = jsonObject.getString("user_id");
                    String businessType = jsonObject.getString("business_type");

                    // check role
                    routingContext.setUser(res.result());
                } catch (Throwable e) {
                    e.printStackTrace();
                } finally {
                    request.resume();
                    routingContext.next();
                }
            } else {
                routingContext.fail(401);
            }
        });
    }

    public Optional<ResponseLogin> createLoginToken(User user) {
        if (user == null) {
            return Optional.empty();
        }
        try {
            Long current_second = System.currentTimeMillis() / 1000;
            Long exp = current_second + UserEnum.TOKEN_EXPIRED_TIME;
            JsonObject token_obj = new JsonObject()
                    .put("id", user.get_id().toHexString())
                    .put("business_type", user.getBusiness_type())
                    .put("name", user.getName())
                    .put("email", user.getEmail())
                    .put("exp", exp)
                    .put("iat", current_second);
            String token = jwtAuth.generateToken(token_obj, new JWTOptions().setAlgorithm("RS256"));

            if (StringUtils.isNotBlank(token)) {
                return Optional.ofNullable(ResponseLogin.builder()
                        .access_token(token)
                        .build());
            }
        } catch (Throwable throwable) {
            throwable.printStackTrace();
        }

        return Optional.empty();
    }
}
