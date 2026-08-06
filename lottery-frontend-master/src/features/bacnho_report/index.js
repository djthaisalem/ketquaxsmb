import React, { useEffect, useState } from 'react';
import './index.css';

import PrimaryButton from '../../components/button/primary_button';
import PrimaryInput from '../../components/input/primary_input';
import SingleSelect from '../../components/input/single_select';
import ResultList from '../../components/list';
import commonUtils from '../../utils/commonUtils';
import dateTimeUtils from '../../utils/dateTimeUtils';

import lotteryApi from '../../api/lottery.api';

const reportTypeData = {
  field: {
    label: 'Loại:',
  },
  options: [
    { value: 'price', label: 'Bạc nhớ theo giải' },
    { value: 'miss_head', label: 'Bạc nhớ đầu câm' },
    { value: 'miss_tail', label: 'Bạc nhớ đuôi câm' },
    { value: 'double', label: 'Bạc nhớ theo nháy đôi' },
    { value: 'triple', label: 'Bạc nhớ theo nháy ba' },
    { value: 'two_number', label: 'Ghép 2 số' },
    { value: 'three_numbers', label: 'Ghép 3 số' },
  ],
};

const missData = {
  field: {
    label: 'Miss:',
    name: 'miss',
  },
  options: [
    { value: '0', label: '0' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
  ],
};

const fromDate = {
  field: {
    label: 'Từ:',
    name: 'from',
    type: 'date',
  },
};

const toDate = {
  field: {
    label: 'Đến:',
    name: 'to',
    type: 'date',
  },
};

const numCollectionData = {
  field: {
    label: 'Số cặp số:',
    name: 'num_collection',
  },
};

const numResultData = {
  field: {
    label: 'Số kết quả:',
    name: 'num_result',
  },
};

const countData = {
  field: {
    label: 'Số lần xuất hiện:',
    name: 'count',
  },
};

const twoDayFrame = {
  field: {
    label: 'Khung 2 ngày: ',
    name: 'two_day_frame',
    type: 'checkbox',
  },
};

const prices = [
  'db',
  '1',
  '21',
  '22',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '41',
  '42',
  '43',
  '44',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '61',
  '62',
  '63',
  '71',
  '72',
  '73',
  '74',
];

const BacnhoReport = () => {
  const [reportData, setReportData] = useState([]);
  const [newestData, setNewestData] = useState({});
  const [reportType, setReportType] = useState('price');
  const [selected, setSelected] = useState([...prices]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      let result = await lotteryApi.getNewest();
      setNewestData(result);
    }
    fetchData();
  }, []);

  function changeReportType(type) {
    setReportType(type);
  }

  function checkboxOnchange(ele) {
    let newSelected = [...selected];
    if (newSelected.includes(ele)) {
      var index = newSelected.indexOf(ele);
      if (index > -1) {
        newSelected.splice(index, 1);
      }
    } else {
      newSelected.push(ele);
    }
    setSelected(newSelected);
  }

  async function dateChange(date) {
    if (!date) {
      return;
    }
    let split = date.split('-');
    if (split[0] < 2010 || split[0] > 3000) {
      return;
    }
    let result = await lotteryApi.getByDate(
      split[2] + '/' + split[1] + '/' + split[0],
    );
    if (result) {
      setNewestData(result);
    }
  }

  function toggleSelectAll(ele) {
    if (selected.length === 27) {
      setSelected([]);
    } else {
      setSelected([...prices]);
    }
  }

  function getTenYearBefore(string) {
    let splits = string.split('/');
    let year = splits[2] - 10;
    return dateTimeUtils.formatDate(
      dateTimeUtils.parseDateFromString([splits[0], splits[1], year].join('/')),
      'yyyy-MM-dd',
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let submitData = {
      range: {
        from: dateTimeUtils.convertYYYYMMddToddMMYYY(
          e.target.elements.from?.value,
        ),
        to: dateTimeUtils.convertYYYYMMddToddMMYYY(e.target.elements.to?.value),
      },
      limitation: {
        num_result: 0,
        miss: e.target.elements.miss?.value ? e.target.elements.miss?.value : 3,
        num_collection: e.target.elements.num_collection?.value
          ? e.target.elements.num_collection?.value
          : 3,
        count: e.target.elements.count?.value
          ? e.target.elements.count?.value
          : 30,
        two_day_frame: e.target.elements.two_day_frame?.checked,
      },
    };

    let result = [];

    if ('price' === reportType) {
      submitData.prices = prices
        .map((ele) => {
          if (selected.includes(ele)) {
            return {
              price: ele,
              number: e.target.elements['price_' + ele]?.value,
            };
          } else {
            return undefined;
          }
        })
        .filter((f) => f !== undefined);

      result = await lotteryApi.reportByBacNho(submitData, reportType);
      if (result && result.length) {
        result = selected
          .map((ele) => {
            let found = result.filter((f) => f.target === ele);
            if (found && found.length) {
              if ('db' === found[0].target) {
                found[0].target = 'Giải đặc biệt';
              } else if ('1' === found[0].target) {
                found[0].target = 'Giải nhất';
              } else {
                found[0].target = ele[0] + '.' + ele[1];
              }
              return found[0];
            } else {
              return undefined;
            }
          })
          .filter((f) => f !== undefined);
      }
    } else if ('two_number' === reportType || 'three_numbers' === reportType) {
      submitData.limitation.num_result = e.target.elements.num_result?.value
        ? e.target.elements.num_result?.value
        : 50;
      result = await lotteryApi.reportByBacNho(submitData, reportType);
    } else {
      result = await lotteryApi.reportByBacNho(submitData, reportType);
    }

    if (result) {
      setReportData(result);
    }
    setIsLoading(false);
  };

  return (
    <>
      <main className='bacnho-report-main out-let'>
        <div className='module-header'>
          <form
            className='report-config'
            onSubmit={(e) => {
              setReportData([]);
              handleSubmit(e);
            }}
          >
            <div className='rc-options'>
              <div className='rc-options-1'>
                <SingleSelect
                  data={reportTypeData.field}
                  options={reportTypeData.options}
                  width={'250px'}
                  onChange={changeReportType}
                  defaultValue={reportTypeData.options[0]}
                />

                <SingleSelect
                  data={missData.field}
                  options={missData.options}
                  width={'90px'}
                  defaultValue={missData.options[missData.options.length - 1]}
                />

                <PrimaryInput
                  data={countData.field}
                  width={'70px'}
                  defaultValue={30}
                  labelBefore={true}
                />
                <PrimaryInput
                  data={numCollectionData.field}
                  width={'70px'}
                  defaultValue={1}
                  labelBefore={true}
                />
                {'two_number' === reportType ||
                'three_numbers' === reportType ? (
                  <PrimaryInput
                    data={numResultData.field}
                    width={'70px'}
                    defaultValue={50}
                    labelBefore={true}
                  />
                ) : (
                  <></>
                )}
              </div>

              <div className='rc-options-2'>
                <PrimaryInput
                  data={fromDate.field}
                  width={'150px'}
                  labelBefore={true}
                  readOnly={false}
                />
                <PrimaryInput
                  data={toDate.field}
                  width={'150px'}
                  labelBefore={true}
                  value={
                    newestData && newestData.date_string
                      ? dateTimeUtils.formatDate(
                          dateTimeUtils.parseDateFromString(
                            newestData.date_string,
                          ),
                          'yyyy-MM-dd',
                        )
                      : ''
                  }
                  onChange={dateChange}
                />

                <PrimaryInput
                  data={twoDayFrame.field}
                  width={'50px'}
                  labelWidth={'115px'}
                  labelBefore={true}
                />
              </div>
            </div>
            <div className='rc-filter'>
              {'price' === reportType ? (
                <>
                  <div className='rc-filter-select-all'>
                    <PrimaryInput
                      data={{
                        type: 'checkbox',
                        label:
                          selected.length === 27
                            ? 'Bỏ chọn tất cả'
                            : 'Chọn tất cả',
                      }}
                      width={'50px'}
                      labelWidth={'135px'}
                      labelAfter={true}
                      defaultValue={true}
                      checked={selected.length === 27 ? true : false}
                      onChange={toggleSelectAll}
                    />
                  </div>
                  <div className='rc-filter-select'>
                    {prices.map((ele) => {
                      let label = 'Giải ';
                      if ('db' === ele) {
                        label = label + 'đặc biệt';
                      } else if ('1' === ele) {
                        label = label + 'nhất';
                      } else {
                        label = label + ele[0] + '.' + ele[1];
                      }
                      if (newestData['short_' + ele]) {
                        label = label + ': ' + newestData['short_' + ele];
                      }
                      let data = {
                        type: 'checkbox',
                        name: 'price_' + ele,
                        label: label,
                        customValue: ele,
                      };

                      return (
                        <PrimaryInput
                          key={ele}
                          data={data}
                          width={'50px'}
                          labelWidth={'135px'}
                          labelAfter={true}
                          value={newestData['short_' + ele]}
                          checked={selected.includes(ele) ? true : false}
                          onChange={checkboxOnchange}
                        />
                      );
                    })}
                  </div>
                </>
              ) : (
                <></>
              )}
              {'miss_head' === reportType && newestData ? (
                <div>
                  {!newestData.miss_heads || !newestData.miss_heads.length ? (
                    <h2>Không có đầu câm</h2>
                  ) : (
                    <h2>Đầu câm: {newestData.miss_heads.join(',')}</h2>
                  )}
                </div>
              ) : (
                <></>
              )}

              {'miss_tail' === reportType && newestData ? (
                <div>
                  {!newestData.miss_tails || !newestData.miss_tails.length ? (
                    <h2>Không có đuôi câm</h2>
                  ) : (
                    <h2>Đuôi câm: {newestData.miss_tails.join(',')}</h2>
                  )}
                </div>
              ) : (
                <></>
              )}

              {'double' === reportType && newestData ? (
                <div>
                  {!newestData.all ||
                  !commonUtils.getFrequency(newestData.all, 2).length ? (
                    <h2>Không có nháy đôi</h2>
                  ) : (
                    <h2>
                      Nháy đôi:{' '}
                      {commonUtils.getFrequency(newestData.all, 2).join(',')}
                    </h2>
                  )}
                </div>
              ) : (
                <></>
              )}
              {'triple' === reportType && newestData ? (
                <div>
                  {!newestData.all ||
                  !commonUtils.getFrequency(newestData.all, 3).length ? (
                    <h2>Không có nháy ba</h2>
                  ) : (
                    <h2>
                      Nháy ba:{' '}
                      {commonUtils.getFrequency(newestData.all, 3).join(',')}
                    </h2>
                  )}
                </div>
              ) : (
                <></>
              )}
            </div>

            <div className='bacnho-report-submit-button'>
              <button type='submit'>
                <PrimaryButton
                  text={'Thống kê'}
                  onclick={() => {}}
                  isLoading={isLoading}
                />
              </button>
            </div>
          </form>
        </div>

        <div>
          <ResultList data={reportData} />
        </div>
      </main>
    </>
  );
};

export default BacnhoReport;
