import React, { useLayoutEffect, useState } from 'react';
import categoryAPI from '../../../api/category.api';
import drawerScripts from '../../../components/form/drawer_form/scripts';
import './index.css';
import categoryScripts from './scripts';

import PrimaryButton from '../../../components/button/primary_button';
import FormDrawer from '../../../components/form/drawer_form';
import List from '../../../components/list';

const Category = () => {
  const [page, setPage] = useState(1);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleSubmit = async (data) => {
    const response = await categoryAPI.add(data);
    const result = categoryScripts.handleAfterCreate(response);
    if (result && result.length) {
      if (page === 1) {
        let newList = result.concat(list);
        if ((newList.length = 11)) {
          newList.splice(-1);
        }
        setList(newList);
      } else {
        const listCate = await categoryAPI.search({}, { page, size: 10 });
        setList(categoryScripts.convertToListFormat(listCate));
      }
      drawerScripts.hide('category');
    }
  };

  useLayoutEffect(() => {
    async function fetchData() {
      setLoading(true);
      const listCate = await categoryAPI.search({}, { page, size: 10 });
      setList(categoryScripts.convertToListFormat(listCate));
      setLoading(false);
    }
    fetchData();
  }, [page]);

  return (
    <>
      <main className='setting-category out-let'>
        <div className='setting-module-title module-title'>
          <h1>
            <span>Cài đặt</span>
            <span className='split-arrow material-symbols-outlined'>
              arrow_right
            </span>
            <span>Danh mục</span>
          </h1>

          <PrimaryButton
            text={'Thêm mới'}
            fontSize={1}
            onclick={() => drawerScripts.show('category')}
          />
        </div>
        {loading ? (
          <div>loading</div>
        ) : (
          <div className='category-list'>
            <List data={list} listHeader={categoryScripts.displayConfig} />
          </div>
        )}
        <FormDrawer
          id='category'
          fields={categoryScripts.fields}
          handleSubmit={handleSubmit}
          haveChild={true}
          childField={categoryScripts.childField}
        />
      </main>
    </>
  );
};

export default Category;
