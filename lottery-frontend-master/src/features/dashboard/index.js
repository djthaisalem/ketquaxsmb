import { MaterialReactTable } from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import './index.css';

import lotteryApi from '../../api/lottery.api';
import PrimaryButton from '../../components/button/primary_button';
import FormDrawer from '../../components/form/drawer_form';
import drawerScripts from '../../components/form/drawer_form/scripts';
import PrimaryInput from '../../components/input/primary_input';
import commonUtils from '../../utils/commonUtils';
import dateTimeUtils from '../../utils/dateTimeUtils';

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [curDate, setCurDate] = useState();
  const [headTailData, setHeadTailData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      let result = await lotteryApi.getNewest();
      if (result && result.date_string) {
        setCurDate(
          dateTimeUtils.formatDate(
            dateTimeUtils.parseDateFromString(result.date_string),
            'yyyy-MM-dd',
          ),
        );
      }
      setData(commonUtils.formatDaylyResultData(result));
      setHeadTailData(commonUtils.getHeadTailFromResultData(result));
    }
    fetchData();
  }, []);

  async function dateChange(date) {
    setData([]);
    setHeadTailData([]);
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
      if (result && result.date_string) {
        setCurDate(
          dateTimeUtils.formatDate(
            dateTimeUtils.parseDateFromString(result.date_string),
            'yyyy-MM-dd',
          ),
        );
      }
      setData(commonUtils.formatDaylyResultData(result));
      setHeadTailData(commonUtils.getHeadTailFromResultData(result));
    }
  }

  const handleSubmit = async (data) => {
    const response = await lotteryApi.addOrUpdate(data);
    if (response && response._id) {
      return response;
    } else {
      return undefined;
    }
  };

  const handleAddMany = async (data) => {
    if (!data || !data.from_date || !data.to_date) {
      return undefined;
    }
    let split = data.from_date.split('-');
    if (split[0] < 2010 || split[0] > 3000) {
      return undefined;
    }
    let from = split[2] + '/' + split[1] + '/' + split[0];
    split = data.to_date.split('-');
    if (split[0] < 2010 || split[0] > 3000) {
      return undefined;
    }
    let to = split[2] + '/' + split[1] + '/' + split[0];

    const response = await lotteryApi.addMany({ from: from, to: to });
    if (response && response === true) {
      return response;
    } else {
      return undefined;
    }
  };

  const resultColumns = useMemo(
    () => [
      {
        accessorKey: 'price',
        header: 'Giải',
        size: 100,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
      },
      {
        accessorKey: 'result',
        header: 'Kết quả',
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span
            className='dashboard-highlight-column'
            dangerouslySetInnerHTML={{ __html: cell.getValue() }}
          />
        ),
      },
    ],
    [],
  );

  const headTailColumns = useMemo(
    () => [
      {
        accessorKey: 'head',
        header: 'Đầu',
        size: 80,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
      },
      {
        accessorKey: 'headData',
        header: 'Số',
        muiTableHeadCellProps: {
          align: 'left',
        },
        muiTableBodyCellProps: {
          align: 'left',
        },
        Cell: ({ cell }) => (
          <span
            className='dashboard-head-tail-highlight-column'
            dangerouslySetInnerHTML={{ __html: cell.getValue() }}
          />
        ),
      },
      {
        accessorKey: 'tailData',
        header: 'Số',
        muiTableHeadCellProps: {
          align: 'right',
        },
        muiTableBodyCellProps: {
          align: 'right',
        },
        Cell: ({ cell }) => (
          <span
            className='dashboard-head-tail-highlight-column'
            dangerouslySetInnerHTML={{ __html: cell.getValue() }}
          />
        ),
      },
      {
        accessorKey: 'tail',
        header: 'Đuôi',
        size: 80,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
      },
    ],
    [],
  );

  return (
    <>
      <main className='dashboard-main out-let'>
        {/* <div className='module-header'></div> */}

        <div className='dashboard-date-select'>
          <PrimaryInput
            data={{
              label: 'Ngày:',
              name: 'to',
              type: 'date',
            }}
            width={'150px'}
            labelBefore={true}
            value={curDate ? curDate : ''}
            onChange={dateChange}
          />

          <div className='d-d-s-add-button'>
            <PrimaryButton
              text={'Thêm hoặc sửa'}
              onclick={() => drawerScripts.show('add-lottery')}
            />
          </div>
          <div className='d-d-s-add-button'>
            <PrimaryButton
              text={'Thêm nhiều'}
              onclick={() => drawerScripts.show('add-range')}
            />
          </div>
        </div>

        <div className='dashboard-data'>
          <div className='d-d-result'>
            <MaterialReactTable
              columns={resultColumns}
              data={data}
              enableColumnActions={false}
              enableColumnFilters={false}
              enablePagination={false}
              enableSorting={false}
              enableBottomToolbar={false}
              enableTopToolbar={false}
              muiTableBodyRowProps={{ hover: false }}
              muiTableProps={{
                sx: {
                  border: '0.5px solid rgba(81, 81, 81, 1)',
                },
              }}
              muiTableHeadCellProps={
                {
                  // sx: {
                  //   border: '1px solid rgba(81, 81, 81, 1)',
                  // },
                }
              }
              muiTableBodyCellProps={
                {
                  // sx: {
                  //   border: '1px solid rgba(81, 81, 81, 1)',
                  // },
                }
              }
            />
          </div>
          <div className='d-d-lotto-head-tail'>
            <MaterialReactTable
              columns={headTailColumns}
              data={headTailData}
              enableColumnActions={false}
              enableColumnFilters={false}
              enablePagination={false}
              enableSorting={false}
              enableBottomToolbar={false}
              enableTopToolbar={false}
              muiTableBodyRowProps={{ hover: false }}
              muiTableProps={{
                sx: {
                  border: '0.5px solid rgba(81, 81, 81, 1)',
                },
              }}
              muiTableHeadCellProps={
                {
                  // sx: {
                  //   border: '0.5px solid rgba(81, 81, 81, 1)',
                  // },
                }
              }
              muiTableBodyCellProps={
                {
                  // sx: {
                  //   border: '0.5px solid rgba(81, 81, 81, 1)',
                  // },
                }
              }
            />
          </div>
        </div>
        <FormDrawer
          id='add-lottery'
          fields={drawerScripts.lotteryFields}
          childField={{}}
          handleSubmit={handleSubmit}
        />
        <FormDrawer
          id='add-range'
          fields={[
            {
              label: 'Từ ngày',
              type: 'date',
              required: true,
              length: 10,
              name: 'from_date',
            },
            {
              label: 'Đến ngày',
              type: 'date',
              required: true,
              length: 10,
              name: 'to_date',
            },
          ]}
          childField={{}}
          handleSubmit={handleAddMany}
        />
      </main>
    </>
  );
};

export default Dashboard;
