package core.lottery.lottery;

import com.alibaba.fastjson.JSON;
import core.lottery.lottery.command.*;
import core.lottery.lottery.model.Appearance;
import core.lottery.lottery.model.AppearanceCount;
import core.lottery.lottery.model.ReportResult;
import core.utils.common.enumeration.Exception;
import core.utils.common.enumeration.*;
import core.utils.common.helpers.CommonUtils;
import core.utils.common.helpers.CustomException;
import core.utils.common.helpers.DateTimeUtils;
import core.utils.common.models.paginated.Paginated;
import core.utils.config.ENVConfig;
import core.utils.config.mongodb.MongoDBConnector;
import core.utils.config.mongodb.MongoDBOperator;
import lombok.extern.log4j.Log4j2;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.ResponseBody;
import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.bson.Document;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

@Component
@Log4j2
public class LotteryApplication {
    private final MongoDBOperator<Lottery> mongoDBOperator;

    public LotteryApplication(ENVConfig applicationConfig) {
        mongoDBOperator = new MongoDBConnector<>(
                applicationConfig.getStringProperty("mongodb_connection.lottery"),
                MongoEnum.Database.LOTTERY, MongoEnum.Collection.LOTTERY, Lottery.class
        );
    }

    public Optional<Lottery> addOrUpdate(CommandLottery command) throws CustomException {
        if (StringUtils.isAnyBlank(command.getDate(), command.getPrice_db(), command.getPrice_1()
                , command.getPrice_21(), command.getPrice_22()
                , command.getPrice_31(), command.getPrice_32(), command.getPrice_33(), command.getPrice_34(), command.getPrice_35(), command.getPrice_36()
                , command.getPrice_41(), command.getPrice_42(), command.getPrice_43(), command.getPrice_44()
                , command.getPrice_51(), command.getPrice_52(), command.getPrice_53(), command.getPrice_54(), command.getPrice_55(), command.getPrice_56()
                , command.getPrice_61(), command.getPrice_62(), command.getPrice_63()
                , command.getPrice_71(), command.getPrice_72(), command.getPrice_73(), command.getPrice_74()
        )) {
            throw new CustomException(Exception.MISSING_DATA);
        }
        // check valid date
        if (!DateTimeUtils.checkValidDate(command.getDate())) {
            throw new CustomException(Exception.DATE_FORMAT_NOT_CORRECT);
        }
        Long date = DateTimeUtils.convertDateStringToLong(command.getDate(), DateTimeEnum.Pattern.DATE);
        Lottery lottery = this.getByDate(date).orElse(null);
        if (lottery != null) {
            lottery.setLast_updated_date(System.currentTimeMillis());
            lottery.setPrice_db(command.getPrice_db());
            lottery.setPrice_1(command.getPrice_1());
            lottery.setPrice_21(command.getPrice_21());
            lottery.setPrice_22(command.getPrice_22());
            lottery.setPrice_31(command.getPrice_31());
            lottery.setPrice_32(command.getPrice_32());
            lottery.setPrice_33(command.getPrice_33());
            lottery.setPrice_34(command.getPrice_34());
            lottery.setPrice_35(command.getPrice_35());
            lottery.setPrice_36(command.getPrice_36());
            lottery.setPrice_41(command.getPrice_41());
            lottery.setPrice_42(command.getPrice_42());
            lottery.setPrice_43(command.getPrice_43());
            lottery.setPrice_44(command.getPrice_44());
            lottery.setPrice_51(command.getPrice_51());
            lottery.setPrice_52(command.getPrice_52());
            lottery.setPrice_53(command.getPrice_53());
            lottery.setPrice_54(command.getPrice_54());
            lottery.setPrice_55(command.getPrice_55());
            lottery.setPrice_56(command.getPrice_56());
            lottery.setPrice_61(command.getPrice_61());
            lottery.setPrice_62(command.getPrice_62());
            lottery.setPrice_63(command.getPrice_63());
            lottery.setPrice_71(command.getPrice_71());
            lottery.setPrice_72(command.getPrice_72());
            lottery.setPrice_73(command.getPrice_73());
            lottery.setPrice_74(command.getPrice_74());

            this.buildDataFromRaw(lottery);
            return mongoDBOperator.update(lottery.get_id().toHexString(), lottery);
        } else {
            lottery = Lottery.builder()
                    .created_date(System.currentTimeMillis())
                    .last_updated_date(System.currentTimeMillis())
                    .date_string(command.getDate())
                    .date(date)
                    .price_db(command.getPrice_db())
                    .price_1(command.getPrice_1())
                    .price_21(command.getPrice_21())
                    .price_22(command.getPrice_22())
                    .price_31(command.getPrice_31())
                    .price_32(command.getPrice_32())
                    .price_33(command.getPrice_33())
                    .price_34(command.getPrice_34())
                    .price_35(command.getPrice_35())
                    .price_36(command.getPrice_36())
                    .price_41(command.getPrice_41())
                    .price_42(command.getPrice_42())
                    .price_43(command.getPrice_43())
                    .price_44(command.getPrice_44())
                    .price_51(command.getPrice_51())
                    .price_52(command.getPrice_52())
                    .price_53(command.getPrice_53())
                    .price_54(command.getPrice_54())
                    .price_55(command.getPrice_55())
                    .price_56(command.getPrice_56())
                    .price_61(command.getPrice_61())
                    .price_62(command.getPrice_62())
                    .price_63(command.getPrice_63())
                    .price_71(command.getPrice_71())
                    .price_72(command.getPrice_72())
                    .price_73(command.getPrice_73())
                    .price_74(command.getPrice_74())
                    .build();
            this.buildDataFromRaw(lottery);
            return Optional.ofNullable(mongoDBOperator.insert(lottery));
        }
    }

    public Optional<Paginated<Lottery>> search(CommandSearchLottery command) {
        Map<String, Object> query = new HashMap<>();
        if (command.getRange() != null && DateTimeUtils.checkValidDate(command.getRange().getFrom()) && DateTimeUtils.checkValidDate(command.getRange().getTo())) {
            query.put("date", new Document("$gte", DateTimeUtils.convertDateStringToLong(command.getRange().getFrom(), DateTimeEnum.Pattern.DATE))
                    .append("$lte", DateTimeUtils.convertDateStringToLong(command.getRange().getTo(), DateTimeEnum.Pattern.DATE)));
        }

        long total = mongoDBOperator.count(query).orElse(0L);
        if (total > 0L) {
            Map<String, Object> sort = new HashMap<>();
            sort.put("date", -1);
            List<Lottery> lotteries = mongoDBOperator.search(query, sort, new HashMap<>(), command.getPage(), command.getSize());
            return Optional.of(new Paginated<>(lotteries, command.getPage(), command.getSize(), total));

        }
        return Optional.of(new Paginated<>());
    }

    public Optional<Lottery> getByDateString(String date) {
        if (StringUtils.isBlank(date) || !DateTimeUtils.checkValidDate(date)) {
            return Optional.empty();
        }
        Long date_l = DateTimeUtils.convertDateStringToLong(date, DateTimeEnum.Pattern.DATE);
        return this.getByDate(date_l);
    }

    public Optional<Lottery> getNewest() {
        Map<String, Object> query = new HashMap<>();
        return Optional.ofNullable(mongoDBOperator.getLast(query, "date"));
    }

    //
    // report zone
    //
    public Optional<List<ReportResult>> reportByPrice(CommandReport command) {
        if (command.getRange() == null || command.getRange().getTo() == null || command.getRange().getFrom() == null
                || CollectionUtils.isEmpty(command.getPrices())) {
            return Optional.empty();
        }

        Map<String, Object> query = new HashMap<>();
        query.put("date", new Document("$gte", DateTimeUtils.convertDateStringToLong(command.getRange().getFrom(), DateTimeEnum.Pattern.DATE))
                .append("$lte", DateTimeUtils.convertDateStringToLong(command.getRange().getTo(), DateTimeEnum.Pattern.DATE)));

        Map<String, Object> sort = new HashMap<>();
        sort.put("date", -1);

        Map<String, Object> projections = CommonUtils.buildFieldsProjections(FieldProjectionEnum.REPORT_BY_PRICE);

        List<Lottery> lotteries = mongoDBOperator.search(query, sort, projections, 0, 0);
        if (CollectionUtils.isEmpty(lotteries) || !command.getRange().getTo().equals(lotteries.get(0).getDate_string())) {
            return Optional.empty();
        }

        List<CommandSearchLottery.Price> prices_1 = new ArrayList<>();
        List<CommandSearchLottery.Price> prices_2 = new ArrayList<>();
        List<CommandSearchLottery.Price> prices_3 = new ArrayList<>();
        List<List<CommandSearchLottery.Price>> prices = Arrays.asList(prices_1, prices_2, prices_3);

        int cur_index = 0;
        for (CommandSearchLottery.Price price : command.getPrices()) {
            prices.get(cur_index).add(price);
            cur_index += 1;
            if (cur_index == 3) {
                cur_index = 0;
            }
        }

        ExecutorService executorService = Executors.newFixedThreadPool(3);
        List<Future<List<ReportResult>>> futures = new ArrayList<>();
        for (int i = 0; i < 3; i++) { // 3 thread
            int finalI = i;
            Future<List<ReportResult>> future = executorService.submit(() -> calculateReportByPrice(lotteries, prices.get(finalI), command.getLimitation()));
            futures.add(future);
        }
        executorService.shutdown();
        return Optional.of(this.getResultFromFutures(futures, command.getLimitation()));
    }

    public Optional<List<ReportResult>> reportByDoubleOrTriple(CommandReport command) {
        if (command.getRange() == null || command.getRange().getTo() == null || command.getRange().getFrom() == null || command.getFrequency() == null) {
            return Optional.empty();
        }
        Integer frequency = CommonConstant.ReportEnum.DOUBLE.equals(command.getFrequency()) ? 2 : 3;

        Map<String, Object> query = new HashMap<>();
        query.put("date", new Document("$gte", DateTimeUtils.convertDateStringToLong(command.getRange().getFrom(), DateTimeEnum.Pattern.DATE))
                .append("$lte", DateTimeUtils.convertDateStringToLong(command.getRange().getTo(), DateTimeEnum.Pattern.DATE)));

        Map<String, Object> sort = new HashMap<>();
        sort.put("date", -1);

        Map<String, Object> projections = CommonUtils.buildFieldsProjections(FieldProjectionEnum.ALL_ONLY);

        List<Lottery> lotteries = mongoDBOperator.search(query, sort, projections, 0, 0);
        if (CollectionUtils.isEmpty(lotteries) || !command.getRange().getTo().equals(lotteries.get(0).getDate_string())) {
            return Optional.empty();
        }

        List<AppearanceCount> frequencies = this.getFrequency(lotteries.get(0).getAll());
        frequencies = frequencies.stream().filter(f -> f.getCount() >= frequency).collect(Collectors.toList());
        if (CollectionUtils.isEmpty(frequencies)) {
            return Optional.empty();
        }

        List<String> numbers_1 = new ArrayList<>();
        List<String> numbers_2 = new ArrayList<>();
        List<String> numbers_3 = new ArrayList<>();
        List<List<String>> lists = Arrays.asList(numbers_1, numbers_2, numbers_3);

        int cur_index = 0;
        for (AppearanceCount count : frequencies) {
            lists.get(cur_index).add(count.getNumber());
            cur_index += 1;
            if (cur_index == 3) {
                cur_index = 0;
            }
        }

        ExecutorService executorService = Executors.newFixedThreadPool(3);
        List<Future<List<ReportResult>>> futures = new ArrayList<>();
        for (int i = 0; i < 3; i++) { // 3 thread
            int finalI = i;
            Future<List<ReportResult>> future = executorService.submit(() -> calculateReportByDoubleOrTriple(lotteries, lists.get(finalI), frequency, command.getLimitation()));
            futures.add(future);
        }
        executorService.shutdown();
        return Optional.of(this.getResultFromFutures(futures, command.getLimitation()));
    }

    public Optional<List<ReportResult>> reportByMissHeadOrTail(CommandReport command) {
        if (command.getRange() == null || command.getRange().getTo() == null || command.getRange().getFrom() == null || command.getMiss() == null) {
            return Optional.empty();
        }
        Map<String, Object> query = new HashMap<>();
        query.put("date", new Document("$gte", DateTimeUtils.convertDateStringToLong(command.getRange().getFrom(), DateTimeEnum.Pattern.DATE))
                .append("$lte", DateTimeUtils.convertDateStringToLong(command.getRange().getTo(), DateTimeEnum.Pattern.DATE)));

        Map<String, Object> sort = new HashMap<>();
        sort.put("date", -1);

        Map<String, Object> projections = CommonUtils.buildFieldsProjections(FieldProjectionEnum.REPORT_BY_MISS);

        List<Lottery> lotteries = mongoDBOperator.search(query, sort, projections, 0, 0);
        if (CollectionUtils.isEmpty(lotteries) || !command.getRange().getTo().equals(lotteries.get(0).getDate_string())) {
            return Optional.empty();
        }
        List<String> targets = new ArrayList<>();
        if (CommonConstant.ReportEnum.HEAD.equals(command.getMiss())) {
            if (CollectionUtils.isEmpty(lotteries.get(0).getMiss_heads())) {
                return Optional.empty();
            } else {
                targets = lotteries.get(0).getMiss_heads();
            }
        } else if (CommonConstant.ReportEnum.TAIL.equals(command.getMiss())) {
            if (CollectionUtils.isEmpty(lotteries.get(0).getMiss_tails())) {
                return Optional.empty();
            } else {
                targets = lotteries.get(0).getMiss_tails();
            }
        }

        List<String> numbers_1 = new ArrayList<>();
        List<String> numbers_2 = new ArrayList<>();
        List<String> numbers_3 = new ArrayList<>();
        List<List<String>> lists = Arrays.asList(numbers_1, numbers_2, numbers_3);

        int cur_index = 0;
        for (String target : targets) {
            lists.get(cur_index).add(target);
            cur_index += 1;
            if (cur_index == 3) {
                cur_index = 0;
            }
        }

        ExecutorService executorService = Executors.newFixedThreadPool(3);
        List<Future<List<ReportResult>>> futures = new ArrayList<>();
        for (int i = 0; i < 3; i++) { // 3 thread
            int finalI = i;
            Future<List<ReportResult>> future = executorService.submit(() -> calculateReportByMissHeadOrTail(lotteries, lists.get(finalI), command.getMiss(), command.getLimitation()));
            futures.add(future);
        }
        executorService.shutdown();
        return Optional.of(this.getResultFromFutures(futures, command.getLimitation()));
    }

    public Optional<List<ReportResult>> reportByCombineAmountOfNumber(CommandReport command) {
        if (command.getRange() == null || command.getRange().getTo() == null || command.getRange().getFrom() == null || command.getCombine_amount() == null) {
            return Optional.empty();
        }

        Map<String, Object> query = new HashMap<>();
        query.put("date", new Document("$gte", DateTimeUtils.convertDateStringToLong(command.getRange().getFrom(), DateTimeEnum.Pattern.DATE))
                .append("$lte", DateTimeUtils.convertDateStringToLong(command.getRange().getTo(), DateTimeEnum.Pattern.DATE)));

        Map<String, Object> sort = new HashMap<>();
        sort.put("date", -1);

        Map<String, Object> projections = CommonUtils.buildFieldsProjections(FieldProjectionEnum.ALL_ONLY);

        List<Lottery> lotteries = mongoDBOperator.search(query, sort, projections, 0, 0);
        if (CollectionUtils.isEmpty(lotteries) || !command.getRange().getTo().equals(lotteries.get(0).getDate_string())) {
            return Optional.empty();
        }
        List<String> all = lotteries.get(0).getAll().stream().distinct().collect(Collectors.toList());
        List<List<String>> targets = CommonUtils.getAllCombinations(all, command.getCombine_amount());

        List<List<String>> target_1 = new ArrayList<>();
        List<List<String>> target_2 = new ArrayList<>();
        List<List<String>> target_3 = new ArrayList<>();
        List<List<List<String>>> lists = Arrays.asList(target_1, target_2, target_3);

        int cur_index = 0;
        for (List<String> target : targets) {
            lists.get(cur_index).add(target);
            cur_index += 1;
            if (cur_index == 3) {
                cur_index = 0;
            }
        }

        ExecutorService executorService = Executors.newFixedThreadPool(3);
        List<Future<List<ReportResult>>> futures = new ArrayList<>();
        for (int i = 0; i < 3; i++) { // 3 thread
            int finalI = i;
            Future<List<ReportResult>> future = executorService.submit(() -> calculateReportByCombineAmountOfNumber(lotteries, lists.get(finalI), command.getLimitation()));
            futures.add(future);
        }
        if (command.getLimitation() == null) {
            command.setLimitation(CommandReport.Limitation.builder().build());
        }
        if (command.getLimitation().getNum_result() == null) {
            command.getLimitation().setNum_result(50);
        }
        executorService.shutdown();
        return Optional.of(this.getResultFromFutures(futures, command.getLimitation()));
    }

    public void uploadExcel(Sheet sheet) {
        try {
            List<Lottery> lotteries = new ArrayList<>();
            for (Row row : sheet) {
                Lottery lottery = Lottery.builder()
                        .created_date(System.currentTimeMillis())
                        .last_updated_date(System.currentTimeMillis())
                        .build();
                Boolean duplicate = false;
                for (Cell cell : row) {
                    String value = "";
                    switch (cell.getCellType()) {
                        case STRING:
                            value = cell.getStringCellValue();
                            break;
                        case NUMERIC:
                            if (DateUtil.isCellDateFormatted(cell)) {
                                LocalDateTime localDateTime = cell.getLocalDateTimeCellValue();
                                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DateTimeEnum.Pattern.DATE);
                                value = localDateTime.format(formatter);
                            } else {
                                value = new DataFormatter().formatCellValue(cell);
                            }
                    }

                    switch (cell.getColumnIndex()) {
                        case 0:
                            lottery.setDate_string(value);
                            lottery.setDate(DateTimeUtils.convertDateStringToLong(value, DateTimeEnum.Pattern.DATE));
                            String finalValue = value;
                            Lottery exist = lotteries.stream().filter(f -> f.getDate_string().equals(finalValue)).findFirst().orElse(null);
                            if (exist != null) {
                                duplicate = true;
                            }
                            break;
                        case 1:
                            lottery.setPrice_db(value);
                            break;
                        case 2:
                            lottery.setPrice_1(value);
                            break;
                        case 3:
                            lottery.setPrice_21(value);
                            break;
                        case 4:
                            lottery.setPrice_22(value);
                            break;
                        case 5:
                            lottery.setPrice_31(value);
                            break;
                        case 6:
                            lottery.setPrice_32(value);
                            break;
                        case 7:
                            lottery.setPrice_33(value);
                            break;
                        case 8:
                            lottery.setPrice_34(value);
                            break;
                        case 9:
                            lottery.setPrice_35(value);
                            break;
                        case 10:
                            lottery.setPrice_36(value);
                            break;
                        case 11:
                            lottery.setPrice_41(value);
                            break;
                        case 12:
                            lottery.setPrice_42(value);
                            break;
                        case 13:
                            lottery.setPrice_43(value);
                            break;
                        case 14:
                            lottery.setPrice_44(value);
                            break;
                        case 15:
                            lottery.setPrice_51(value);
                            break;
                        case 16:
                            lottery.setPrice_52(value);
                            break;
                        case 17:
                            lottery.setPrice_53(value);
                            break;
                        case 18:
                            lottery.setPrice_54(value);
                            break;
                        case 19:
                            lottery.setPrice_55(value);
                            break;
                        case 20:
                            lottery.setPrice_56(value);
                            break;
                        case 21:
                            lottery.setPrice_61(value);
                            break;
                        case 22:
                            lottery.setPrice_62(value);
                            break;
                        case 23:
                            lottery.setPrice_63(value);
                            break;
                        case 24:
                            lottery.setPrice_71(value);
                            break;
                        case 25:
                            lottery.setPrice_72(value);
                            break;
                        case 26:
                            lottery.setPrice_73(value);
                            break;
                        case 27:
                            lottery.setPrice_74(value);
                            break;

                    }
                    if (BooleanUtils.isTrue(duplicate)) {
                        break;
                    }
                }
                if (BooleanUtils.isTrue(duplicate)) {
                    continue;
                }
                this.buildDataFromRaw(lottery);
                lotteries.add(lottery);
            }
            mongoDBOperator.insertMany(lotteries);
        } catch (java.lang.Exception e) {
            e.printStackTrace();
        }
    }

    //    Helpers
    public void buildDataFromRaw(Lottery lottery) {
        if (lottery == null) {
            return;
        }

        lottery.setShort_db(CommonUtils.getLastCharacterOfString(lottery.getPrice_db(), 2));
        lottery.setShort_1(CommonUtils.getLastCharacterOfString(lottery.getPrice_1(), 2));
        lottery.setShort_21(CommonUtils.getLastCharacterOfString(lottery.getPrice_21(), 2));
        lottery.setShort_22(CommonUtils.getLastCharacterOfString(lottery.getPrice_22(), 2));
        lottery.setShort_31(CommonUtils.getLastCharacterOfString(lottery.getPrice_31(), 2));
        lottery.setShort_32(CommonUtils.getLastCharacterOfString(lottery.getPrice_32(), 2));
        lottery.setShort_33(CommonUtils.getLastCharacterOfString(lottery.getPrice_33(), 2));
        lottery.setShort_34(CommonUtils.getLastCharacterOfString(lottery.getPrice_34(), 2));
        lottery.setShort_35(CommonUtils.getLastCharacterOfString(lottery.getPrice_35(), 2));
        lottery.setShort_36(CommonUtils.getLastCharacterOfString(lottery.getPrice_36(), 2));
        lottery.setShort_41(CommonUtils.getLastCharacterOfString(lottery.getPrice_41(), 2));
        lottery.setShort_42(CommonUtils.getLastCharacterOfString(lottery.getPrice_42(), 2));
        lottery.setShort_43(CommonUtils.getLastCharacterOfString(lottery.getPrice_43(), 2));
        lottery.setShort_44(CommonUtils.getLastCharacterOfString(lottery.getPrice_44(), 2));
        lottery.setShort_51(CommonUtils.getLastCharacterOfString(lottery.getPrice_51(), 2));
        lottery.setShort_52(CommonUtils.getLastCharacterOfString(lottery.getPrice_52(), 2));
        lottery.setShort_53(CommonUtils.getLastCharacterOfString(lottery.getPrice_53(), 2));
        lottery.setShort_54(CommonUtils.getLastCharacterOfString(lottery.getPrice_54(), 2));
        lottery.setShort_55(CommonUtils.getLastCharacterOfString(lottery.getPrice_55(), 2));
        lottery.setShort_56(CommonUtils.getLastCharacterOfString(lottery.getPrice_56(), 2));
        lottery.setShort_61(CommonUtils.getLastCharacterOfString(lottery.getPrice_61(), 2));
        lottery.setShort_62(CommonUtils.getLastCharacterOfString(lottery.getPrice_62(), 2));
        lottery.setShort_63(CommonUtils.getLastCharacterOfString(lottery.getPrice_63(), 2));
        lottery.setShort_71(CommonUtils.getLastCharacterOfString(lottery.getPrice_71(), 2));
        lottery.setShort_72(CommonUtils.getLastCharacterOfString(lottery.getPrice_72(), 2));
        lottery.setShort_73(CommonUtils.getLastCharacterOfString(lottery.getPrice_73(), 2));
        lottery.setShort_74(CommonUtils.getLastCharacterOfString(lottery.getPrice_74(), 2));

        lottery.setAll_db(Collections.singletonList(lottery.getShort_db()));
        List<String> all = new ArrayList<>(lottery.getAll_db());

        lottery.setAll_1(Collections.singletonList(lottery.getShort_1()));
        all.addAll(new ArrayList<>(lottery.getAll_1()));

        lottery.setAll_2(Arrays.asList(lottery.getShort_21(), lottery.getShort_22()));
        all.addAll(new ArrayList<>(lottery.getAll_2()));

        lottery.setAll_3(Arrays.asList(lottery.getShort_31(), lottery.getShort_32(), lottery.getShort_33(), lottery.getShort_34(),
                lottery.getShort_35(), lottery.getShort_36()));
        all.addAll(new ArrayList<>(lottery.getAll_3()));

        lottery.setAll_4(Arrays.asList(lottery.getShort_41(), lottery.getShort_42(), lottery.getShort_43(), lottery.getShort_44()));
        all.addAll(new ArrayList<>(lottery.getAll_4()));

        lottery.setAll_5(Arrays.asList(lottery.getShort_51(), lottery.getShort_52(), lottery.getShort_53(), lottery.getShort_54(),
                lottery.getShort_55(), lottery.getShort_56()));
        all.addAll(new ArrayList<>(lottery.getAll_5()));

        lottery.setAll_6(Arrays.asList(lottery.getShort_61(), lottery.getShort_62(), lottery.getShort_63()));
        all.addAll(new ArrayList<>(lottery.getAll_6()));

        lottery.setAll_7(Arrays.asList(lottery.getShort_71(), lottery.getShort_72(), lottery.getShort_73(), lottery.getShort_74()));
        all.addAll(new ArrayList<>(lottery.getAll_7()));

        lottery.setAll(all);

        lottery.setTails(all.stream().map(ele -> CommonUtils.getLastCharacterOfString(ele, 1)).distinct().collect(Collectors.toList()));
        List<String> miss_tails = new ArrayList<>(CommonConstant.ZeroToNine);
        miss_tails.removeAll(lottery.getTails());
        lottery.setMiss_tails(miss_tails);

        lottery.setHeads(all.stream().map(ele -> ele.substring(0, 1)).distinct().collect(Collectors.toList()));
        List<String> miss_heads = new ArrayList<>(CommonConstant.ZeroToNine);
        miss_heads.removeAll(lottery.getHeads());
        lottery.setMiss_heads(miss_heads);
    }

    public Optional<Lottery> getByDate(Long date) {
        if (date == null) {
            return Optional.empty();
        }

        Map<String, Object> query = new HashMap<>();
        query.put("date", date);
        Lottery lottery = mongoDBOperator.getOne(query);
        if (lottery != null) {
            return Optional.of(lottery);
        }
        return Optional.empty();
    }

    private List<ReportResult> calculateReportByPrice(List<Lottery> lotteries, List<CommandSearchLottery.Price> prices, CommandReport.Limitation limitation) {
        List<ReportResult> results = new ArrayList<>();
        for (CommandSearchLottery.Price price : prices) {
            if (StringUtils.isAnyBlank(price.getPrice(), price.getNumber())) {
                continue;
            }
            CommandCalculateReport cal_data = CommandCalculateReport.builder()
                    .target(price.getPrice())
                    .total_count(new ArrayList<>())
                    .appearances(new ArrayList<>())
                    .build();
            for (int i = 1; i < lotteries.size(); i++) {
                try {
                    String field_name = "short_" + price.getPrice();
                    Field field = lotteries.get(i).getClass().getDeclaredField(field_name);
                    field.setAccessible(true);
                    String value = String.valueOf(field.get(lotteries.get(i)));
                    if (!price.getNumber().equals(value)) {
                        continue;
                    }

                    Lottery current = lotteries.get(i);
                    Lottery day_1 = null;
                    if (i - 1 > 0) {
                        day_1 = lotteries.get(i - 1);
                    }
                    Lottery day_2 = null;
                    if (i - 2 > 0) {
                        day_2 = lotteries.get(i - 2);
                    }
                    Lottery day_3 = null;
                    if (limitation == null || BooleanUtils.isNotTrue(limitation.getTwo_day_frame())) {
                        if (i - 3 > 0) {
                            day_3 = lotteries.get(i - 3);
                        }
                    }

                    this.calculateThreeDayLater(cal_data, current, day_1, day_2, day_3);

                } catch (NoSuchFieldException | IllegalAccessException e) {
                    e.printStackTrace();
                }
            }

            if (CollectionUtils.isEmpty(cal_data.getTotal_count()) && CollectionUtils.isEmpty(cal_data.getAppearances())) {
                continue;
            }
            int limit = 50;
            if (limitation != null && BooleanUtils.isTrue(limitation.getTwo_day_frame())) {
                limit = 80;
            }
            List<ReportResult.ReportData> data = this.combinePairAndCalculateTotalV2(cal_data, limit);
            int miss = limitation != null && limitation.getMiss() != null && limitation.getMiss() >= 0 ? limitation.getMiss() : 3;
            int count = limitation != null && limitation.getCount() != null && limitation.getCount() >= 15 ? limitation.getCount() : 15;
            data = data.stream().filter(f -> f.getMiss() <= miss && f.getCount() >= count).collect(Collectors.toList());
            if (CollectionUtils.isEmpty(data)) {
                continue;
            }

            int num_collection = limitation != null && limitation.getNum_collection() != null && limitation.getNum_collection() > 0 ? limitation.getNum_collection() : 5;
            if (data.size() > num_collection) {
                data = data.subList(0, num_collection);
            }
            results.add(ReportResult.builder()
                    .target(price.getPrice())
                    .data(data)
                    .max_count(data.get(0).getCount())
                    .build());
        }

        return results;
    }

    private List<ReportResult> calculateReportByDoubleOrTriple(List<Lottery> lotteries, List<String> numbers, Integer frequency, CommandReport.Limitation limitation) {
        List<ReportResult> results = new ArrayList<>();
        for (String target : numbers) {

            CommandCalculateReport cal_data = CommandCalculateReport.builder()
                    .target(target)
                    .total_count(new ArrayList<>())
                    .appearances(new ArrayList<>())
                    .build();
            for (int i = 1; i < lotteries.size(); i++) {
                List<AppearanceCount> frequencies = this.getFrequency(lotteries.get(i).getAll());
                AppearanceCount found = frequencies.stream().filter(f -> f.getNumber().equals(target) && f.getCount() >= frequency).findFirst().orElse(null);
                if (found == null) {
                    continue;
                }

                Lottery current = lotteries.get(i);
                Lottery day_1 = null;
                if (i - 1 > 0) {
                    day_1 = lotteries.get(i - 1);
                }
                Lottery day_2 = null;
                if (i - 2 > 0) {
                    day_2 = lotteries.get(i - 2);
                }
                Lottery day_3 = null;
                if (limitation == null || BooleanUtils.isNotTrue(limitation.getTwo_day_frame())) {
                    if (i - 3 > 0) {
                        day_3 = lotteries.get(i - 3);
                    }
                }

                this.calculateThreeDayLater(cal_data, current, day_1, day_2, day_3);
            }

            if (CollectionUtils.isEmpty(cal_data.getTotal_count()) && CollectionUtils.isEmpty(cal_data.getAppearances())) {
                continue;
            }

            List<ReportResult.ReportData> data = this.combinePairAndCalculateTotalV2(cal_data, 50);
            int miss = limitation != null && limitation.getMiss() != null && limitation.getMiss() >= 0 ? limitation.getMiss() : 3;
            int count = limitation != null && limitation.getCount() != null && limitation.getCount() >= 1 ? limitation.getCount() : 1;
            data = data.stream().filter(f -> f.getMiss() <= miss && f.getCount() >= count).collect(Collectors.toList());
            if (CollectionUtils.isEmpty(data)) {
                continue;
            }

            int num_collection = limitation != null && limitation.getNum_collection() != null && limitation.getNum_collection() > 0 ? limitation.getNum_collection() : 5;
            if (num_collection > 0 && data.size() > num_collection) {
                data = data.subList(0, num_collection);
            }
            results.add(ReportResult.builder()
                    .target(target)
                    .data(data)
                    .max_count(data.get(0).getCount())
                    .build());
        }
        return results;
    }

    private List<ReportResult> calculateReportByMissHeadOrTail(List<Lottery> lotteries, List<String> numbers, String miss, CommandReport.Limitation limitation) {
        List<ReportResult> results = new ArrayList<>();
        for (String target : numbers) {

            CommandCalculateReport cal_data = CommandCalculateReport.builder()
                    .target(target)
                    .total_count(new ArrayList<>())
                    .appearances(new ArrayList<>())
                    .build();
            for (int i = 1; i < lotteries.size(); i++) {
                if (CommonConstant.ReportEnum.HEAD.equals(miss)) {
                    if (CollectionUtils.isEmpty(lotteries.get(i).getMiss_heads()) || !lotteries.get(i).getMiss_heads().contains(target)) {
                        continue;
                    }
                } else if (CommonConstant.ReportEnum.TAIL.equals(miss)) {
                    if (CollectionUtils.isEmpty(lotteries.get(i).getMiss_tails()) || !lotteries.get(i).getMiss_tails().contains(target)) {
                        continue;
                    }
                }

                Lottery current = lotteries.get(i);
                Lottery day_1 = null;
                if (i - 1 > 0) {
                    day_1 = lotteries.get(i - 1);
                }
                Lottery day_2 = null;
                if (i - 2 > 0) {
                    day_2 = lotteries.get(i - 2);
                }
                Lottery day_3 = null;
                if (limitation == null || BooleanUtils.isNotTrue(limitation.getTwo_day_frame())) {
                    if (i - 3 > 0) {
                        day_3 = lotteries.get(i - 3);
                    }
                }

                this.calculateThreeDayLater(cal_data, current, day_1, day_2, day_3);
            }

            if (CollectionUtils.isEmpty(cal_data.getTotal_count()) && CollectionUtils.isEmpty(cal_data.getAppearances())) {
                continue;
            }

            List<ReportResult.ReportData> data = this.combinePairAndCalculateTotalV2(cal_data, 50);
            int miss_check = limitation != null && limitation.getMiss() != null && limitation.getMiss() >= 0 ? limitation.getMiss() : 3;
            int count = limitation != null && limitation.getCount() != null && limitation.getCount() >= 1 ? limitation.getCount() : 1;
            data = data.stream().filter(f -> f.getMiss() <= miss_check && f.getCount() >= count).collect(Collectors.toList());
            if (CollectionUtils.isEmpty(data)) {
                continue;
            }

            int num_collection = limitation != null && limitation.getNum_collection() != null && limitation.getNum_collection() > 0 ? limitation.getNum_collection() : 5;
            if (num_collection > 0 && data.size() > num_collection) {
                data = data.subList(0, num_collection);
            }
            results.add(ReportResult.builder()
                    .target(target)
                    .data(data)
                    .max_count(data.get(0).getCount())
                    .build());
        }
        return results;
    }

    private List<ReportResult> calculateReportByCombineAmountOfNumber(List<Lottery> lotteries, List<List<String>> numbers, CommandReport.Limitation limitation) {
        List<ReportResult> results = new ArrayList<>();
        for (List<String> target : numbers) {
            Collections.sort(target);
            CommandCalculateReport cal_data = CommandCalculateReport.builder()
                    .target(StringUtils.join(target, "_"))
                    .total_count(new ArrayList<>())
                    .appearances(new ArrayList<>())
                    .build();
            for (int i = 1; i < lotteries.size(); i++) {
                if (!new HashSet<>(lotteries.get(i).getAll()).containsAll(target)) {
                    continue;
                }

                Lottery current = lotteries.get(i);
                Lottery day_1 = null;
                if (i - 1 > 0) {
                    day_1 = lotteries.get(i - 1);
                }
                Lottery day_2 = null;
                if (i - 2 > 0) {
                    day_2 = lotteries.get(i - 2);
                }
                Lottery day_3 = null;
                if (limitation == null || BooleanUtils.isNotTrue(limitation.getTwo_day_frame())) {
                    if (i - 3 > 0) {
                        day_3 = lotteries.get(i - 3);
                    }
                }

                this.calculateThreeDayLater(cal_data, current, day_1, day_2, day_3);
            }

            if (CollectionUtils.isEmpty(cal_data.getTotal_count()) && CollectionUtils.isEmpty(cal_data.getAppearances())) {
                continue;
            }

            int limit = 10;
            if (limitation != null && BooleanUtils.isTrue(limitation.getTwo_day_frame())) {
                limit = 20;
            }
            List<ReportResult.ReportData> data = this.combinePairAndCalculateTotalV2(cal_data, limit);
            int miss = limitation != null && limitation.getMiss() != null && limitation.getMiss() >= 0 ? limitation.getMiss() : 3;
            int count = limitation != null && limitation.getCount() != null && limitation.getCount() >= 1 ? limitation.getCount() : 1;
            data = data.stream().filter(f -> f.getMiss() <= miss && f.getCount() >= count).collect(Collectors.toList());
            if (CollectionUtils.isEmpty(data)) {
                continue;
            }

            int num_collection = limitation != null && limitation.getNum_collection() != null && limitation.getNum_collection() > 0 ? limitation.getNum_collection() : 5;
            if (data.size() > num_collection) {
                data = data.subList(0, num_collection);
            }
            results.add(ReportResult.builder()
                    .target(StringUtils.join(target, "_"))
                    .data(data)
                    .max_count(data.get(0).getCount())
                    .build());
        }
        return results;
    }

    private List<AppearanceCount> getFrequency(List<String> numbers) {
        if (CollectionUtils.isEmpty(numbers)) {
            return new ArrayList<>();
        }
        List<AppearanceCount> results = new ArrayList<>();
        for (String number : numbers) {
            AppearanceCount found = results.stream().filter(f -> f.getNumber().equals(number)).findFirst().orElse(null);
            if (found == null) {
                results.add(AppearanceCount.builder()
                        .number(number)
                        .count(1)
                        .build());
            } else {
                found.setCount(found.getCount() + 1);
            }
        }
        return results;
    }

    private void calculateThreeDayLater(CommandCalculateReport cal_data, Lottery current, Lottery day_1, Lottery day_2, Lottery day_3) {
        Appearance appearance = Appearance.builder()
                .date(current.getDate_string())
                .day_1(new ArrayList<>())
                .day_2(new ArrayList<>())
                .day_3(new ArrayList<>())
                .build();

        // count date 1
        if (day_1 != null && CollectionUtils.isNotEmpty(day_1.getAll())) {
            for (String number : day_1.getAll()) {
                // 1 ngày sau ngày xuất hiện
                AppearanceCount date_count = appearance.getDay_1().stream().filter(f -> f.getNumber().equals(number)).findFirst().orElse(null);
                if (date_count == null) {
                    appearance.getDay_1().add(AppearanceCount.builder()
                            .number(number)
                            .count(1)
                            .build());
                } else {
                    date_count.setCount(date_count.getCount() + 1);
                }

                // tổng tất cả các ngày
                AppearanceCount date_count_total = cal_data.getTotal_count().stream().filter(f -> f.getNumber().equals(number)).findFirst().orElse(null);
                if (date_count_total == null) {
                    cal_data.getTotal_count().add(AppearanceCount.builder()
                            .number(number)
                            .count(1)
                            .build());
                } else {
                    date_count_total.setCount(date_count_total.getCount() + 1);
                }
            }
        }

        // count date 2
        if (day_2 != null && CollectionUtils.isNotEmpty(day_2.getAll())) {
            for (String number : day_2.getAll()) {
                // 2 ngày sau ngày xuất hiện
                AppearanceCount date_count = appearance.getDay_2().stream().filter(f -> f.getNumber().equals(number)).findFirst().orElse(null);
                if (date_count == null) {
                    appearance.getDay_2().add(AppearanceCount.builder()
                            .number(number)
                            .count(1)
                            .build());
                } else {
                    date_count.setCount(date_count.getCount() + 1);
                }

                // tổng tất cả các ngày
                AppearanceCount date_count_total = cal_data.getTotal_count().stream().filter(f -> f.getNumber().equals(number)).findFirst().orElse(null);
                if (date_count_total == null) {
                    cal_data.getTotal_count().add(AppearanceCount.builder()
                            .number(number)
                            .count(1)
                            .build());
                } else {
                    date_count_total.setCount(date_count_total.getCount() + 1);
                }
            }
        }

        // count date 2
        if (day_3 != null && CollectionUtils.isNotEmpty(day_3.getAll())) {
            for (String number : day_3.getAll()) {
                // 2 ngày sau ngày xuất hiện
                AppearanceCount date_count = appearance.getDay_3().stream().filter(f -> f.getNumber().equals(number)).findFirst().orElse(null);
                if (date_count == null) {
                    appearance.getDay_3().add(AppearanceCount.builder()
                            .number(number)
                            .count(1)
                            .build());
                } else {
                    date_count.setCount(date_count.getCount() + 1);
                }

                // tổng tất cả các ngày
                AppearanceCount date_count_total = cal_data.getTotal_count().stream().filter(f -> f.getNumber().equals(number)).findFirst().orElse(null);
                if (date_count_total == null) {
                    cal_data.getTotal_count().add(AppearanceCount.builder()
                            .number(number)
                            .count(1)
                            .build());
                } else {
                    date_count_total.setCount(date_count_total.getCount() + 1);
                }
            }
        }

        cal_data.getAppearances().add(appearance);
    }

    private List<ReportResult.ReportData> combinePairAndCalculateTotal(CommandCalculateReport cal_data) {
        List<ReportResult.ReportData> data_head_equal_tail = new ArrayList<>();
        List<ReportResult.ReportData> data = new ArrayList<>();
        for (AppearanceCount count : cal_data.getTotal_count()) {
            if (count.getNumber().substring(1).equals(count.getNumber().substring(0, 1))) {
                List<AppearanceCount> head_equal_tails = cal_data.getTotal_count().stream()
                        .filter(f -> !f.getNumber().equals(count.getNumber()) && f.getNumber().substring(1).equals(f.getNumber().substring(0, 1)))
                        .collect(Collectors.toList());
                if (CollectionUtils.isNotEmpty(head_equal_tails)) {
                    for (AppearanceCount head_equal_tail : head_equal_tails) {
                        List<String> pair = Arrays.asList(count.getNumber(), head_equal_tail.getNumber());
                        ReportResult.ReportData exist = data_head_equal_tail.stream().filter(f -> new HashSet<>(f.getCollection()).containsAll(pair)).findFirst().orElse(null);
                        if (exist != null) {
                            continue;
                        }

                        data_head_equal_tail.add(ReportResult.ReportData.builder()
                                .collection(pair)
                                .count(count.getCount() + head_equal_tail.getCount())
                                .build());
                    }
                }
            } else {
                List<String> pair = Arrays.asList(count.getNumber(), count.getNumber().substring(1) + count.getNumber().charAt(0));
                ReportResult.ReportData exist = data.stream().filter(f -> new HashSet<>(f.getCollection()).containsAll(pair)).findFirst().orElse(null);
                if (exist != null) {
                    continue;
                }

                cal_data.getTotal_count().stream().filter(f -> f.getNumber().equals(pair.get(1)))
                        .findFirst().ifPresent(reverse_count -> data.add(ReportResult.ReportData.builder()
                                .collection(pair)
                                .count(count.getCount() + reverse_count.getCount())
                                .build()));
            }

        }
        data.addAll(data_head_equal_tail);
        if (CollectionUtils.isEmpty(data)) {
            return data;
        }

        for (ReportResult.ReportData item : data) {
            Collections.sort(item.getCollection());
            item.setMiss(0);
            item.setDay_1(0);
            item.setDay_2(0);
            item.setDay_3(0);
            item.setData_by_date(new ArrayList<>());

            int miss_count = 0;
            ReportResult.DataByNumber data_num1 = ReportResult.DataByNumber.builder()
                    .number(item.getCollection().get(0))
                    .day_1(0)
                    .day_2(0)
                    .day_3(0)
                    .build();
            ReportResult.DataByNumber data_num2 = ReportResult.DataByNumber.builder()
                    .number(item.getCollection().get(1))
                    .day_1(0)
                    .day_2(0)
                    .day_3(0)
                    .build();

            for (Appearance appearance : cal_data.getAppearances()) {
                boolean miss = true;
                ReportResult.DataByDate data_date = ReportResult.DataByDate.builder()
                        .date(appearance.getDate())
                        .day_1(0)
                        .day_2(0)
                        .day_3(0)
                        .build();

                // number 1, day 1
                AppearanceCount data_11 = appearance.getDay_1().stream().filter(f -> f.getNumber().equals(item.getCollection().get(0))).findFirst().orElse(null);
                if (data_11 != null) {
                    data_num1.setDay_1(data_num1.getDay_1() + data_11.getCount());
                    data_date.setDay_1(data_date.getDay_1() + data_11.getCount());
                    item.setDay_1(item.getDay_1() + data_11.getCount());
                    miss = false;
                }
                // number 2, day 1
                AppearanceCount data_21 = appearance.getDay_1().stream().filter(f -> f.getNumber().equals(item.getCollection().get(1))).findFirst().orElse(null);
                if (data_21 != null) {
                    data_num2.setDay_1(data_num2.getDay_1() + data_21.getCount());
                    data_date.setDay_1(data_date.getDay_1() + data_21.getCount());
                    item.setDay_1(item.getDay_1() + data_21.getCount());
                    miss = false;
                }

                // number 1, day 2
                AppearanceCount data_12 = appearance.getDay_2().stream().filter(f -> f.getNumber().equals(item.getCollection().get(0))).findFirst().orElse(null);
                if (data_12 != null) {
                    data_num1.setDay_2(data_num1.getDay_2() + data_12.getCount());
                    data_date.setDay_2(data_date.getDay_2() + data_12.getCount());
                    item.setDay_2(item.getDay_2() + data_12.getCount());
                    miss = false;
                }
                // number 2, day 2
                AppearanceCount data_22 = appearance.getDay_2().stream().filter(f -> f.getNumber().equals(item.getCollection().get(1))).findFirst().orElse(null);
                if (data_22 != null) {
                    data_num2.setDay_2(data_num2.getDay_2() + data_22.getCount());
                    data_date.setDay_2(data_date.getDay_2() + data_22.getCount());
                    item.setDay_2(item.getDay_2() + data_22.getCount());
                    miss = false;
                }

                // number 1, day 3
                AppearanceCount data_13 = appearance.getDay_3().stream().filter(f -> f.getNumber().equals(item.getCollection().get(0))).findFirst().orElse(null);
                if (data_13 != null) {
                    data_num1.setDay_3(data_num1.getDay_3() + data_13.getCount());
                    data_date.setDay_3(data_date.getDay_3() + data_13.getCount());
                    item.setDay_3(item.getDay_3() + data_13.getCount());
                    miss = false;
                }
                // number 2, day 2
                AppearanceCount data_23 = appearance.getDay_3().stream().filter(f -> f.getNumber().equals(item.getCollection().get(1))).findFirst().orElse(null);
                if (data_23 != null) {
                    data_num2.setDay_3(data_num2.getDay_3() + data_23.getCount());
                    data_date.setDay_3(data_date.getDay_3() + data_23.getCount());
                    item.setDay_3(item.getDay_3() + data_23.getCount());
                    miss = false;
                }

                if (BooleanUtils.isTrue(miss)) {
                    miss_count += 1;
                } else {
                    if (data_date.getDay_1() == 0) {
                        data_date.setDay_1(null);
                    }
                    if (data_date.getDay_2() == 0) {
                        data_date.setDay_2(null);
                    }
                    if (data_date.getDay_3() == 0) {
                        data_date.setDay_3(null);
                    }
                    item.getData_by_date().add(data_date);
                }
                item.setMiss(miss_count);
            }
            item.setCount(item.getDay_1() + item.getDay_2() + item.getDay_3());

            if (data_num1.getDay_1() == 0) {
                data_num1.setDay_1(null);
            }
            if (data_num1.getDay_2() == 0) {
                data_num1.setDay_2(null);
            }
            if (data_num1.getDay_3() == 0) {
                data_num1.setDay_3(null);
            }
            if (data_num2.getDay_1() == 0) {
                data_num2.setDay_1(null);
            }
            if (data_num2.getDay_2() == 0) {
                data_num2.setDay_2(null);
            }
            if (data_num2.getDay_3() == 0) {
                data_num2.setDay_3(null);
            }
            item.setData_by_number(Arrays.asList(data_num1, data_num2));
        }
        data.sort((data1, data2) -> data2.getCount().compareTo(data1.getCount()));
        return data;
    }

    private List<ReportResult.ReportData> combinePairAndCalculateTotalV2(CommandCalculateReport cal_data, Integer limit) {
        List<ReportResult.ReportData> data = new ArrayList<>();
        cal_data.getTotal_count().sort((data1, data2) -> data2.getCount().compareTo(data1.getCount()));
        List<String> numbers = cal_data.getTotal_count().stream().map(AppearanceCount::getNumber).collect(Collectors.toList());
        if (limit == null || limit == 0) {
            limit = 10;
        }
        if (numbers.size() > limit) {
            numbers = numbers.subList(0, limit);
        }
        List<List<String>> combinations = CommonUtils.getAllCombinations(numbers, 2);
        for (List<String> combination : combinations) {
            ReportResult.ReportData exist = data.stream().filter(f -> new HashSet<>(f.getCollection()).containsAll(combination)).findFirst().orElse(null);
            if (exist != null) {
                continue;
            }
            List<AppearanceCount> founds = cal_data.getTotal_count().stream().filter(f -> combination.contains(f.getNumber())).collect(Collectors.toList());
            if (CollectionUtils.isNotEmpty(founds)) {
                Integer total = 0;
                for (AppearanceCount item : founds) {
                    total += item.getCount();
                }
                data.add(ReportResult.ReportData.builder()
                        .collection(combination)
                        .count(total)
                        .build());
            }
        }
        if (CollectionUtils.isEmpty(data)) {
            return data;
        }

        for (ReportResult.ReportData item : data) {
            Collections.sort(item.getCollection());
            item.setMiss(0);
            item.setDay_1(0);
            item.setDay_2(0);
            item.setDay_3(0);
            item.setData_by_date(new ArrayList<>());

            int miss_count = 0;
            ReportResult.DataByNumber data_num1 = ReportResult.DataByNumber.builder()
                    .number(item.getCollection().get(0))
                    .day_1(0)
                    .day_2(0)
                    .day_3(0)
                    .build();
            ReportResult.DataByNumber data_num2 = ReportResult.DataByNumber.builder()
                    .number(item.getCollection().get(1))
                    .day_1(0)
                    .day_2(0)
                    .day_3(0)
                    .build();

            for (Appearance appearance : cal_data.getAppearances()) {
                Boolean miss = true;
                ReportResult.DataByDate data_date = ReportResult.DataByDate.builder()
                        .date(appearance.getDate())
                        .day_1(0)
                        .day_2(0)
                        .day_3(0)
                        .build();

                // number 1, day 1
                AppearanceCount data_11 = appearance.getDay_1().stream().filter(f -> f.getNumber().equals(item.getCollection().get(0))).findFirst().orElse(null);
                if (data_11 != null) {
                    data_num1.setDay_1(data_num1.getDay_1() + data_11.getCount());
                    data_date.setDay_1(data_date.getDay_1() + data_11.getCount());
                    item.setDay_1(item.getDay_1() + data_11.getCount());
                    miss = false;
                }
                // number 2, day 1
                AppearanceCount data_21 = appearance.getDay_1().stream().filter(f -> f.getNumber().equals(item.getCollection().get(1))).findFirst().orElse(null);
                if (data_21 != null) {
                    data_num2.setDay_1(data_num2.getDay_1() + data_21.getCount());
                    data_date.setDay_1(data_date.getDay_1() + data_21.getCount());
                    item.setDay_1(item.getDay_1() + data_21.getCount());
                    miss = false;
                }

                // number 1, day 2
                AppearanceCount data_12 = appearance.getDay_2().stream().filter(f -> f.getNumber().equals(item.getCollection().get(0))).findFirst().orElse(null);
                if (data_12 != null) {
                    data_num1.setDay_2(data_num1.getDay_2() + data_12.getCount());
                    data_date.setDay_2(data_date.getDay_2() + data_12.getCount());
                    item.setDay_2(item.getDay_2() + data_12.getCount());
                    miss = false;
                }
                // number 2, day 2
                AppearanceCount data_22 = appearance.getDay_2().stream().filter(f -> f.getNumber().equals(item.getCollection().get(1))).findFirst().orElse(null);
                if (data_22 != null) {
                    data_num2.setDay_2(data_num2.getDay_2() + data_22.getCount());
                    data_date.setDay_2(data_date.getDay_2() + data_22.getCount());
                    item.setDay_2(item.getDay_2() + data_22.getCount());
                    miss = false;
                }

                // number 1, day 3
                AppearanceCount data_13 = appearance.getDay_3().stream().filter(f -> f.getNumber().equals(item.getCollection().get(0))).findFirst().orElse(null);
                if (data_13 != null) {
                    data_num1.setDay_3(data_num1.getDay_3() + data_13.getCount());
                    data_date.setDay_3(data_date.getDay_3() + data_13.getCount());
                    item.setDay_3(item.getDay_3() + data_13.getCount());
                    miss = false;
                }
                // number 2, day 2
                AppearanceCount data_23 = appearance.getDay_3().stream().filter(f -> f.getNumber().equals(item.getCollection().get(1))).findFirst().orElse(null);
                if (data_23 != null) {
                    data_num2.setDay_3(data_num2.getDay_3() + data_23.getCount());
                    data_date.setDay_3(data_date.getDay_3() + data_23.getCount());
                    item.setDay_3(item.getDay_3() + data_23.getCount());
                    miss = false;
                }

                if (BooleanUtils.isTrue(miss)) {
                    miss_count += 1;
                } else {
                    if (data_date.getDay_1() == 0) {
                        data_date.setDay_1(null);
                    }
                    if (data_date.getDay_2() == 0) {
                        data_date.setDay_2(null);
                    }
                    if (data_date.getDay_3() == 0) {
                        data_date.setDay_3(null);
                    }
                    item.getData_by_date().add(data_date);
                }
                item.setMiss(miss_count);
            }
            item.setCount(item.getDay_1() + item.getDay_2() + item.getDay_3());

            if (data_num1.getDay_1() == 0) {
                data_num1.setDay_1(null);
            }
            if (data_num1.getDay_2() == 0) {
                data_num1.setDay_2(null);
            }
            if (data_num1.getDay_3() == 0) {
                data_num1.setDay_3(null);
            }
            if (data_num2.getDay_1() == 0) {
                data_num2.setDay_1(null);
            }
            if (data_num2.getDay_2() == 0) {
                data_num2.setDay_2(null);
            }
            if (data_num2.getDay_3() == 0) {
                data_num2.setDay_3(null);
            }
            item.setData_by_number(Arrays.asList(data_num1, data_num2));
        }
        data.sort((data1, data2) -> data2.getCount().compareTo(data1.getCount()));
        return data;
    }

    private List<ReportResult> getResultFromFutures(List<Future<List<ReportResult>>> futures, CommandReport.Limitation limitation) {
        List<ReportResult> results = new ArrayList<>();
        if (CollectionUtils.isEmpty(futures)) {
            return results;
        }
        for (Future<List<ReportResult>> future : futures) {
            try {
                List<ReportResult> future_results = future.get();
                if (CollectionUtils.isNotEmpty(future_results)) {
                    results.addAll(future_results);
                }
            } catch (InterruptedException | ExecutionException e) {
                // ignore
            }
        }

        results.sort((data1, data2) -> data2.getMax_count().compareTo(data1.getMax_count()));
        if (limitation != null && limitation.getNum_result() != null && limitation.getNum_result() > 0 && results.size() > limitation.getNum_result()) {
            results = results.subList(0, limitation.getNum_result());
        }
        return results;
    }

    public Optional<Boolean> crawlDataBetweenRage(Long from, Long to) {
        if (from == null || to == null || from > to) {
            return Optional.of(false);
        }
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(from);

        while (calendar.getTimeInMillis() <= to) {
            calendar.setTimeInMillis(from);

            String date = calendar.get(Calendar.DAY_OF_MONTH) + "-" + (calendar.get(Calendar.MONTH) + 1) + "-" + calendar.get(Calendar.YEAR);
            String url = CommonConstant.CRAWL_URL.replace("{{date}}", date);

            OkHttpClient client = new OkHttpClient();
            Request request = new Request.Builder()
                    .url(url)
                    .build();
            try {
                ResponseBody body = client.newCall(request).execute().body();
                if (body != null) {
                    String response_string = body.string();
                    CommandCrawlResult command = JSON.parseObject(response_string, CommandCrawlResult.class);
                    if (command != null && CollectionUtils.isNotEmpty(command.getĐB())) {
                        date = DateTimeUtils.convertLongToDate(DateTimeEnum.Pattern.DATE, calendar.getTimeInMillis());
                        CommandLottery command_lottery = this.buildCommandFromCrawlData(date, command);
                        Lottery lottery = this.addOrUpdate(command_lottery).orElse(null);
                        if (lottery == null) {
                            log.info("add fail: " + date);
                        }
                    }
                }
            } catch (IOException | CustomException e) {
                log.info(date);
                e.printStackTrace();
            }

            from = from + TimeEnum.LONG_MILLISECOND_OF_ONE_DAY;
        }

        return Optional.of(true);
    }

    private CommandLottery buildCommandFromCrawlData(String date, CommandCrawlResult crawl_data) {
        if (crawl_data == null || date == null) {
            return null;
        }
        CommandLottery command = CommandLottery.builder()
                .date(date)
                .build();
        if (CollectionUtils.isNotEmpty(crawl_data.getĐB()) && !crawl_data.getĐB().contains("Đang cập nhật")) {
            command.setPrice_db(crawl_data.getĐB().get(0));
        }
        if (CollectionUtils.isNotEmpty(crawl_data.getG1()) && !crawl_data.getG1().contains("Đang cập nhật")) {
            command.setPrice_1(crawl_data.getG1().get(0));
        }
        if (CollectionUtils.isNotEmpty(crawl_data.getG2()) && crawl_data.getG2().size() == 2 && !crawl_data.getG2().contains("Đang cập nhật")) {
            command.setPrice_21(crawl_data.getG2().get(0));
            command.setPrice_22(crawl_data.getG2().get(1));
        }
        if (CollectionUtils.isNotEmpty(crawl_data.getG3()) && crawl_data.getG3().size() == 6 && !crawl_data.getG3().contains("Đang cập nhật")) {
            command.setPrice_31(crawl_data.getG3().get(0));
            command.setPrice_32(crawl_data.getG3().get(1));
            command.setPrice_33(crawl_data.getG3().get(2));
            command.setPrice_34(crawl_data.getG3().get(3));
            command.setPrice_35(crawl_data.getG3().get(4));
            command.setPrice_36(crawl_data.getG3().get(5));
        }
        if (CollectionUtils.isNotEmpty(crawl_data.getG4()) && crawl_data.getG4().size() == 4 && !crawl_data.getG4().contains("Đang cập nhật")) {
            command.setPrice_41(crawl_data.getG4().get(0));
            command.setPrice_42(crawl_data.getG4().get(1));
            command.setPrice_43(crawl_data.getG4().get(2));
            command.setPrice_44(crawl_data.getG4().get(3));
        }
        if (CollectionUtils.isNotEmpty(crawl_data.getG5()) && crawl_data.getG5().size() == 6 && !crawl_data.getG5().contains("Đang cập nhật")) {
            command.setPrice_51(crawl_data.getG5().get(0));
            command.setPrice_52(crawl_data.getG5().get(1));
            command.setPrice_53(crawl_data.getG5().get(2));
            command.setPrice_54(crawl_data.getG5().get(3));
            command.setPrice_55(crawl_data.getG5().get(4));
            command.setPrice_56(crawl_data.getG5().get(5));
        }
        if (CollectionUtils.isNotEmpty(crawl_data.getG6()) && crawl_data.getG6().size() == 3 && !crawl_data.getG6().contains("Đang cập nhật")) {
            command.setPrice_61(crawl_data.getG6().get(0));
            command.setPrice_62(crawl_data.getG6().get(1));
            command.setPrice_63(crawl_data.getG6().get(2));
        }
        if (CollectionUtils.isNotEmpty(crawl_data.getG7()) && crawl_data.getG7().size() == 4 && !crawl_data.getG7().contains("Đang cập nhật")) {
            command.setPrice_71(crawl_data.getG7().get(0));
            command.setPrice_72(crawl_data.getG7().get(1));
            command.setPrice_73(crawl_data.getG7().get(2));
            command.setPrice_74(crawl_data.getG7().get(3));
        }

        return command;
    }

    public List<Document> checkData(Long fromDate, Long toDate) throws CustomException {
        if (toDate > System.currentTimeMillis()) {
            toDate = System.currentTimeMillis();
        }

        if (fromDate > toDate || fromDate > System.currentTimeMillis()) {
            throw new CustomException(Exception.INVALID_DATA);
        }

        Map<String, Object> query = new HashMap<>();
        query.put("date", new Document("$gte", fromDate).append("$lte", toDate));
        List<Lottery> lotteries = mongoDBOperator.search(query, new HashMap<>(), new HashMap<>(), 0, 0);

        List<Document> result = new ArrayList<>();

        while (fromDate <= toDate) {
            Long finalFrom_date = fromDate;
            List<Lottery> founds = lotteries.stream()
                    .filter(f -> f.getDate().equals(finalFrom_date))
                    .collect(Collectors.toList());
            Document data = new Document();
            data.put("date", DateTimeUtils.convertLongToDate("dd/MM/yyyy", fromDate));

            if (CollectionUtils.isEmpty(founds)) {
                data.put("status", "miss");
                result.add(data);
            } else {
                founds.remove(0);
                if (CollectionUtils.isNotEmpty(founds)) {
                    for (Lottery lottery : founds) {
                        mongoDBOperator.removeMany(new Document("_id", lottery.get_id()));
                    }
                }
            }
            fromDate += TimeEnum.LONG_MILLISECOND_OF_ONE_DAY;
        }

        return result;
    }
}
