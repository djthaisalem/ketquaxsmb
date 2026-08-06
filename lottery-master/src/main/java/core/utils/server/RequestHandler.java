package core.utils.server;

import io.vertx.core.Handler;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.RoutingContext;

public interface RequestHandler {
    Boolean isEnableAuthentication();

    Handler<RoutingContext> handle();

    String getPath();

    HttpMethod getMethod();

    static RequestHandler init(HttpMethod httpMethod, String path, Handler<RoutingContext> handler, Boolean isEnableAuthentication, int... arguments) {
        return new RequestHandler() {
            @Override
            public HttpMethod getMethod() {
                return httpMethod;
            }

            @Override
            public String getPath() {
                return path;
            }

            @Override
            public Handler<RoutingContext> handle() {
                return handler;
            }

            @Override
            public Boolean isEnableAuthentication() {
                return isEnableAuthentication;
            }

        };
    }
}
