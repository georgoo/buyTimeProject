// Here are a few helpers to help the hbs pages

module.exports = {
  ifEquals: (value1, value2, options) => {
    if (value1 == value2) {
      return options.fn();
    } else {
      return options.inverse();
    }
  },

  ifNotEquals: (value1, value2, options) => {
    console.log("kkkkkkkkkkkkkkkkkkkkk", value1, value2);
    if (value1 != value2) {
      return options.fn();
    } else {
      return options.inverse();
    }
  },

  indexing: (index, page, limit) => {
    console.log("kjk");
    console.log(index, page, limit);
    if (page && limit) {
      return (parseInt(page) - 1) * limit + parseInt(index) + 1;
    } else {
      return parseInt(index) + 1;
    }
  },
};
