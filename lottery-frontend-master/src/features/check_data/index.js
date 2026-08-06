import React, { useState } from 'react';
import lotteryApi from '../../api/lottery.api';
import PrimaryButton from '../../components/button/primary_button';
import PrimaryInput from '../../components/input/primary_input';
import './index.css';

const CheckData = () => {
  const [from, setFrom] = useState();
  const [to, setTo] = useState();
  const [result, setResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit() {
    if (!from || !to) {
      return;
    }
    setIsLoading(true);
    const response = await lotteryApi.checkData({ from, to });
    if (response && response.length) {
      setResult(response);
    } else {
      setResult([]);
    }
    setIsLoading(false);
  }

  function fromChange(date) {
    if (!date) {
      return;
    }
    let split = date.split('-');

    setFrom(split[2] + '/' + split[1] + '/' + split[0]);
  }

  function toChange(date) {
    if (!date) {
      return;
    }
    let split = date.split('-');

    setTo(split[2] + '/' + split[1] + '/' + split[0]);
  }

  return (
    <>
      <main className='check-data-main out-let'>
        <div className='check-data-date-select'>
          <PrimaryInput
            data={{
              label: 'Từ ngày:',
              name: 'from',
              type: 'date',
            }}
            width={'150px'}
            labelBefore={true}
            onChange={fromChange}
          />

          <PrimaryInput
            data={{
              label: 'Đến ngày:',
              name: 'to',
              type: 'date',
            }}
            width={'150px'}
            labelBefore={true}
            onChange={toChange}
          />

          <div className='check-data-button'>
            <PrimaryButton
              text={'Kiểm tra'}
              onclick={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className='check-data-result'>
          <div>
            {!result.length ? (
              <h2>Dữ liệu bình thường</h2>
            ) : (
              <div>
                {result.map((ele) => (
                  <div
                    key={ele.date}
                    style={{
                      marginBottom: '0.5rem',
                      display: 'flex',
                      flexDirection: 'row',
                      alignContent: 'center',
                    }}
                  >
                    <h2>- {ele.date}: chưa có data hoặc ngày lễ </h2>
                    <a
                      href={
                        'https://xosodaiphat.com/xsmb-' +
                        ele.date.replaceAll('/', '-') +
                        '.html'
                      }
                      target='blank'
                      style={{ color: 'red' }}
                    >
                      (click để kiểm tra)
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default CheckData;
