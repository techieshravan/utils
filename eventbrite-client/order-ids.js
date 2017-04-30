const parse = require('csv-parse');
const fs = require('fs');

let ORDERS = [];
let FINAL_RES = [];

const generateOutputFile = () => {
  let orders = '';

  FINAL_RES.forEach(item => {
    if (orders) {
      orders =  `${orders}<br/><a href="http://www.eventbrite.com/order-cancel?eid=33172122712&oid=${item[0]}">${item[0]}</a>`;
    } else {
      orders = `<a href="http://www.eventbrite.com/order-cancel?eid=33172122712&oid=${item[0]}">${item[0]}</a>`
    }
  });

  orders = orders + '<br/><br/>';

  FINAL_RES.forEach(item => {
      orders =  `${orders}<br/><a href="http://www.eventbrite.com/order-delete?eid=33172122712&oid=${item[0]}">${item[0]}</a>`;
  });

  fs.writeFile(__dirname + '/orders.html', orders, (err) => {
    if (err) throw err;
    console.log('The orders.html file has been saved!');
    process.exit();
  });
};

const parseData = parse({delimiter: ','}, function (err, data) {

  for (let i = 0; i < data.length; ++i) {

    // var res = ORDERS.filter(order => order[1] === data[i][0] && order[2] === data[i][1] && order[3] === data[i][2]);

    var res = ORDERS.filter(order => order[3] === data[i][2]);

    FINAL_RES.push(...res);
  }

  generateOutputFile();

});

const parser = parse({delimiter: ','}, function (err, data) {

  ORDERS = data;

  fs.createReadStream(__dirname + '/COMPARAE_DATA.csv').pipe(parseData);

});

fs.createReadStream(__dirname + '/ORDERS_ORGINAL.csv').pipe(parser);