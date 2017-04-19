const parse = require('csv-parse');
const fs = require('fs');

let duplicateRecords = [];
let nonDuplicateRecords = [];
const searchItemIndex = 2;

const searchList = (items) => {

  const currentItem = items[0][searchItemIndex];
  const duplicateItems = items.filter(item => currentItem === item[searchItemIndex]);

  if (duplicateItems.length > 1) {
    duplicateRecords.push(...duplicateItems);
    return items.filter(item => currentItem !== item[searchItemIndex]);
  } else {
    nonDuplicateRecords.push(items[0]);
    items.splice(0, 1);
    return items;
  }

};

const parser = parse({delimiter: ','}, function (err, data) {

  let items = data;

  while (items.length > 0) {
    items = searchList(items);
  }

  let duplicateRecordString = '';

  duplicateRecords.forEach(item => {
    if (duplicateRecordString) {
      duplicateRecordString = duplicateRecordString + '\r\n' + item.join();
    } else {
      duplicateRecordString = item.join();
    }
  });

  fs.writeFile(__dirname + '/DuplicateRecords.csv', duplicateRecordString, (err) => {
    if (err) throw err;
    console.log('The DuplicateRecords.csv file has been saved!');
  });

  let nonDuplicateRecordsString = '';

  nonDuplicateRecords.forEach(item => {
    if (nonDuplicateRecordsString) {
      nonDuplicateRecordsString = nonDuplicateRecordsString + '\r\n' + item.join();
    } else {
      nonDuplicateRecordsString = item.join();
    }
  });

  fs.writeFile(__dirname + '/NonDuplicateRecords.csv', nonDuplicateRecordsString, (err) => {
    if (err) throw err;
    console.log('The NonDuplicateRecords.csv file has been saved!');
  });

});

fs.createReadStream(__dirname + '/LIST.csv').pipe(parser);
