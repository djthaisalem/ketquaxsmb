import { MaterialReactTable } from 'material-react-table';
import React, { useEffect, useMemo, useState } from 'react';
import './index.css';

import commonUtils from '../../utils/commonUtils';

const ResultList = (props) => {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'target',
        header: 'Target',
        size: 50,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span className='highlight-column target-column'>
            {cell.getValue()}
          </span>
        ),
        enableClickToCopy: true,
        enableSorting: false,
      },
      {
        accessorKey: 'collection',
        header: 'Cặp số',
        size: 100,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span className='highlight-column'>{cell.getValue()}</span>
        ),
        enableClickToCopy: true,
        enableSorting: false,
      },
      {
        accessorKey: 'count',
        header: 'Tổng',
        size: 50,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span className='highlight-column'>{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'miss',
        header: 'Miss',
        size: 50,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span className='highlight-column'>{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'day_1',
        header: 'Ngày 1',
        size: 50,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span className='highlight-column'>{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'day_2',
        header: 'Ngày 2',
        size: 50,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span className='highlight-column'>{cell.getValue()}</span>
        ),
      },
      {
        accessorKey: 'day_3',
        header: 'Ngày 3',
        size: 50,
        muiTableHeadCellProps: {
          align: 'center',
        },
        muiTableBodyCellProps: {
          align: 'center',
        },
        Cell: ({ cell }) => (
          <span className='highlight-column'>{cell.getValue()}</span>
        ),
      },
      // {
      //   accessorKey: 'n1d1',
      //   header: 'Số 1, Ngày 1',
      //   size: 50,
      //   muiTableHeadCellProps: {
      //     align: 'center',
      //   },
      //   muiTableBodyCellProps: {
      //     align: 'center',
      //   },
      // },
      // {
      //   accessorKey: 'n1d2',
      //   header: 'Số 1, Ngày 2',
      //   size: 50,
      //   muiTableHeadCellProps: {
      //     align: 'center',
      //   },
      //   muiTableBodyCellProps: {
      //     align: 'center',
      //   },
      // },
      // {
      //   accessorKey: 'n1d3',
      //   header: 'Số 1, Ngày 3',
      //   size: 50,
      //   muiTableHeadCellProps: {
      //     align: 'center',
      //   },
      //   muiTableBodyCellProps: {
      //     align: 'center',
      //   },
      // },
      // {
      //   accessorKey: 'n2d1',
      //   header: 'Số 2, Ngày 1',
      //   size: 50,
      //   muiTableHeadCellProps: {
      //     align: 'center',
      //   },
      //   muiTableBodyCellProps: {
      //     align: 'center',
      //   },
      // },
      // {
      //   accessorKey: 'n2d2',
      //   header: 'Số 2, Ngày 2',
      //   size: 50,
      //   muiTableHeadCellProps: {
      //     align: 'center',
      //   },
      //   muiTableBodyCellProps: {
      //     align: 'center',
      //   },
      // },
      // {
      //   accessorKey: 'n2d3',
      //   header: 'Số 2, Ngày 3',
      //   size: 50,
      //   muiTableHeadCellProps: {
      //     align: 'center',
      //   },
      //   muiTableBodyCellProps: {
      //     align: 'center',
      //   },
      // },
    ],
    [],
  );

  const [data, setData] = useState([]);

  useEffect(() => {
    setData(commonUtils.formatReportData(props.data));
  }, [props.data]);
  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      enableExpanding
      enableExpandAll
      initialState={{ density: 'compact' }}
      enableDensityToggle={false}
      enableFullScreenToggle={false}
      enableGlobalFilter={false}
      enableColumnFilters={false}
      enablePagination={false}
      enableHiding={false}
      enableSorting={true}
      enableColumnActions={false}
      muiTablePaperProps={{
        elevation: 0,
        sx: {
          borderRadius: '0',
        },
      }}
    />
  );
};

export default ResultList;
