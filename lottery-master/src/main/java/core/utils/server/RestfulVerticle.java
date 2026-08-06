package core.utils.server;

import core.auth.auth_center.LotteryAuthCenter;
import core.utils.common.enumeration.TimeEnum;
import core.utils.config.ENVConfig;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.http.HttpMethod;
import io.vertx.ext.web.Router;
import io.vertx.ext.web.handler.BodyHandler;
import io.vertx.ext.web.handler.CorsHandler;
import io.vertx.ext.web.handler.TimeoutHandler;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.BooleanUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RestfulVerticle extends AbstractVerticle {
    private List<RequestHandler> requestHandlers = new ArrayList<>();
    private static final long BODY_LIMIT = 50 * 1024 * 1024; // 50 MB

    protected final ENVConfig applicationConfig;
    private final LotteryAuthCenter lotteryAuthCenter;

    private void configureRoutes(Router router) {
        this.requestHandlers.forEach(requestHandler -> {
            if (BooleanUtils.isTrue(requestHandler.isEnableAuthentication())) {
                router.route(requestHandler.getPath()).blockingHandler(lotteryAuthCenter).blockingHandler(requestHandler.handle());
            } else {
                router.route(requestHandler.getPath()).handler(requestHandler.handle());
            }
        });
    }

    @Override
    public void start() {
        Router router = Router.router(vertx);
        router.route().handler(TimeoutHandler.create(TimeEnum.MILLISECOND_OF_FIVE_MINUTE));
        router.route().handler(BodyHandler.create()
                .setDeleteUploadedFilesOnEnd(true)
                .setBodyLimit(BODY_LIMIT)
                .setUploadsDirectory(applicationConfig.getStringProperty("application.upload.directory", "/root/tmp/")));
        router.route().handler(CorsHandler.create("*")
                .allowedMethod(HttpMethod.GET)
                .allowedMethod(HttpMethod.POST)
                .allowedMethod(HttpMethod.HEAD)
                .allowedMethod(HttpMethod.PUT)
                .allowedMethod(HttpMethod.DELETE)
                .allowedMethod(HttpMethod.PATCH)
                .allowedMethod(HttpMethod.OPTIONS)
                .allowedHeader("Access-Control-Allow-Methods")
                .allowedHeader("Access-Control-Allow-Origin")
                .allowedHeader("Access-Control-Allow-Credentials")
                .allowedHeader("Access-Control-Allow-Headers")
                .allowedHeader("Content-Type")
                .allowedHeader("Authorization")
                .allowedHeader("Cache-Control")
                .allowedHeader("X-Requested-With")
                .allowedHeader("Accept")
                .allowedHeader("Origin"));
        configureRoutes(router);
        vertx.createHttpServer().requestHandler(router).connectionHandler(conn -> {
            conn.exceptionHandler(err -> {
            });
        }).exceptionHandler(err -> {
        }).listen(Integer.parseInt(System.getenv("PORT") != null ? System.getenv("PORT") : "8080"), "0.0.0.0");
    }

    public void setRequestHandlers(List<RequestHandler> requestHandlers) {
        this.requestHandlers = requestHandlers;
    }

}
