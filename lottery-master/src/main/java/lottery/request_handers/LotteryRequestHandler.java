package lottery.request_handers;

import core.utils.server.RequestHandler;
import io.vertx.core.http.HttpMethod;
import lottery.controller.LotteryController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class LotteryRequestHandler {
    @Autowired
    private LotteryController lotteryController;

    public List<RequestHandler> buildRequestHandlers() {
        return Arrays.asList(
                // crud
                RequestHandler.init(HttpMethod.POST, "/lottery/add_or_update", lotteryController::addOrUpdate, false),
                RequestHandler.init(HttpMethod.GET, "/lottery/search", lotteryController::search, false),
                RequestHandler.init(HttpMethod.GET, "/lottery/get/by_date", lotteryController::getByDate, false),
                RequestHandler.init(HttpMethod.GET, "/lottery/get/newest", lotteryController::getNewest, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/upload", lotteryController::uploadExcel, false),
                RequestHandler.init(HttpMethod.POST, "/craw/by/date", lotteryController::crawlByDate, false),

                // report
                RequestHandler.init(HttpMethod.POST, "/lottery/report/by_price", lotteryController::reportByPrice, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/report/double", lotteryController::reportByDouble, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/report/triple", lotteryController::reportByTriple, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/report/miss/head", lotteryController::reportByMissHead, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/report/miss/tail", lotteryController::reportByMissTail, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/report/two_number", lotteryController::reportByCombineTwoNumber, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/report/three_numbers", lotteryController::reportByCombineThreeNumber, false),
                RequestHandler.init(HttpMethod.POST, "/lottery/check_data", lotteryController::checkData, false)

        );
    }
}
