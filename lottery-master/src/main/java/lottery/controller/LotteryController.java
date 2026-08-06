package lottery.controller;

import core.lottery.lottery.LotteryApplication;
import core.lottery.lottery.command.CommandLottery;
import core.lottery.lottery.command.CommandReport;
import core.lottery.lottery.command.CommandSearchLottery;
import core.utils.common.enumeration.CommonConstant;
import core.utils.common.enumeration.DateTimeEnum;
import core.utils.common.enumeration.Exception;
import core.utils.common.helpers.CustomException;
import core.utils.common.helpers.DateTimeUtils;
import core.utils.common.helpers.JSONUtils;
import core.utils.common.models.paginated.Paginated;
import core.utils.server.AbstractResource;
import io.vertx.ext.web.FileUpload;
import io.vertx.ext.web.RoutingContext;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.util.*;

@Component
@Log4j2
public class LotteryController extends AbstractResource {

    @Autowired
    private LotteryApplication lotteryApplication;

    public void addOrUpdate(RoutingContext routingContext) {
        try {
            CommandLottery command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandLottery.class);
            if (command == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.addOrUpdate(command).orElse(null)));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void crawlByDate(RoutingContext routingContext) {
        try {
            String from_date = routingContext.request().getParam("from_date");
            String to_date = routingContext.request().getParam("to_date");

            Long from = DateTimeUtils.convertDateStringToLong(from_date, DateTimeEnum.Pattern.DATE);
            Long to = DateTimeUtils.convertDateStringToLong(to_date, DateTimeEnum.Pattern.DATE);

            if (from == null || from == 0L || to == null || to == 0L || from > to) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.crawlDataBetweenRage(from, to).orElse(null)));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }


    public void search(RoutingContext routingContext) {
        try {
            CommandSearchLottery command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandSearchLottery.class);
            if (command == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            command.setPage(this.getPage(routingContext) != 0 ? this.getPage(routingContext) : 1);
            command.setSize(this.getSize(routingContext) != 0 ? this.getSize(routingContext) : 50);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.search(command).orElse(new Paginated<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void getByDate(RoutingContext routingContext) {
        try {
            String date = routingContext.request().getParam("date");
            if (StringUtils.isBlank(date)) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.getByDateString(date).orElse(null)));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void getNewest(RoutingContext routingContext) {
        try {
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.getNewest().orElse(null)));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void uploadExcel(RoutingContext routingContext) {
        try {
            List<FileUpload> fileUploads = routingContext.fileUploads();
            if (CollectionUtils.isEmpty(fileUploads)) {
                throw new CustomException(Exception.MISSING_UPLOAD_FILE);
            }
            FileUpload fu = (FileUpload) fileUploads.toArray()[0];

            String extension = FilenameUtils.getExtension(fu.fileName());
            if (!Arrays.asList("xls", "xlsx").contains(extension)) {
                throw new CustomException(Exception.NOT_SUPPORT_FILE_TYPE);
            }
            File _file = new File(fu.uploadedFileName());
            FileInputStream fis = new FileInputStream(_file);
            Workbook workbook = WorkbookFactory.create(fis);
            Sheet sheet = workbook.getSheetAt(0);
            workbook.close();
            fis.close();

            lotteryApplication.uploadExcel(sheet);

            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, true));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void reportByPrice(RoutingContext routingContext) {
        try {
            CommandReport command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandReport.class);
            if (command == null || command.getRange() == null || CollectionUtils.isEmpty(command.getPrices())) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.reportByPrice(command).orElse(new ArrayList<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void reportByDouble(RoutingContext routingContext) {
        try {
            CommandReport command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandReport.class);
            if (command == null || command.getRange() == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            command.setFrequency(CommonConstant.ReportEnum.DOUBLE);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.reportByDoubleOrTriple(command).orElse(new ArrayList<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void reportByTriple(RoutingContext routingContext) {
        try {
            CommandReport command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandReport.class);
            if (command == null || command.getRange() == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            command.setFrequency(CommonConstant.ReportEnum.TRIPLE);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.reportByDoubleOrTriple(command).orElse(new ArrayList<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void reportByMissHead(RoutingContext routingContext) {
        try {
            CommandReport command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandReport.class);
            if (command == null || command.getRange() == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            command.setMiss(CommonConstant.ReportEnum.HEAD);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.reportByMissHeadOrTail(command).orElse(new ArrayList<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void reportByMissTail(RoutingContext routingContext) {
        try {
            CommandReport command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandReport.class);
            if (command == null || command.getRange() == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            command.setMiss(CommonConstant.ReportEnum.TAIL);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.reportByMissHeadOrTail(command).orElse(new ArrayList<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void reportByCombineTwoNumber(RoutingContext routingContext) {
        try {
            CommandReport command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandReport.class);
            if (command == null || command.getRange() == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            command.setCombine_amount(2);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.reportByCombineAmountOfNumber(command).orElse(new ArrayList<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void reportByCombineThreeNumber(RoutingContext routingContext) {
        try {
            CommandReport command = JSONUtils.jsonToObject(routingContext.body().asString(), CommandReport.class);
            if (command == null || command.getRange() == null) {
                throw new CustomException(Exception.INVALID_DATA);
            }
            command.setCombine_amount(3);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.reportByCombineAmountOfNumber(command).orElse(new ArrayList<>())));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }

    public void checkData(RoutingContext routingContext) {
        try {
            String from = routingContext.request().getParam("from_date");
            String to = routingContext.request().getParam("to_date");
            if (StringUtils.isAnyBlank(from, to)
                    || !DateTimeUtils.checkValidDate(from)
                    || !DateTimeUtils.checkValidDate(to)) {
                throw new CustomException(Exception.INVALID_DATA);
            }

            Long fromLong = DateTimeUtils.convertDateStringToLong(from, DateTimeEnum.Pattern.DATE);
            Long toLong = DateTimeUtils.convertDateStringToLong(to, DateTimeEnum.Pattern.DATE);
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("Content-Type", "application/json; charset=utf-8")
                    .end(outputJson(9999, lotteryApplication.checkData(fromLong, toLong)));
        } catch (Throwable throwable) {
            throwable.printStackTrace();
            routingContext.response()
                    .setStatusCode(200)
                    .putHeader("content-type", "application/json; charset=utf-8")
                    .end(outputJson(-9999, throwable.getMessage(), new HashMap<>()));
        }
    }
}
