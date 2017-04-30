var axios = require('axios');
const fs = require('fs');

axios.defaults.baseURL = 'https://www.eventbriteapi.com/v3/';
axios.defaults.headers.common['Authorization'] = '';

let results = [];
let pageNumber = 1;
let intervalObject;

const generateOutputFile = () => {
  let orders = '';

  results.forEach(item => {
    if (orders) {
      orders = orders + '\r\n' + item.id + ',' + item.first_name + ',' + item.last_name + ',' + item.email;
    } else {
      orders = item.id + ',' + item.first_name + ',' + item.last_name + ',' + item.email;
    }
  });

  fs.writeFile(__dirname + '/ORDERS_ORGINAL.csv', orders, (err) => {
    if (err) throw err;
    console.log('The ORDERS_ORGINAL.csv file has been saved!');
    process.exit();
  });
};

const getOrders = (page_number) => {
  axios
      .post(`events/33172122712/orders?page=${page_number}`)
      .then(response => {

        const result = response.data;

        results.push(...result.orders);

        console.log(page_number);

        if (page_number === result.pagination.page_count) {
          clearInterval(intervalObject);
          generateOutputFile();
        }
      });
};

const init = () => {

  axios
      .post(`events/33172122712/orders`)
      .then(response => {
        results.push(...response.data.orders);

        console.log(pageNumber);

        intervalObject = setInterval(() => {
          pageNumber += 1;
          getOrders(pageNumber);
        }, 2000);
      });

};

init();
