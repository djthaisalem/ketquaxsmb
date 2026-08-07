const origin = 'https://ketquaxsmb.online';

const pages = {
  result: {
    title: 'Kết quả XSMB hôm nay - Tra cứu xổ số miền Bắc',
    description: 'Tra cứu kết quả XSMB hôm nay theo ngày, đầy đủ các giải xổ số miền Bắc.',
  },
  analysis: {
    title: 'Thống kê XSMB - Phân tích lô tô miền Bắc',
    description: 'Thống kê tần suất lô tô, đầu đuôi và dữ liệu XSMB theo khoảng ngày.',
  },
  strategy: {
    title: 'Chiến lược XSMB - Thống kê dự đoán lô tô',
    description: 'Tra cứu chiến lược và thống kê XSMB theo dữ liệu lịch sử.',
  },
};

function setMeta(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function applySeo() {
  const url = new URL(window.location.href);
  const isAdmin = url.pathname.startsWith('/admin');
  const tab = ['result', 'analysis', 'strategy'].includes(url.searchParams.get('tab')) ? url.searchParams.get('tab') : 'result';
  const page = pages[tab];
  const canonicalPath = isAdmin ? '/admin' : url.pathname.startsWith('/app') ? `/app?tab=${tab}` : '/';
  const title = isAdmin ? 'CMS quản trị | Kết Quả XSMB' : url.pathname.startsWith('/app') ? page.title : 'Kết quả XSMB hôm nay | Tra cứu xổ số miền Bắc';
  const description = isAdmin ? 'Trang quản trị nội bộ.' : url.pathname.startsWith('/app') ? page.description : 'Kết quả XSMB hôm nay: tra cứu xổ số miền Bắc theo ngày và xem thống kê dữ liệu lịch sử.';

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', isAdmin ? 'noindex,nofollow,noarchive' : 'index,follow');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', `${origin}${canonicalPath}`);
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', `${origin}${canonicalPath}`);
}
