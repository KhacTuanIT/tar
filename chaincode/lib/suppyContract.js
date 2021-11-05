'use strict';
const { Contract, Context } = require('fabric-contract-api');

const Order = require('./order.js');
const OrderStates = require('./order.js').orderStates;

const EVENT_TYPE = "bcpocevent";

const DUPLICATE_ORDER_ID = 400;
const ORDER_ID_NOT_FOUND = 404;

class SupplyContext extends Context {
    constructor() {
        super();
    }
}

class SupplyContract extends Contract {
    constructor() {
        super('teco.papernet.supplycontract');
    }

    createContext() {
        return new SupplyContext();
    }

    async init() {
        console.log('instantiate the contract');
    }

    async orderProduct(ctx, args) {
        let userType = await this.getCurrentUserType(ctx);

        if ((userType != "admin") &&
            (userType != "producer") &&
            (userType != "retailer"))
            throw new Error(`This user does not have access to create an order`);

        const order_details = JSON.parse(args);
        const orderId = order_details.orderId;

        console.log("incoming asset fields: " + JSON.stringify(order_details));
        var orderAsBytes = await ctx.stub.getState(orderId);
        if (orderAsBytes && orderAsBytes.length > 0) {
            throw new Error(`Error Message from orderProduct. Order with orderId = ${orderId} already exists.`);
        }

        let order = Order.createInstance(orderId);
        order.productId = order_details.productId;
        order.price = order_details.price.toString();
        order.quantity = order_details.quantity.toString();
        order.manufacturerId = order_details.manufacturerId;
        order.retailerId = order_details.retailerId;
        order.modifiedBy = await this.getCurrentUserId(ctx);
        order.currentOrderState = OrderStates.ORDER_CREATED;
        order.trackingInfo = '';

        await ctx.stub.putState(orderId, order.toBuffer());

        const event_obj = order;
        event_obj.event_type = "createOrder";

        try {
            await ctx.stub.setEvent(EVENT_TYPE, event_obj.toBuffer());
        }
        catch (error) {
            console.log("Error in sending event");
        }
        finally {
            console.log("Attempted to send event = ", order);
        }

        return order.toBuffer();
    }

    async receiveOrder(ctx, orderId) {
        console.info('============= receiveOrder ===========');

        if (orderId.length < 1) {
            throw new Error('orderId is required as input')
        }

        var orderAsBytes = await ctx.stub.getState(orderId);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from receiveOrder: Order with orderId = ${orderId} does not exist.`);
        }

        var order = Order.deserialize(orderAsBytes);

        let userId = await this.getCurrentUserId(ctx);

        if ((userId != "admin") &&
            (userId != order.producerId))
            throw new Error(`${userId} does not have access to receive order ${orderId}`);

        order.setStateToOrderReceived();

        order.modifiedBy = userId;

        await ctx.stub.putState(orderId, order.toBuffer());

        return order.toBuffer();
    }

    /**
      * getCurrentUserId
      * To be called by application to get the type for a user who is logged in
      *
      * @param {Context} ctx the transaction context
      * Usage:  getCurrentUserId ()
     */
    async getCurrentUserId(ctx) {

        let id = [];
        id.push(ctx.clientIdentity.getID());
        var begin = id[0].indexOf("/CN=");
        var end = id[0].lastIndexOf("::/C=");
        let userid = id[0].substring(begin + 4, end);
        return userid;
    }

    /**
      * getCurrentUserType
      * To be called by application to get the type for a user who is logged in
      *
      * @param {Context} ctx the transaction context
      * Usage:  getCurrentUserType ()
     */
    async getCurrentUserType(ctx) {

        let userid = await this.getCurrentUserId(ctx);

        //  check user id;  if admin, return type = admin;
        //  else return value set for attribute "type" in certificate;
        if (userid == "admin") {
            return userid;
        }
        return ctx.clientIdentity.getAttributeValue("usertype");
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    static fromBuffer(buffer) {
        return Order.deserialize(Buffer.from(JSON.parse(buffer)));
    }
}

module.exports = SupplyContract;