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

    async initSupply() {
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
        order.producerId = order_details.producerId;
        order.retailerId = order_details.retailerId;
        order.modifiedBy = await this.getCurrentUserId(ctx);
        order.currentOrderState = OrderStates.ORDER_CREATED;
        order.trackingInfo = '';
        order.docType = 'order';

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

    async assignShipper(ctx, orderId, newShipperId) {
        console.info('============= assignShipper ===========');

        if (orderId.length < 1) {
            throw new Error('orderId is required as input')
        }

        if (newShipperId.length < 1) {
            throw new Error('shipperId is required as input')
        }

        var orderAsBytes = await ctx.stub.getState(orderId);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from assignShipper: Order with orderId = ${orderId} does not exist.`);
        }

        var order = Order.deserialize(orderAsBytes);

        let userId = await this.getCurrentUserId(ctx);
        if ((userId != "admin") &&
            (userId != order.shipperId))
            throw new Error(`${userId} does not have access to create a shipment for order ${orderId}`);
        order.setStateToShipmentAssigned();
        order.shipperId = shipperId;
        order.modifiedBy = userId;

        await ctx.stub.putState(orderId, order.toBuffer());

        return order.toBuffer();
    }

    async createShipment(ctx, orderId, newTrackingInfo) {
        if (orderId.length < 1) {
            throw new Error('orderId is required as input')
        }

        if (newTrackingInfo.length < 1) {
            throw new Error('Tracking # is required as input')
        }

        var orderAsBytes = await ctx.stub.getState(orderId);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from createShipment: Order with orderId = ${orderId} does not exist.`);
        }

        var order = Order.deserialize(orderAsBytes);

        let userId = await this.getCurrentUserId(ctx);

        if ((userId != "admin") &&
            (userId != order.shipperId))
            throw new Error(`${userId} does not have access to create a shipment for order ${orderId}`);

        order.setStateToShipmentCreated();
        order.trackingInfo = newTrackingInfo;
        order.modifiedBy = userId;

        await ctx.stub.putState(orderId, order.toBuffer());

        return order.toBuffer();
    }

    async transportShipment(ctx, orderId) {
        console.info('============= transportShipment ===========');

        if (orderId.length < 1) {
            throw new Error('orderId is required as input')
        }

        var orderAsBytes = await ctx.stub.getState(orderId);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from transportShipment: Order with orderId = ${orderId} does not exist.`);
        }

        var order = Order.deserialize(orderAsBytes);

        let userId = await this.getCurrentUserId(ctx);

        if ((userId != "admin")
            && (userId != order.shipperId))
            throw new Error(`${userId} does not have access to transport shipment for order ${orderId}`);

        order.setStateToShipmentInTransit();
        order.modifiedBy = userId;

        await ctx.stub.putState(orderId, order.toBuffer());

        return order.toBuffer();
    }

    async receiveShipment(ctx, orderId) {
        console.info('============= receiveShipment ===========');

        if (orderId.length < 1) {
            throw new Error('orderId is required as input')
        }

        var orderAsBytes = await ctx.stub.getState(orderId);
        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from receiveShipment: Order with orderId = ${orderId} does not exist.`);
        }

        var order = O
        rder.deserialize(orderAsBytes);

        let userId = await this.getCurrentUserId(ctx);

        if ((userId != "admin")
            && (userId != order.retailerId))
            throw new Error(`${userId} does not have access to receive shipment for order ${orderId}`);

        order.setStateToShipmentReceived();
        order.modifiedBy = userId;

        await ctx.stub.putState(orderId, order.toBuffer());

        return order.toBuffer();
    }

    async queryOrder(ctx, orderId) {
        console.info('============= queryOrder ===========');

        if (orderId.length < 1) {
            throw new Error('orderId is required as input')
        }

        var orderAsBytes = await ctx.stub.getState(orderId);

        let queryEvent = {
            type: EVENT_TYPE,
            orderId: orderId,
            desc: "Query Order was executed for " + orderId
        };
        await ctx.stub.setEvent(EVENT_TYPE, Buffer.from(JSON.stringify(queryEvent)));

        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from queryOrder: Order with orderId = ${orderId} does not exist.`);
        }

        var order = Order.deserialize(orderAsBytes);
        let userId = await this.getCurrentUserId(ctx);

        if ((userId != "admin")
            && (userId != order.producerId)
            && (userId != order.retailerId)
            && (userId != order.shipperId))
            throw new Error(`${userId} does not have access to the details of order ${orderId}`);

        return orderAsBytes;
    }

    async queryAllOrders(ctx) {
        console.info('============= getOrderHistory ===========');

        let userId = await this.getCurrentUserId(ctx);
        let userType = await this.getCurrentUserType(ctx);

        let queryString;

        switch (userType) {

            case "admin":
            case "regulator": {
                queryString = {
                    "selector": {}
                }
                break;
            }
            case "producer": {
                queryString = {
                    "selector": {
                        "producerId": userId
                    }
                }
                break;
            }
            case "shipper": {
                queryString = {
                    "selector": {
                        "shipperId": userId
                    }
                }
                break;
            }
            case "retailer": {
                queryString = {
                    "selector": {
                        "retailerId": userId
                    }
                }
                break;
            }
            case "customer": {
                throw new Error(`${userId} does not have access to this transaction`);
            }
            default: {
                return [];
            }
        }

        console.log("In queryAllOrders: queryString = ");
        console.log(queryString);
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allOrders = [];

        while (true) {
            const order = await iterator.next();
            if (order.value && order.value.value.toString()) {
                console.log(order.value.value.toString('utf8'));

                let Record;

                try {
                    Record = JSON.parse(order.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = order.value.value.toString('utf8');
                }

                allOrders.push(Record);
            }

            if (order.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allOrders);
                return allOrders;
            }
        }
    }

    async getOrderHistory(ctx, orderId) {
        console.info('============= getOrderHistory ===========');
        if (orderId.length < 1) {
            throw new Error('orderId is required as input')
        }
        console.log("input, orderId = " + orderId);

        var orderAsBytes = await ctx.stub.getState(orderId);

        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from getOrderHistory: Order with orderId = ${orderId} does not exist.`);
        }

        var order = Order.deserialize(orderAsBytes);
        let userId = await this.getCurrentUserId(ctx);
        let userType = await this.getCurrentUserType(ctx);

        if ((userId != "admin")
            && (userType != "customer")
            && (userType != "regulator")
            && (userId != order.producerId)
            && (userId != order.retailerId)
            && (userId != order.shipperId))
            throw new Error(`${userId} does not have access to order ${orderId}`);

        if ((userType == "customer") && (order.currentOrderState != OrderStates.SHIPMENT_RECEIVED))
            throw new Error(`Information about order ${orderId} is not available to ${userId} yet. Order status needs to be SHIPMENT_RECEIVED.`);

        console.info('start GetHistoryForOrder: %s', orderId);

        const iterator = await ctx.stub.getHistoryForKey(orderId);
        const orderHistory = [];

        while (true) {
            let history = await iterator.next();

            if (history.value && history.value.value.toString()) {
                let jsonRes = {};
                jsonRes.TxId = history.value.tx_id;
                jsonRes.IsDelete = history.value.is_delete.toString();

                var d = new Date(0);
                d.setUTCSeconds(history.value.timestamp.seconds.low);
                jsonRes.Timestamp = d.toLocaleString("en-US", { timeZone: "America/Chicago" }) + " CST";

                try {
                    jsonRes.Value = JSON.parse(history.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes.Value = history.value.value.toString('utf8');
                }

                orderHistory.push(jsonRes);
            }

            if (history.done) {
                console.log('end of data');
                await iterator.close();
                console.info(orderHistory);
                return orderHistory;
            }
        }
    }

    async deleteOrder(ctx, orderId) {

        console.info('============= deleteOrder ===========');
        if (orderId.length < 1) {
            throw new Error('Order Id required as input')
        }
        console.log("orderId = " + orderId);

        var orderAsBytes = await ctx.stub.getState(orderId);

        if (!orderAsBytes || orderAsBytes.length === 0) {
            throw new Error(`Error Message from deleteOrder: Order with orderId = ${orderId} does not exist.`);
        }

        var order = Order.deserialize(orderAsBytes);
        let userId = await this.getCurrentUserId(ctx);

        if ((userId != "admin")
            && (userId != order.retailerId)
            && (userId != order.producerId))
            throw new Error(`${userId} does not have access to delete order ${orderId}`);

        await ctx.stub.deleteState(orderId);
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

    static toBuffer(data) {
        return Buffer.from(JSON.stringify(data));
    }

    static fromBuffer(buffer) {
        return Order.deserialize(Buffer.from(JSON.parse(buffer)));
    }
}

module.exports = SupplyContract;