# ketquaxsmb.online

Ứng dụng kết quả XSMB, thống kê và khu vực thành viên.

## Thành phần

- `lottery-crawl-master`: Node.js/Express API, PostgreSQL, crawler và CMS API.
- `lottery-frontend-master`: React dashboard người dùng và CMS.

## Dữ liệu

PostgreSQL, `.env`, tệp backup và các thư mục build không được đưa lên Git. Dữ liệu production sẽ được sao lưu định kỳ về máy local bằng `pg_dump` sau khi server được cấu hình.
