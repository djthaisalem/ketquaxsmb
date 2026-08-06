package lottery;

import core.lottery.lottery.LotteryApplication;
import core.utils.server.RequestHandler;
import core.utils.server.RestfulVerticle;
import io.vertx.core.AbstractVerticle;
import io.vertx.core.DeploymentOptions;
import io.vertx.core.Vertx;
import io.vertx.core.VertxOptions;
import lombok.RequiredArgsConstructor;
import lottery.request_handers.LotteryRequestHandler;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@SpringBootApplication
@ComponentScan({"lottery", "utils", "core", "common"})
@RequiredArgsConstructor
public class Application extends AbstractVerticle {
    private final RestfulVerticle restfulVerticle;
    private final LotteryRequestHandler lotteryRequestHandler;
    private final LotteryApplication lotteryApplication;
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @PostConstruct
    public void deployServerVerticle() {
        List<RequestHandler> request_handlers = new ArrayList<>();
        request_handlers.addAll(lotteryRequestHandler.buildRequestHandlers());
        restfulVerticle.setRequestHandlers(request_handlers);

        VertxOptions options = new VertxOptions();
        options.setMaxEventLoopExecuteTime(250);
        options.setMaxEventLoopExecuteTimeUnit(TimeUnit.SECONDS);
        options.setWorkerPoolSize(500);
        DeploymentOptions deploymentOptions = new DeploymentOptions();
        deploymentOptions.setWorkerPoolSize(500);
        Vertx.vertx(options).deployVerticle(restfulVerticle, deploymentOptions);
    }

}
