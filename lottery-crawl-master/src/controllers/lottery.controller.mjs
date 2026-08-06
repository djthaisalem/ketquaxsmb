import axios from 'axios';
import cheerio from 'cheerio';
const lotteryController = {};

lotteryController.getByDate = async (req, res) => {
  try {
    if (!req.query || !req.query.date) {
      res.status(200).json({});
      return;
    }

    const numbers = [];
    const names = [];
    const results = {};

    let url = 'https://az24.vn/xsmb-' + req.query.date + '.html';
    const result = await axios(url, {
      method: 'GET',
    });

    if (!result) {
      res.status(200).json({});
      return;
    }
    const html = result.data;
    const $ = cheerio.load(html);

    $('table:nth-child(1)', html)
      .first()
      .each(function () {
        $(this)
          .find('td.v-giai > span ')
          .each(function () {
            numbers.push($(this).text());
          });

        $(this)
          .find('tr > td:first-child')
          .each(function (i) {
            const name = $(this).text();

            if (!name.includes('Mã ĐB')) {
              if (names.includes(name)) {
                return;
              } else {
                names.push(name.replace('Giải', 'G').split(' ').join(''));
              }
            }
          });
      });
    numbers.splice(0, 1); // xóa phần tử đầu tiên
    if (numbers.length > 0) {
      for (let i = 0; i < names.length; i++) {
        results[names[0]] = [numbers[0] ? numbers[0] : 'Đang cập nhật'];
        results[names[1]] = [numbers[1] ? numbers[1] : 'Đang cập nhật'];
        results[names[2]] = [
          numbers[2] ? numbers[2] : 'Đang cập nhật',
          numbers[3] ? numbers[3] : 'Đang cập nhật',
        ];
        results[names[3]] = [
          numbers[4] ? numbers[4] : 'Đang cập nhật',
          numbers[5] ? numbers[5] : 'Đang cập nhật',
          numbers[6] ? numbers[6] : 'Đang cập nhật',
          numbers[7] ? numbers[7] : 'Đang cập nhật',
          numbers[8] ? numbers[8] : 'Đang cập nhật',
          numbers[9] ? numbers[9] : 'Đang cập nhật',
        ];
        results[names[4]] = [
          numbers[10] ? numbers[10] : 'Đang cập nhật',
          numbers[11] ? numbers[11] : 'Đang cập nhật',
          numbers[12] ? numbers[12] : 'Đang cập nhật',
          numbers[13] ? numbers[13] : 'Đang cập nhật',
        ];
        results[names[5]] = [
          numbers[14] ? numbers[14] : 'Đang cập nhật',
          numbers[15] ? numbers[15] : 'Đang cập nhật',
          numbers[16] ? numbers[16] : 'Đang cập nhật',
          numbers[17] ? numbers[17] : 'Đang cập nhật',
          numbers[18] ? numbers[18] : 'Đang cập nhật',
          numbers[19] ? numbers[19] : 'Đang cập nhật',
        ];
        results[names[6]] = [
          numbers[20] ? numbers[20] : 'Đang cập nhật',
          numbers[21] ? numbers[21] : 'Đang cập nhật',
          numbers[22] ? numbers[22] : 'Đang cập nhật',
        ];
        results[names[7]] = [
          numbers[23] ? numbers[23] : 'Đang cập nhật',
          numbers[24] ? numbers[24] : 'Đang cập nhật',
          numbers[25] ? numbers[25] : 'Đang cập nhật',
          numbers[26] ? numbers[26] : 'Đang cập nhật',
        ];
      }
    }

    res.status(200).json({
      ...results,
    });
  } catch (error) {
    /*
     * catch error
     */
    console.log(error);
    res.status(500).json({ message: 'HTTP 500 Internal server error' });
  }
};

export default lotteryController;
