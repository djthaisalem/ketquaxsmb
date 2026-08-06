const mainLayoutScripts = {};

mainLayoutScripts.getCurrentModule = (...routes) => {
  const route = routes.filter((ele) => ele);
  if (route.length) {
    const split = route[0].pathname
      .replace(route[0].pathnameBase + '/', '')
      .split('/');
    return {
      base:
        route[0].pathnameBase.replace('/', '') === ''
          ? 'home'
          : route[0].pathnameBase.replace('/', ''),
      subPath: split.length ? split[0] : '',
    };
  }
};

export default mainLayoutScripts;
