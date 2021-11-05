'use strict';

const ProductContract = require('./lib/productContract');
const SuppyContract = require('./lib/suppyContract');

module.exports.ProductContract = ProductContract;
module.exports.SuppyContract = SuppyContract;
module.exports.contracts = [ProductContract, SuppyContract];