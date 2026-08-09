# Report backtest soi ngược Match Rule V1

Ngày lập: 09/08/2026  
Phạm vi dữ liệu: 01/01/2005 đến trước từng ngày target  
Mục đích: nghiên cứu độc lập; không tích hợp CMS, VIP 1, VIP 2 hoặc đề xuất người dùng.

## Cách kiểm tra

- Mỗi ngày target tạo đúng `C(27,3) = 2.925` combo theo vị trí từ 27 kết quả lô hai số.
- Đối chiếu với 50 cặp số đã định nghĩa trong tài liệu.
- Mỗi ngày lịch sử được rút gọn thành tập lô hai số xuất hiện trong ngày đó.
- Không dùng dữ liệu của ngày target trong tập lịch sử.
- Xếp hạng theo cận dưới Wilson 95%, sau đó mới đến tỷ lệ thô.

Các rule được kiểm tra:

1. **Balanced:** ít nhất 2/3 số combo xuất hiện và đủ 2/2 số của cặp.
2. **Strict:** đủ 3/3 số combo xuất hiện và đủ 2/2 số của cặp.
3. **Loose:** ít nhất 1/3 số combo xuất hiện và đủ 2/2 số của cặp.
4. **Baseline giao cặp:** đủ 2/2 số của cặp và combo có giao tĩnh với cặp.

## Kết quả tốt nhất theo ngày target

| Target | Rule | Combo + cặp tốt nhất | Trúng / mẫu | Tỷ lệ | Wilson thấp 95% |
|---|---|---|---:|---:|---:|
| 01/07/2026 | Balanced | 54-36-36 + 36-63 | 430/7.843 | 5,48% | 5,00% |
| 01/07/2026 | Strict | 54-54-92 + 29-92 | 120/7.843 | 1,53% | 1,28% |
| 01/07/2026 | Loose | 54-24-91 + 19-91 | 462/7.843 | 5,89% | 5,39% |
| 01/07/2026 | Baseline | 54-24-91 + 19-91 | 462/7.843 | 5,89% | 5,39% |
| 15/07/2026 | Balanced | 19-92-19 + 19-91 | 463/7.857 | 5,89% | 5,39% |
| 15/07/2026 | Strict | 19-19-08 + 19-91 | 131/7.857 | 1,67% | 1,41% |
| 15/07/2026 | Loose | 19-92-86 + 68-86 | 490/7.857 | 6,24% | 5,72% |
| 15/07/2026 | Baseline | 19-92-86 + 68-86 | 490/7.857 | 6,24% | 5,72% |
| 31/07/2026 | Balanced | 10-38-83 + 38-83 | 451/7.873 | 5,73% | 5,24% |
| 31/07/2026 | Strict | 68-15-15 + 68-86 | 122/7.873 | 1,55% | 1,30% |
| 31/07/2026 | Loose | 10-59-68 + 68-86 | 493/7.873 | 6,26% | 5,75% |
| 31/07/2026 | Baseline | 10-59-68 + 68-86 | 493/7.873 | 6,26% | 5,75% |
| 08/08/2026 | Balanced | 22-02-02 + 02-20 | 455/7.881 | 5,77% | 5,28% |
| 08/08/2026 | Strict | 22-02-02 + 02-20 | 116/7.881 | 1,47% | 1,23% |
| 08/08/2026 | Loose | 22-27-19 + 19-91 | 464/7.881 | 5,89% | 5,39% |
| 08/08/2026 | Baseline | 22-27-19 + 19-91 | 464/7.881 | 5,89% | 5,39% |

## Nhận định

1. **Chưa có rule nào đủ mạnh để áp dụng.** Tỷ lệ cao nhất là 6,26%, không phải một winrate cao theo nghĩa dự báo.
2. **Loose không tạo thêm thông tin.** Ở cả bốn target, kết quả Loose bằng chính xác baseline. Điều này cho thấy điều kiện `1/3 combo` gần như chỉ là hệ quả của việc combo giao với cặp, không tạo lực chọn độc lập.
3. **Balanced chưa vượt baseline ổn định.** Có target bằng/gần baseline, có target thấp hơn. Chưa thấy lift có thể tái lập.
4. **Strict quá ít tín hiệu.** Tỷ lệ 1,47–1,67% làm số mẫu trúng thấp và không phù hợp làm phương pháp ưu tiên.
5. Việc soi ngược rồi thấy số đã về trong quá khứ chứng minh truy vấn khớp dữ liệu, nhưng **chưa chứng minh khả năng dự báo tương lai**. Muốn đánh giá dự báo phải khóa công thức ở ngày D, chỉ dùng dữ liệu trước D, rồi kiểm tra kết quả D+1/D+2 trên nhiều cửa sổ walk-forward.

## Khuyến nghị

- Không đưa các rule này vào VIP hoặc giao diện CMS ở thời điểm hiện tại.
- Nếu nghiên cứu tiếp, chỉ giữ **Balanced** làm ứng viên vì có điều kiện combo thực sự; Loose và baseline chỉ dùng làm đối chứng, Strict dùng kiểm tra độ chặt.
- Bước tiếp theo cần làm là walk-forward theo ngày, so Balanced với baseline cặp trên cùng số lượng lựa chọn, báo cáo riêng D+1 và D+2, đồng thời kiểm tra theo từng giai đoạn 2005–2020, 2021–2024 và 2025–nay.
- Chỉ xem xét đưa vào Backtest nội bộ khi lift ngoài mẫu dương, cận dưới Wilson vượt baseline và kết quả không sụp ở giai đoạn gần nhất.

## Kết luận

Ở dạng hiện tại, công thức soi ngược hữu ích để kiểm tra sự đồng xuất hiện trong lịch sử, nhưng chưa phải phương pháp dự đoán có lợi thế. Không nên chọn vì tỷ lệ nhìn có vẻ cao hoặc vì một số “đẹp”; ưu tiên duy nhất đáng nghiên cứu tiếp là Balanced, nhưng bắt buộc phải qua walk-forward D+1/D+2 trước.
